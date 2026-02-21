

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import numpy as np
import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau
from sklearn.metrics import roc_auc_score
import joblib
from pathlib import Path

from utils.config import LSTM_CONFIG, MODELS_DIR
from utils.logger import logger
from data.feature_builder import load_dataset
from ml.dataset import FireSequenceDataset, make_dataloader
from ml.model import build_model


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def train():
    logger.info("═══ PyroWatch LSTM Training ═══")
    logger.info(f"Device: {DEVICE}")

    df = load_dataset()
    ds = FireSequenceDataset(df)
    X_train, y_train, X_val, y_val, X_test, y_test = ds.get_splits()

    batch_size = LSTM_CONFIG["batch_size"]
    train_loader = make_dataloader(X_train, y_train, batch_size, shuffle=True)
    val_loader   = make_dataloader(X_val,   y_val,   batch_size, shuffle=False)
    test_loader  = make_dataloader(X_test,  y_test,  batch_size, shuffle=False)

    logger.info(
        f"Batches — train: {len(train_loader)}, "
        f"val: {len(val_loader)}, test: {len(test_loader)}"
    )

    model = build_model(LSTM_CONFIG).to(DEVICE)
    logger.info(f"Model parameters: {model.count_parameters():,}")

    fire_ratio = (y_train > 0.5).mean()
    pos_weight = torch.tensor([(1 - fire_ratio) / (fire_ratio + 1e-6)], device=DEVICE)
    logger.info(f"Class balance — fire: {fire_ratio:.1%}, pos_weight: {pos_weight.item():.2f}")

    criterion = nn.BCELoss()
    optimizer = Adam(model.parameters(), lr=LSTM_CONFIG["learning_rate"], weight_decay=1e-5)
    scheduler = ReduceLROnPlateau(optimizer, mode="min", patience=3, factor=0.5, verbose=True)

    best_val_loss = float("inf")
    patience_counter = 0
    best_model_path = MODELS_DIR / "pyrowatch_lstm_best.pt"
    history = {"train_loss": [], "val_loss": [], "val_auc": []}

    logger.info(f"\nTraining for up to {LSTM_CONFIG['epochs']} epochs...")
    logger.info(f"Early stop patience: {LSTM_CONFIG['early_stop_patience']} epochs\n")

    for epoch in range(1, LSTM_CONFIG["epochs"] + 1):

        model.train()
        train_losses = []
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
            optimizer.zero_grad()
            preds = model(X_batch)
            loss  = criterion(preds, y_batch)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_losses.append(loss.item())

        model.eval()
        val_losses, val_preds, val_true = [], [], []
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
                preds = model(X_batch)
                loss  = criterion(preds, y_batch)
                val_losses.append(loss.item())
                val_preds.extend(preds.cpu().numpy().flatten())
                val_true.extend(y_batch.cpu().numpy().flatten())

        train_loss = np.mean(train_losses)
        val_loss   = np.mean(val_losses)

        val_arr    = np.array(val_true)
        threshold  = np.median(val_arr)
        val_binary = (val_arr > threshold).astype(int)
        n_pos, n_neg = val_binary.sum(), (1 - val_binary).sum()
        if n_pos > 0 and n_neg > 0:
            val_auc = roc_auc_score(val_binary, val_preds)
        else:
            val_auc = history["val_auc"][-1] if history["val_auc"] else 0.5
            logger.debug(f"Epoch {epoch}: single-class val (pos={n_pos}, neg={n_neg}) — skipping AUC")

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_auc"].append(val_auc)

        scheduler.step(val_loss)

        flag = ""
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save({
                "epoch":      epoch,
                "model_state": model.state_dict(),
                "optimizer_state": optimizer.state_dict(),
                "val_loss":   val_loss,
                "val_auc":    val_auc,
                "config":     LSTM_CONFIG,
            }, best_model_path)
            flag = " ← best"
        else:
            patience_counter += 1

        if epoch % 5 == 0 or epoch == 1 or flag:
            lr = optimizer.param_groups[0]["lr"]
            logger.info(
                f"Epoch {epoch:3d}/{LSTM_CONFIG['epochs']} | "
                f"train_loss: {train_loss:.4f} | "
                f"val_loss: {val_loss:.4f} | "
                f"val_AUC: {val_auc:.4f} | "
                f"lr: {lr:.2e}{flag}"
            )

        if patience_counter >= LSTM_CONFIG["early_stop_patience"]:
            logger.info(f"\nEarly stopping at epoch {epoch} — val_loss stalled for {patience_counter} epochs")
            break

    logger.info(f"\nLoading best model from: {best_model_path}")
    checkpoint = torch.load(best_model_path, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()

    test_preds, test_true = [], []
    with torch.no_grad():
        for X_batch, y_batch in test_loader:
            X_batch = X_batch.to(DEVICE)
            preds   = model(X_batch)
            test_preds.extend(preds.cpu().numpy().flatten())
            test_true.extend(y_batch.numpy().flatten())

    test_arr    = np.array(test_true)
    threshold   = np.median(test_arr)
    test_binary = (test_arr > threshold).astype(int)
    n_pos, n_neg = test_binary.sum(), (1 - test_binary).sum()
    if n_pos > 0 and n_neg > 0:
        test_auc = roc_auc_score(test_binary, test_preds)
    else:
        test_auc = 0.5
        logger.warning("Test set has only one class — AUC not meaningful. Need more diverse data.")

    import json
    history_path = MODELS_DIR / "training_history.json"
    with open(history_path, "w") as f:
        json.dump({**history, "test_auc": test_auc, "best_val_loss": best_val_loss}, f, indent=2)

    best_epoch = checkpoint["epoch"]
    best_auc   = checkpoint["val_auc"]

    logger.info("\n" + "═" * 50)
    logger.info("  TRAINING COMPLETE")
    logger.info("═" * 50)
    logger.info(f"  Best epoch:     {best_epoch}")
    logger.info(f"  Best val loss:  {best_val_loss:.4f}")
    logger.info(f"  Best val AUC:   {best_auc:.4f}")
    logger.info(f"  Test AUC:       {test_auc:.4f}")
    logger.info("─" * 50)

    target = 0.82
    if test_auc >= target:
        logger.info(f"  ✅ TARGET MET — AUC {test_auc:.4f} ≥ {target}")
        logger.info("  Ready for Phase 3 (API integration)")
    else:
        logger.info(f"  ⚠️  AUC {test_auc:.4f} < {target} — see troubleshooting below")
        _print_troubleshooting(test_auc)

    logger.info(f"\n  Model saved: {best_model_path}")
    logger.info(f"  Scaler saved: {MODELS_DIR / 'scaler.joblib'}")
    logger.info(f"  History saved: {history_path}")
    logger.info("═" * 50 + "\n")

    return test_auc, history


def _print_troubleshooting(auc: float):
    logger.info("\n  Troubleshooting guide:")
    if auc < 0.6:
        logger.info("  → AUC near 0.5 = model predicting randomly")
        logger.info("    Check for data leakage at train/val split boundary")
        logger.info("    Confirm fire_active has both 0s and 1s in each split")
    elif auc < 0.75:
        logger.info("  → Moderate AUC — try these in order:")
        logger.info("    1. Increase epochs (remove early stopping patience limit)")
        logger.info("    2. Add more fire data (expand date range in config.py)")
        logger.info("    3. Add lag features: fire_pixels_lag1h, fire_growth_rate")
    else:
        logger.info("  → Close to target. Try:")
        logger.info("    1. Reduce LR to 5e-5")
        logger.info("    2. Add BatchNorm after LSTM")
        logger.info("    3. Increase hidden_size to 256")


if __name__ == "__main__":
    train()