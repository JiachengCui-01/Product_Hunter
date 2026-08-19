"""
Application configuration.

Uses pydantic-settings to load configuration from environment variables
and an optional `.env` file located in the `backend/` directory. All
settings have sensible defaults so the application can boot in a fresh
environment (e.g. CI, a new dev machine) without any configuration at
all - the only things that unlock AI features are ANTHROPIC_API_KEY /
RAINFOREST_API_KEY, which are intentionally empty by default.

Path handling
-------------
The project layout is:

    Product_Hunter/
        backend/
            app/
                core/config.py   <- this file
        data/
            product_hunter.db
            chroma/
        docs/
        frontend/

`data/` and `docs/` are siblings of `backend/`, not children of it. To
make the SQLite database and Chroma persistence directory resolve
correctly *regardless of the process's current working directory*, we
compute the repository root relative to this file's location and join
the configured (relative) paths against it. This means `uvicorn` can be
launched from `backend/`, from the repo root, or from anywhere else and
still find (or create) the same `data/` folder.
"""

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


# This file lives at: <repo_root>/backend/app/core/config.py
# parents[0] = core, parents[1] = app, parents[2] = backend, parents[3] = <repo_root>
_THIS_FILE = Path(__file__).resolve()
REPO_ROOT = _THIS_FILE.parents[3]
BACKEND_DIR = _THIS_FILE.parents[2]
DATA_DIR = REPO_ROOT / "data"


def _resolve_sqlite_url(raw_url: str) -> str:
    """
    Turn a relative sqlite URL (e.g. 'sqlite:///../data/product_hunter.db')
    into an absolute-path sqlite URL anchored at the repo root's data/
    folder, regardless of current working directory.

    Non-sqlite URLs (e.g. a real Postgres DSN) are passed through
    unchanged, which is what allows this app to "swap" to Postgres later
    without any code changes - only the .env value changes.
    """
    if not raw_url.startswith("sqlite"):
        return raw_url

    # Ensure the data directory exists before SQLAlchemy tries to open the file.
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    db_path = DATA_DIR / "product_hunter.db"
    # sqlite:///<absolute path> - note the three slashes + absolute path.
    return f"sqlite:///{db_path.as_posix()}"


def _resolve_chroma_dir(raw_dir: str) -> str:
    """Resolve the Chroma persistence directory to an absolute path under data/."""
    chroma_dir = DATA_DIR / "chroma"
    chroma_dir.mkdir(parents=True, exist_ok=True)
    return str(chroma_dir)


class Settings(BaseSettings):
    """
    Central application settings, populated from environment variables
    and/or a `.env` file (see backend/.env.example for the template).
    """

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database ---------------------------------------------------
    DATABASE_URL: str = "sqlite:///../data/product_hunter.db"

    # --- Data provider (mock vs real Rainforest API) -----------------
    DATA_PROVIDER: str = "mock"  # "mock" | "rainforest"
    RAINFOREST_API_KEY: str = ""

    # --- LLM provider -------------------------------------------------
    LLM_PROVIDER: str = "anthropic"  # currently only "anthropic" is implemented
    ANTHROPIC_API_KEY: str = ""

    # --- Vector store (Chroma) for RAG-style report similarity -------
    CHROMA_PERSIST_DIR: str = "../data/chroma"

    # --- CORS ---------------------------------------------------------
    # Comma-separated list of allowed origins, e.g.
    # "http://localhost:3000,https://app.example.com"
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS_ORIGINS as a clean list of origins (splits on comma, strips whitespace)."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def resolved_database_url(self) -> str:
        """DATABASE_URL resolved to an absolute path when it is a sqlite URL."""
        return _resolve_sqlite_url(self.DATABASE_URL)

    @property
    def resolved_chroma_dir(self) -> str:
        """CHROMA_PERSIST_DIR resolved to an absolute path under <repo_root>/data/chroma."""
        return _resolve_chroma_dir(self.CHROMA_PERSIST_DIR)


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance.

    Cached via lru_cache so the .env file is only parsed once per process
    and every part of the app shares the exact same configuration object.
    """
    return Settings()


# Convenience module-level singleton used throughout the codebase as
# `from app.core.config import settings`.
settings = get_settings()
