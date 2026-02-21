# 🔥 PyroWatch AI — Wildfire Early Warning System
**EnviroCast GEO Hackathon | "From Insight to Impact"**

## Quick Start (Phase 1 Setup — run these in order)

### 1. Clone & enter project
```bash
cd pyrowatch
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env           # then fill in your API keys
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
```

### 4. Download Phase 1 data
```bash
cd ..
python scripts/fetch_data.py      # pulls NASA FIRMS + NOAA data
python scripts/build_dataset.py   # merges into clean DataFrame
```

### 5. Verify Phase 1 gate
```bash
python scripts/verify_phase1.py   # must print ✅ PASS on all checks
```

### 6. Run dev servers
```bash
# Terminal 1 — Backend
cd backend && uvicorn api.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Project Structure
```
pyrowatch/
├── backend/
│   ├── api/          # FastAPI routes
│   ├── ml/           # LSTM model, training, inference
│   ├── data/         # Data loaders, feature engineering
│   └── utils/        # Helpers, caching, logging
├── frontend/
│   └── src/
│       ├── components/   # Map, AlertPanel, Charts
│       ├── hooks/        # useFireData, useRiskStream
│       ├── services/     # API client
│       └── pages/        # Dashboard, Replay
├── data/
│   ├── raw/          # Downloaded from NASA/NOAA (gitignored)
│   ├── processed/    # Merged DataFrame CSVs
│   └── cache/        # Featherless API response cache
├── scripts/          # Phase 1 data pipeline scripts
├── .env.example
└── requirements.txt
```

## Tech Stack
| Layer | Tool |
|-------|------|
| Frontend | React + Vite + Tailwind + Leaflet.js |
| Backend | FastAPI + Python 3.11+ |
| ML | PyTorch LSTM |
| Vision AI | Featherless (ViT / LLaVA) |
| LLM | Featherless (Mistral-7B) |
| Maps | Leaflet.js + React-Leaflet |
| Data | NASA FIRMS, NOAA CDO, Sentinel-2 |
| Dashboard | MeDo (alert panel embed) |

## Demo Case
**Dixie Fire, Plumas County, CA — July 2021**
One of the largest wildfires in California history. We replay 48 hours of satellite + weather data and show PyroWatch flagging the risk 6 hours before it became uncontrollable.
