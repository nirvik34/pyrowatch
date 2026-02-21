

import json
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from utils.logger import logger


class Cache:
    def __init__(self, namespace: str, ttl_hours: int = 720):
        from utils.config import CACHE_DIR
        self.dir = CACHE_DIR / namespace
        self.dir.mkdir(parents=True, exist_ok=True)
        self.ttl = timedelta(hours=ttl_hours)

    def _path(self, key: str) -> Path:
        safe_key = hashlib.md5(key.encode()).hexdigest() if len(key) > 80 else key
        return self.dir / f"{safe_key}.json"

    def get(self, key: str):
        path = self._path(key)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            cached_at = datetime.fromisoformat(data["cached_at"])
            if datetime.now() - cached_at > self.ttl:
                logger.debug(f"Cache expired: {key[:60]}")
                path.unlink()
                return None
            logger.debug(f"Cache HIT: {key[:60]}")
            return data["value"]
        except Exception as e:
            logger.warning(f"Cache read error for {key[:60]}: {e}")
            return None

    def set(self, key: str, value) -> None:
        path = self._path(key)
        try:
            path.write_text(json.dumps({
                "cached_at": datetime.now().isoformat(),
                "key": key[:200],
                "value": value
            }, indent=2))
            logger.debug(f"Cache SET: {key[:60]}")
        except Exception as e:
            logger.warning(f"Cache write error for {key[:60]}: {e}")

    def clear(self, key: str = None) -> None:
        if key:
            p = self._path(key)
            if p.exists():
                p.unlink()
        else:
            for f in self.dir.glob("*.json"):
                f.unlink()
            logger.info(f"Cache cleared: {self.dir.name}")


def make_cache_key(*args, **kwargs) -> str:
    parts = [str(a) for a in args] + [f"{k}={v}" for k, v in sorted(kwargs.items())]
    return "__".join(parts)