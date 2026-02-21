

import torch
import torch.nn as nn


class PyroWatchLSTM(nn.Module):
    def __init__(
        self,
        n_features:  int = 10,
        hidden_size: int = 128,
        num_layers:  int = 2,
        dropout:     float = 0.2,
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers  = num_layers

        self.lstm = nn.LSTM(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )

        self.head = nn.Sequential(
            nn.BatchNorm1d(hidden_size),
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        batch_size = x.size(0)

        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_size, device=x.device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_size, device=x.device)

        out, _ = self.lstm(x, (h0, c0))

        last = out[:, -1, :]

        return self.head(last)

    def count_parameters(self) -> int:
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


def build_model(config: dict) -> "PyroWatchLSTM":
    model = PyroWatchLSTM(
        n_features  = config["n_features"],
        hidden_size = config["hidden_size"],
        num_layers  = config["num_layers"],
        dropout     = config["dropout"],
    )
    return model