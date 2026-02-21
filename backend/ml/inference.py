
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import numpy as np
import joblib
import json
from pathlib import Path

from utils.config import LSTM_CONFIG, MODELS_DIR, RISK_THRESHOLDS, ALERT_TIERS
from utils.logger import logger


_model  = None
_scaler = None


def _load_model():
    global _model, _scaler

    if _model is not None:
        return _model, _scaler

    try:
        import torch
        from ml.model import build_model

        model_path  = MODELS_DIR / "pyrowatch_lstm_best.pt"
        scaler_path = MODELS_DIR / "scaler.joblib"

        if not model_path.exists():
            raise FileNotFoundError(
                f"No trained model at {model_path}. Run: python backend/ml/train.py"
            )

        checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
        model = build_model(checkpoint.get("config", LSTM_CONFIG))
        model.load_state_dict(checkpoint["model_state"])
        model.eval()

        scaler = joblib.load(scaler_path)

        _model  = model
        _scaler = scaler
        logger.info(f"Model loaded — best epoch: {checkpoint.get('epoch')}, val_AUC: {checkpoint.get('val_auc', '?'):.4f}")
        return _model, _scaler

    except ImportError:
        logger.warning("torch not installed — inference unavailable")
        return None, None


def predict_risk(feature_sequence: np.ndarray) -> dict:
    import torch

    model, scaler = _load_model()

    if model is None:
        return _fallback_prediction(feature_sequence)

    if feature_sequence.shape != (LSTM_CONFIG["sequence_length"], LSTM_CONFIG["n_features"]):
        raise ValueError(
            f"Expected shape ({LSTM_CONFIG['sequence_length']}, {LSTM_CONFIG['n_features']}), "
            f"got {feature_sequence.shape}"
        )

    seq_2d = feature_sequence.reshape(-1, LSTM_CONFIG["n_features"])
    scaled = scaler.transform(seq_2d).reshape(
        LSTM_CONFIG["sequence_length"], LSTM_CONFIG["n_features"]
    )

    x = torch.tensor(scaled, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        risk_score = model(x).item()

    return _format_prediction(risk_score)


def _format_prediction(risk_score: float) -> dict:
    risk_level = "low"
    for level, (low, high) in RISK_THRESHOLDS.items():
        if low <= risk_score < high:
            risk_level = level
            break

    alert_tier = "none"
    if risk_score >= ALERT_TIERS["emergency"]:
        alert_tier = "emergency"
    elif risk_score >= ALERT_TIERS["warning"]:
        alert_tier = "warning"
    elif risk_score >= ALERT_TIERS["watch"]:
        alert_tier = "watch"

    return {
        "risk_score":  round(risk_score, 4),
        "risk_level":  risk_level,
        "alert_tier":  alert_tier,
        "forecast_hours": LSTM_CONFIG["forecast_horizon"],
        "confidence":  "high" if 0.1 < risk_score < 0.9 else "low",
    }


def _fallback_prediction(feature_sequence: np.ndarray) -> dict:
    last = feature_sequence[-1]
    fire_pixels = last[0]
    wind_speed  = last[2]
    humidity    = last[4]

    score = min(1.0, (fire_pixels / 200) * 0.6 + (1 - humidity / 100) * 0.4)
    return _format_prediction(float(score))


def predict_grid(
    sequences: np.ndarray,
    lats: np.ndarray,
    lons: np.ndarray,
) -> list[dict]:
    import torch

    model, scaler = _load_model()
    results = []

    if model is None:
        for lat, lon, seq in zip(lats, lons, sequences):
            pred = _fallback_prediction(seq)
            results.append({"lat": lat, "lon": lon, **pred})
        return results

    n, seq_len, n_feat = sequences.shape
    scaled = scaler.transform(sequences.reshape(-1, n_feat)).reshape(n, seq_len, n_feat)
    X = torch.tensor(scaled, dtype=torch.float32)

    with torch.no_grad():
        scores = model(X).cpu().numpy().flatten()

    for lat, lon, score in zip(lats, lons, scores):
        pred = _format_prediction(float(score))
        results.append({"lat": float(lat), "lon": float(lon), **pred})

    return results


def get_model_info() -> dict:
    model_path   = MODELS_DIR / "pyrowatch_lstm_best.pt"
    history_path = MODELS_DIR / "training_history.json"

    if not model_path.exists():
        return {"status": "not_trained", "message": "Run python backend/ml/train.py"}

    try:
        import torch
        checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
        info = {
            "status":       "ready",
            "best_epoch":   checkpoint.get("epoch"),
            "val_auc":      checkpoint.get("val_auc"),
            "val_loss":     checkpoint.get("val_loss"),
        }
        if history_path.exists():
            with open(history_path) as f:
                history = json.load(f)
            info["test_auc"] = history.get("test_auc")
        return info
    except Exception as e:
        return {"status": "error", "message": str(e)}