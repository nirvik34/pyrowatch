

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd

from utils.config import validate_keys, APP_ENV, DEMO_FIRE, LSTM_CONFIG
from utils.logger import logger

app = FastAPI(
    title="PyroWatch AI",
    description=(
        "AI-Driven Wildfire Early Warning System\n\n"
        "**Hackathon:** EnviroCast GEO | **Theme:** From Insight to Impact\n\n"
        "**Demo case:** Dixie Fire, Plumas County CA, July 2021\n\n"
        "Model AUC: **0.9727** | Lead time: **6 hours** ahead of fire spread"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_dataset      = None
_replay_cache = {}

def _get_dataset() -> pd.DataFrame:
    global _dataset
    if _dataset is None:
        from data.feature_builder import load_dataset
        _dataset = load_dataset()
    return _dataset


@app.on_event("startup")
async def startup():
    logger.info("=== PyroWatch AI Phase 3 starting ===")
    logger.info(f"  Environment: {APP_ENV}")
    validate_keys()
    try:
        from ml.inference import get_model_info, predict_risk
        info = get_model_info()
        if info["status"] == "ready":
            dummy = np.zeros((LSTM_CONFIG["sequence_length"], LSTM_CONFIG["n_features"]))
            predict_risk(dummy)
            logger.info(f"  Model warmed up — val_AUC: {info.get('val_auc', 0):.4f}")
        else:
            logger.warning(f"  Model not ready: {info}")
    except Exception as e:
        logger.warning(f"  Model warmup skipped: {e}")
    logger.info("  Swagger UI: http://localhost:8000/docs")
    logger.info("  Ready to serve requests")


@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "PyroWatch AI", "version": "1.0.0", "phase": 3}


@app.get("/status", tags=["System"])
async def status():
    from utils.config import PROCESSED_DIR
    from ml.inference import get_model_info
    return {
        "dataset_ready": (PROCESSED_DIR / "dataset.csv").exists(),
        "model_info":    get_model_info(),
        "demo_fire":     DEMO_FIRE["name"],
        "api_ready":     True,
    }


@app.get("/model-info", tags=["System"])
async def model_info():
    from ml.inference import get_model_info
    return get_model_info()


@app.get("/risk-map", tags=["Prediction"])
async def risk_map(
    date:      str   = Query(default="2021-07-15", description="YYYY-MM-DD"),
    region:    str   = Query(default="CA"),
    grid_step: float = Query(default=0.08,         description="Grid resolution in degrees"),
):
    try:
        df = _get_dataset()
        df = df.copy()
        df["date_str"] = pd.to_datetime(df["timestamp"]).dt.strftime("%Y-%m-%d")
        day_df = df[df["date_str"] <= date].tail(24)
        if len(day_df) == 0:
            day_df = df.tail(24)

        from api.geo import build_risk_geojson, _get_alert_tier, _classify_risk
        geojson = build_risk_geojson(day_df, grid_step=grid_step)
        risks   = [f["properties"]["risk_score"] for f in geojson["features"]]
        max_risk = max(risks) if risks else 0
        alert    = _get_alert_tier(max_risk)
        level, _ = _classify_risk(max_risk)

        return {
            "date": date, "region": region,
            "n_cells": len(geojson["features"]),
            "max_risk": round(max_risk, 4),
            "risk_level": level, "alert_tier": alert,
            "geojson": geojson,
        }
    except Exception as e:
        logger.error(f"/risk-map error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/forecast", tags=["Prediction"])
async def forecast(
    lat:   float = Query(default=40.0),
    lon:   float = Query(default=-121.2),
    hours: int   = Query(default=6),
):
    try:
        df  = _get_dataset()
        seq = df[LSTM_CONFIG["features"]].tail(LSTM_CONFIG["sequence_length"]).values.astype(np.float32)
        from ml.inference import predict_risk
        result = predict_risk(seq)
        return {"lat": lat, "lon": lon, "forecast_hours": hours, **result, "model_auc": 0.9727}
    except Exception as e:
        logger.error(f"/forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SituationReportRequest(BaseModel):
    region:         str   = "CA"
    county:         str   = "Plumas County"
    risk_score:     float = 0.75
    risk_level:     str   = "high"
    alert_tier:     str   = "warning"
    wind_speed:     float = 12.5
    wind_direction: float = 45.0
    temperature:    float = 38.0
    humidity:       float = 12.0
    fire_pixels:    int   = 180
    forecast_hours: int   = 6

@app.post("/situation-report", tags=["AI"])
async def situation_report(data: SituationReportRequest):
    try:
        from api.featherless import generate_situation_report
        report = generate_situation_report(data.model_dump())
        return {"report": report, "model": "Mistral-7B (Featherless)",
                "risk_score": data.risk_score, "alert_tier": data.alert_tier}
    except Exception as e:
        logger.error(f"/situation-report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/replay", tags=["Demo"])
async def replay(
    fire_id:  str = Query(default="dixie_2021"),
    n_frames: int = Query(default=48),
):
    cache_key = f"{fire_id}_{n_frames}"
    if cache_key in _replay_cache:
        return _replay_cache[cache_key]
    try:
        df = _get_dataset()
        from api.geo import build_replay_frames, _get_alert_tier
        frames = build_replay_frames(df, n_frames=n_frames)
        alert_frame = next(
            (f["frame"] for f in frames if f["alert_tier"] in ("warning", "emergency")), None
        )
        result = {
            "fire_id": fire_id, "fire_name": DEMO_FIRE["name"],
            "total_frames": len(frames), "alert_frame": alert_frame,
            "frames": frames,
            "meta": {
                "center_lat": DEMO_FIRE["center_lat"],
                "center_lon": DEMO_FIRE["center_lon"],
                "bbox":       DEMO_FIRE["bbox"],
                "start_date": DEMO_FIRE["start_date"],
            },
        }
        _replay_cache[cache_key] = result
        logger.info(f"Replay ready: {len(frames)} frames, alert fires at frame {alert_frame}")
        return result
    except Exception as e:
        logger.error(f"/replay error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


_DEMO_COUNTIES = [
    {"county": "Plumas County",  "lat": 40.00, "lon": -121.00, "fips": "06063"},
    {"county": "Butte County",   "lat": 39.70, "lon": -121.60, "fips": "06007"},
    {"county": "Lassen County",  "lat": 40.55, "lon": -120.60, "fips": "06035"},
    {"county": "Shasta County",  "lat": 40.80, "lon": -121.90, "fips": "06089"},
    {"county": "Tehama County",  "lat": 40.10, "lon": -122.20, "fips": "06103"},
]

@app.get("/alerts", tags=["Prediction"])
async def alerts(region: str = Query(default="CA")):
    try:
        df  = _get_dataset()
        seq = df[LSTM_CONFIG["features"]].tail(LSTM_CONFIG["sequence_length"]).values.astype(np.float32)
        from ml.inference import predict_risk
        from api.geo import _get_alert_tier, _classify_risk
        center_lat, center_lon = DEMO_FIRE["center_lat"], DEMO_FIRE["center_lon"]

        county_alerts = []
        for c in _DEMO_COUNTIES:
            dist        = np.sqrt((c["lat"] - center_lat)**2 + (c["lon"] - center_lon)**2)
            attenuation = np.exp(-dist * 1.5)
            mod_seq     = seq.copy()
            mod_seq[:, 0] = seq[:, 0] * attenuation
            result = predict_risk(mod_seq)
            county_alerts.append({**c, **result})

        county_alerts.sort(key=lambda x: x["risk_score"], reverse=True)
        active = [c for c in county_alerts if c["alert_tier"] != "none"]

        return {
            "region": region,
            "counties": county_alerts,
            "active_alerts": len(active),
            "highest_tier": county_alerts[0]["alert_tier"] if county_alerts else "none",
        }
    except Exception as e:
        logger.error(f"/alerts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))