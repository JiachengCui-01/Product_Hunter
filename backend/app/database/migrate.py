"""
Automatic schema migration on startup.

Replaces the previous `Base.metadata.create_all()` call, which could only
ever CREATE missing tables - it silently ignored added columns, so a model
change deployed fine and then produced 500s on every query against the
stale table. That failure mode cost three full database rebuilds before
Alembic was introduced.

Three database states have to be handled, because this is being retrofitted
onto an already-deployed app:

  1. Fresh/empty database        -> run all migrations from scratch.
  2. Legacy database created by  -> stamp it at the baseline revision (its
     the old create_all()           schema matches that revision), then
                                    upgrade forward. This is what preserves
                                    existing production data.
  3. Already under Alembic       -> plain upgrade to head (usually a no-op).

Detection is by table presence rather than by a config flag, so no manual
step or one-off env var is needed on any environment.
"""

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from app.core.config import BACKEND_DIR
from app.core.logging import get_logger

logger = get_logger(__name__)

# The revision whose schema matches what the old create_all() produced.
_BASELINE_REVISION = "0001_baseline"

# Any table that only the legacy create_all() path would have produced.
# `categories` is created first by the baseline migration and is present in
# every non-empty database, so it is a reliable "has real schema" probe.
_SENTINEL_TABLE = "categories"


def _alembic_config() -> Config:
    """Load alembic.ini from the backend/ directory, wherever we were launched from."""
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return config


def run_migrations(engine: Engine) -> None:
    """
    Bring the database schema up to head, handling the three states above.

    Failures are raised, not swallowed: a database whose schema does not
    match the models cannot serve requests correctly, and starting up
    "successfully" only to 500 on every query is strictly worse than
    failing loudly at boot.
    """
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    # Hand Alembic an open connection to THIS engine, rather than letting
    # env.py build its own from settings - otherwise the engine argument
    # would be silently ignored and whatever DATABASE_URL points at would be
    # migrated instead (which also makes the function untestable against a
    # throwaway database).
    with engine.connect() as connection:
        config = _alembic_config()
        config.attributes["connection"] = connection

        if "alembic_version" in tables:
            logger.info("Database already under Alembic control - upgrading to head.")
        elif _SENTINEL_TABLE in tables:
            logger.warning(
                "Found a pre-Alembic database (tables exist, no alembic_version). "
                "Stamping it at %s and upgrading forward - existing data is preserved.",
                _BASELINE_REVISION,
            )
            command.stamp(config, _BASELINE_REVISION)
        else:
            logger.info("Empty database - running all migrations from scratch.")

        command.upgrade(config, "head")
        # stamp/upgrade run inside their own transactions on this connection;
        # commit so the work is durable even if the caller opened the engine
        # with a non-autocommit default.
        connection.commit()

    logger.info("Schema is up to date.")
