

import sys
import logging
from pathlib import Path

LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

try:
    from loguru import logger
    logger.remove()
    logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan> — <level>{message}</level>", level="DEBUG", colorize=True)
    logger.add(LOG_DIR / "pyrowatch.log", level="DEBUG", rotation="10 MB", retention="7 days")

except ImportError:
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
        datefmt="%H:%M:%S",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(LOG_DIR / "pyrowatch.log"),
        ]
    )
    logger = logging.getLogger("pyrowatch")
    logger.warning("loguru not installed — using stdlib logging. Run: pip install loguru")

__all__ = ["logger"]