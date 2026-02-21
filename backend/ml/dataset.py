import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler

from utils.config import LSTM_CONFIG, MODELS_DIR
from utils.logger import logger


class FireSequenceDataset:

    def __init__(self, df: pd.DataFrame):
        self.seq_len  = LSTM_CONFIG["sequence_length"]
        self.horizon  = LSTM_CONFIG["forecast_horizon"]
        self.features = LSTM_CONFIG["features"]
        self.df       = df.sort_values("timestamp").reset_index(drop=True)
        self.scaler   = StandardScaler()

        self._validate_df()

    def _validate_df(self):
        missing = [f for f in self.features if f not in self.df.columns]
        if missing:
            raise ValueError(f"DataFrame missing LSTM features: {missing}")
        if "risk_score" not in self.df.columns:
            raise ValueError("DataFrame missing 'risk_score' target column")
        logger.info(f"Dataset: {len(self.df)} rows, {len(self.features)} features")

    def build_sequences(self) -> tuple[np.ndarray, np.ndarray]:
        feat_arr   = self.df[self.features].values.astype(np.float32)
        target_arr = self.df["risk_score"].values.astype(np.float32)

        n = len(feat_arr)
        max_i = n - self.seq_len - self.horizon + 1

        if max_i <= 0:
            raise ValueError(
                f"Not enough rows to build sequences. "
                f"Need > {self.seq_len + self.horizon}, got {n}"
            )

        X = np.stack([feat_arr[i : i + self.seq_len] for i in range(max_i)])
        y = np.array([target_arr[i + self.seq_len + self.horizon - 1] for i in range(max_i)])

        logger.info(f"Sequences built: X={X.shape}, y={y.shape}")
        return X, y

    def get_splits(
        self,
        train_ratio: float = 0.70,
        val_ratio:   float = 0.15,
    ) -> tuple:
        X, y = self.build_sequences()
        n = len(X)

        train_end = int(n * train_ratio)
        val_end   = int(n * (train_ratio + val_ratio))

        X_train, y_train = X[:train_end],       y[:train_end]
        X_val,   y_val   = X[train_end:val_end], y[train_end:val_end]
        X_test,  y_test  = X[val_end:],          y[val_end:]

        logger.info(
            f"Split sizes — "
            f"train: {len(X_train)}, val: {len(X_val)}, test: {len(X_test)}"
        )

        n_tr, seq, n_feat = X_train.shape
        self.scaler.fit(X_train.reshape(-1, n_feat))

        X_train = self.scaler.transform(X_train.reshape(-1, n_feat)).reshape(n_tr, seq, n_feat)
        X_val   = self.scaler.transform(X_val.reshape(-1, n_feat)).reshape(len(X_val), seq, n_feat)
        X_test  = self.scaler.transform(X_test.reshape(-1, n_feat)).reshape(len(X_test), seq, n_feat)

        scaler_path = MODELS_DIR / "scaler.joblib"
        joblib.dump(self.scaler, scaler_path)
        logger.info(f"Scaler saved: {scaler_path}")

        return X_train, y_train, X_val, y_val, X_test, y_test


def to_tensors(X, y):
    import torch
    return (
        torch.tensor(X, dtype=torch.float32),
        torch.tensor(y, dtype=torch.float32).unsqueeze(1),
    )


def make_dataloader(X, y, batch_size: int, shuffle: bool = False):
    import torch
    from torch.utils.data import TensorDataset, DataLoader
    Xt, yt = to_tensors(X, y)
    ds = TensorDataset(Xt, yt)
    return DataLoader(ds, batch_size=batch_size, shuffle=shuffle)