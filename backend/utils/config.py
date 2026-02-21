

import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

DATA_DIR        = ROOT_DIR / "data"
RAW_DIR         = DATA_DIR / "raw"
PROCESSED_DIR   = DATA_DIR / "processed"
CACHE_DIR       = DATA_DIR / "cache"
MODELS_DIR      = ROOT_DIR / "backend" / "ml" / "saved_models"

for d in [RAW_DIR, PROCESSED_DIR, CACHE_DIR, MODELS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

NASA_FIRMS_API_KEY   = os.getenv("NASA_FIRMS_API_KEY", "")
NOAA_CDO_TOKEN       = os.getenv("NOAA_CDO_TOKEN", "")
FEATHERLESS_API_KEY  = os.getenv("FEATHERLESS_API_KEY", "")
FEATHERLESS_BASE_URL = os.getenv("FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1")

VISION_MODEL = os.getenv("FEATHERLESS_VISION_MODEL", "llava-hf/llava-1.5-7b-hf")
LLM_MODEL    = os.getenv("FEATHERLESS_LLM_MODEL",    "mistralai/Mistral-7B-Instruct-v0.3")

DEMO_FIRE = {
    "name":       "Dixie Fire",
    "year":       2021,
    "state":      "CA",
    "start_date": "2021-07-13",
    "end_date":   "2021-07-20",
    "center_lat": 40.0,
    "center_lon": -121.2,
    "bbox": {
        "min_lat": 39.5,
        "max_lat": 40.6,
        "min_lon": -121.8,
        "max_lon": -120.5,
    },
    "noaa_station_id": "GHCND:USC00046646",
}

FIRMS_BASE_URL  = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
FIRMS_SATELLITE = "VIIRS_SNPP_NRT"
FIRMS_DAY_RANGE = 7

NOAA_BASE_URL   = "https://www.ncdc.noaa.gov/cdo-web/api/v2"
NOAA_DATASET_ID = "GHCND"

LSTM_CONFIG = {
    "sequence_length":  24,
    "forecast_horizon": 6,
    "features": [
        "fire_pixels",
        "wind_speed",
        "wind_dir_sin",
        "wind_dir_cos",
        "temperature",
        "humidity",
        "ndvi",
        "ndwi",
        "hour_sin",
        "hour_cos",
    ],
    "n_features":       10,
    "hidden_size":      128,
    "num_layers":       2,
    "dropout":          0.2,
    "learning_rate":    1e-4,
    "batch_size":       32,
    "epochs":           50,
    "early_stop_patience": 8,
}

RISK_THRESHOLDS = {
    "low":      (0.0,  0.35),
    "moderate": (0.35, 0.55),
    "high":     (0.55, 0.70),
    "extreme":  (0.70, 1.01),
}

ALERT_TIERS = {
    "watch":     0.40,
    "warning":   0.60,
    "emergency": 0.75,
}

APP_ENV   = os.getenv("APP_ENV", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG")
IS_DEV    = APP_ENV == "development"

def validate_keys():
    missing = []
    if not NASA_FIRMS_API_KEY:
        missing.append("NASA_FIRMS_API_KEY")
    if not NOAA_CDO_TOKEN:
        missing.append("NOAA_CDO_TOKEN")
    if not FEATHERLESS_API_KEY:
        missing.append("FEATHERLESS_API_KEY")
    if missing:
        print(f"⚠️  Missing API keys in .env: {', '.join(missing)}")
        print("   Data fetching will use cached/mock data until keys are added.")
    else:
        print("✅ All API keys loaded.")
    return len(missing) == 0