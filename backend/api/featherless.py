

import json
import hashlib
from utils.config import FEATHERLESS_API_KEY, FEATHERLESS_BASE_URL
from utils.cache import Cache
from utils.logger import logger

_cache = Cache("featherless", ttl_hours=168)

LLM_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"

SYSTEM_PROMPT = 


def _get_client():
    try:
        from openai import OpenAI
        return OpenAI(
            api_key=FEATHERLESS_API_KEY,
            base_url=FEATHERLESS_BASE_URL,
        )
    except ImportError:
        raise ImportError("Run: pip install openai")


def generate_situation_report(risk_data: dict) -> str:
    cache_key = _make_key("report", risk_data)
    cached = _cache.get(cache_key)
    if cached:
        logger.debug("Featherless: situation report from cache")
        return cached

    if not FEATHERLESS_API_KEY:
        logger.warning("No FEATHERLESS_API_KEY — using template report")
        return _template_report(risk_data)

    prompt = _build_prompt(risk_data)

    try:
        client   = _get_client()
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=200,
            temperature=0.7,
        )
        report = response.choices[0].message.content.strip()
        _cache.set(cache_key, report)
        logger.info(f"Featherless LLM: report generated ({len(report)} chars)")
        return report

    except Exception as e:
        logger.warning(f"Featherless API error: {e} — using template fallback")
        return _template_report(risk_data)


def _build_prompt(d: dict) -> str:
    return f


def _template_report(d: dict) -> str:
    risk   = d.get("risk_score", 0)
    tier   = d.get("alert_tier", "none")
    wind   = d.get("wind_speed", 0)
    hum    = d.get("humidity", 30)
    px     = d.get("fire_pixels", 0)
    county = d.get("county", "Plumas County")

    actions = {
        "emergency": "EVACUATE NOW — all zones in the affected area, no exceptions.",
        "warning":   "Prepare for immediate evacuation. Pre-position resources at staging areas.",
        "watch":     "Monitor conditions closely. Notify residents to prepare go-bags.",
        "none":      "Continue standard monitoring. No immediate action required.",
    }
    action = actions.get(tier, actions["none"])

    return (
        f"PyroWatch AI detects {px} active fire hotspots in {county} "
        f"with a risk score of {risk:.2f}/1.00, triggering a {tier.upper()} alert. "
        f"Primary risk drivers are wind speed of {wind:.1f} m/s and relative humidity "
        f"of {hum:.1f}%, creating extreme fire spread conditions across the region. "
        f"{action}"
    )


def _make_key(*args) -> str:
    raw = "__".join(str(a) for a in args)
    return hashlib.md5(raw.encode()).hexdigest()