"""
FastAPI application entrypoint for Furniture Market Insight AI.

Run locally with:
    uvicorn app.main:app --reload --port 8000

The app factory (`create_app`) wires up:
    - CORS (origins read from settings.CORS_ORIGINS)
    - all resource routers (categories, trends, products, reviews,
      analysis, opportunities, dashboard)
    - a startup event that creates all database tables if they don't
      already exist (app.database.init_db.create_all)
    - a simple /health liveness endpoint
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analysis, categories, dashboard, opportunities, products, reviews, trends
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.database import init_db
from app.database.session import SessionLocal, engine
from app.models.category import Category
from app.seed.seed_data import seed as run_seed

configure_logging()
logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Application factory - builds and returns a configured FastAPI instance."""
    app = FastAPI(
        title="Furniture Market Insight AI",
        description=(
            "Enterprise MVP backend providing furniture market trend data, "
            "product opportunity scoring, review sentiment analysis, and "
            "AI-generated new-product opportunity reports."
        ),
        version="0.1.0",
    )

    # CORS: allow the configured frontend origin(s) to call this API from
    # the browser. Origins are comma-separated in CORS_ORIGINS.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers - each module defines its own APIRouter with a full prefix
    # (e.g. "/api/categories"), so no prefix is added here.
    app.include_router(categories.router)
    app.include_router(trends.router)
    app.include_router(products.router)
    app.include_router(reviews.router)
    app.include_router(analysis.router)
    app.include_router(opportunities.router)
    app.include_router(dashboard.router)

    @app.on_event("startup")
    def on_startup() -> None:
        """
        Create all database tables if they don't already exist, then
        auto-seed mock data if the database is completely empty.

        The auto-seed step exists for zero-manual-step deploys on managed
        hosts (e.g. Render's free tier has no interactive shell to run
        `python -m app.seed.seed_data` by hand). It is safe locally too:
        `seed()` is idempotent per-category (skips any category that
        already exists by name), and we additionally short-circuit here
        with a cheap "any categories at all?" check so a populated dev
        database is never touched. Any failure during seeding is logged
        and swallowed rather than crashing app startup - a database
        that's merely empty (not broken) should still serve requests.
        """
        logger.info("Starting up - ensuring database tables exist...")
        init_db.create_all(engine)
        logger.info("Database ready at %s", settings.resolved_database_url)

        db = SessionLocal()
        try:
            has_data = db.query(Category).first() is not None
        finally:
            db.close()

        if not has_data:
            logger.info("No categories found - running mock data auto-seed...")
            try:
                run_seed()
            except Exception:
                logger.exception(
                    "Auto-seed failed; continuing startup with an empty database. "
                    "Run `python -m app.seed.seed_data` manually to retry."
                )

    @app.get("/health", tags=["health"])
    def health_check():
        """Simple liveness/readiness probe."""
        return {"status": "ok", "service": "furniture-market-insight-ai"}

    return app


app = create_app()
