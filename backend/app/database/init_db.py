"""
Database initialization helper.

`create_all(engine)` must be called after all model modules have been
imported (so that `Base.metadata` actually contains every table). We
guarantee that by importing `app.models` here, which in turn imports
every individual model module (see app/models/__init__.py).
"""

from sqlalchemy.engine import Engine

from app.database.base import Base
# Importing app.models populates Base.metadata with every table
# (Category, MarketTrend, Product, Review, ReviewAnalysis, OpportunityReport).
import app.models  # noqa: F401  (import is for its side effect on Base.metadata)


def create_all(engine: Engine) -> None:
    """Create all tables that don't already exist. Safe to call repeatedly."""
    Base.metadata.create_all(bind=engine)
