

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Optional

from utils.config import DEMO_FIRE, LSTM_CONFIG, RISK_THRESHOLDS, ALERT_TIERS
from utils.logger import logger


RISK_COLORS = {
    "low":      "#27AE60",
    "moderate": "#F39C12",
    "high":     "#E67E22",
    "extreme":  "#C0392B",
}


def build_risk_geojson(
    df_sequence: pd.DataFrame,
    grid_step: float = 0.08,
    bbox: Optional[dict] = None,
) -> dict:
    if bbox is None:
        bbox = DEMO_FIRE["bbox"]

    lats = np.arange(bbox["min_lat"], bbox["max_lat"], grid_step)
    lons = np.arange(bbox["min_lon"], bbox["max_lon"], grid_step)

    features = []

    feature_cols = LSTM_CONFIG["features"]
    if len(df_sequence) < 24:
        logger.warning(f"Only {len(df_sequence)} rows — padding to 24")
        pad = pd.DataFrame([df_sequence.iloc[0]] * (24 - len(df_sequence)))
        df_sequence = pd.concat([pad, df_sequence]).reset_index(drop=True)

    base_seq = df_sequence[feature_cols].tail(24).values.astype(np.float32)

    center_lat = DEMO_FIRE["center_lat"]
    center_lon = DEMO_FIRE["center_lon"]

    for lat in lats:
        for lon in lons:
            dist = np.sqrt((lat - center_lat)**2 + (lon - center_lon)**2)
            attenuation = np.exp(-dist * 1.8)
            seq = base_seq.copy()
            seq[:, 0] = seq[:, 0] * attenuation
            seq[:, 0] += np.random.normal(0, 1) * attenuation

            risk = _score_sequence(seq)
            risk_level, color = _classify_risk(risk)
            alert_tier = _get_alert_tier(risk)

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [_cell_polygon(lat, lon, grid_step)],
                },
                "properties": {
                    "lat":        round(float(lat), 4),
                    "lon":        round(float(lon), 4),
                    "risk_score": round(float(risk), 4),
                    "risk_level": risk_level,
                    "alert_tier": alert_tier,
                    "color":      color,
                    "opacity":    _risk_opacity(risk),
                },
            })

    logger.info(f"Built GeoJSON: {len(features)} grid cells, "
                f"step={grid_step}°, bbox={bbox['min_lat']:.1f}–{bbox['max_lat']:.1f}N")
    return {"type": "FeatureCollection", "features": features}


def build_replay_frames(df: pd.DataFrame, n_frames: int = 48) -> list[dict]:
    frames = []
    feature_cols = LSTM_CONFIG["features"]
    SEQ = LSTM_CONFIG["sequence_length"]

    start_idx = SEQ
    end_idx   = min(start_idx + n_frames, len(df))

    logger.info(f"Building {end_idx - start_idx} replay frames...")

    for i in range(start_idx, end_idx):
        window = df[feature_cols].iloc[i - SEQ : i].values.astype(np.float32)
        ts     = df["timestamp"].iloc[i]

        base_risk = _score_sequence(window)
        fire_px   = int(df["fire_pixels"].iloc[i])
        hour_num  = i - start_idx

        geojson = _build_frame_geojson(window, base_risk, fire_px)

        frames.append({
            "frame":      hour_num,
            "timestamp":  ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
            "hour_label": f"Hour +{hour_num}",
            "risk_score": round(float(base_risk), 4),
            "risk_level": _classify_risk(base_risk)[0],
            "alert_tier": _get_alert_tier(base_risk),
            "fire_pixels": fire_px,
            "geojson":    geojson,
            "summary": {
                "max_risk":   round(float(base_risk), 4),
                "fire_pixels": fire_px,
                "alert":      _get_alert_tier(base_risk),
            },
        })

    logger.info(f"Replay: {len(frames)} frames built")
    return frames


def _build_frame_geojson(base_seq: np.ndarray, base_risk: float, fire_pixels: int) -> dict:
    bbox      = DEMO_FIRE["bbox"]
    grid_step = 0.12
    lats      = np.arange(bbox["min_lat"], bbox["max_lat"], grid_step)
    lons      = np.arange(bbox["min_lon"], bbox["max_lon"], grid_step)
    center_lat = DEMO_FIRE["center_lat"]
    center_lon = DEMO_FIRE["center_lon"]

    features = []
    for lat in lats:
        for lon in lons:
            dist        = np.sqrt((lat - center_lat)**2 + (lon - center_lon)**2)
            attenuation = np.exp(-dist * 1.8)
            seq = base_seq.copy()
            seq[:, 0] = seq[:, 0] * attenuation
            risk = float(np.clip(base_risk * attenuation + np.random.normal(0, 0.03), 0, 1))
            risk_level, color = _classify_risk(risk)

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [_cell_polygon(lat, lon, grid_step)],
                },
                "properties": {
                    "risk_score": round(risk, 3),
                    "risk_level": risk_level,
                    "color":      color,
                    "opacity":    _risk_opacity(risk),
                },
            })

    return {"type": "FeatureCollection", "features": features}


def _score_sequence(seq: np.ndarray) -> float:
    try:
        from ml.inference import predict_risk
        result = predict_risk(seq)
        return result["risk_score"]
    except Exception:
        last = seq[-1]
        fire_norm = min(1.0, last[0] / 50.0)
        wind_norm = min(1.0, abs(last[2]) * 0.5 + abs(last[3]) * 0.5)
        dry_norm  = min(1.0, (1 - (last[4] / 100)) if last[4] > 1 else 0.7)
        return float(np.clip(0.5 * fire_norm + 0.3 * wind_norm + 0.2 * dry_norm, 0, 1))


def _classify_risk(score: float) -> tuple[str, str]:
    for level, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= score < hi:
            return level, RISK_COLORS[level]
    return "extreme", RISK_COLORS["extreme"]


def _get_alert_tier(score: float) -> str:
    if score >= ALERT_TIERS["emergency"]: return "emergency"
    if score >= ALERT_TIERS["warning"]:   return "warning"
    if score >= ALERT_TIERS["watch"]:     return "watch"
    return "none"


def _risk_opacity(score: float) -> float:
    return round(float(np.clip(0.2 + score * 0.6, 0.1, 0.85)), 2)


def _cell_polygon(lat: float, lon: float, step: float) -> list:
    return [
        [lon,        lat],
        [lon + step, lat],
        [lon + step, lat + step],
        [lon,        lat + step],
        [lon,        lat],
    ]