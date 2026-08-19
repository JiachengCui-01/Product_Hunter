"""
Application-wide logging configuration.

Call `configure_logging()` once at startup (done in app.main on import),
then anywhere else in the codebase get a module-scoped logger with:

    from app.core.logging import get_logger
    logger = get_logger(__name__)
"""

import logging
import sys

_CONFIGURED = False


def configure_logging(level: int = logging.INFO) -> None:
    """
    Configure the root logger once. Safe to call multiple times - only
    the first call has any effect, subsequent calls are no-ops.

    Uses a simple, readable format suitable for both local development
    and container logs (stdout), which is what most log aggregators
    (CloudWatch, Docker, k8s) expect.
    """
    global _CONFIGURED
    if _CONFIGURED:
        return

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a named logger, ensuring logging has been configured first."""
    configure_logging()
    return logging.getLogger(name)
