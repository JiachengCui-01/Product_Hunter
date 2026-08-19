"""
Trend service: fetches (or lazily creates) MarketTrend data for a
category, delegating the actual data generation/sourcing to the active
MarketDataProvider (mock or Rainforest).
"""

from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.market_trend import MarketTrend
from app.schemas.market_trend import MarketTrendRead
from app.services.provider_factory import get_data_provider


def get_trend_for_category(db: Session, category_id: int) -> MarketTrendRead | None:
    """
    Return the most recent MarketTrend for a category, creating one via
    the active data provider if none exists yet.

    Returns None if the category itself does not exist, letting the
    calling router translate that into an HTTP 404.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        return None

    trend = (
        db.query(MarketTrend)
        .filter(MarketTrend.category_id == category_id)
        .order_by(MarketTrend.generated_at.desc())
        .first()
    )

    if trend is None:
        provider = get_data_provider()
        trend_data = provider.get_trend(category)
        trend = MarketTrend(
            category_id=category.id,
            trend_score=trend_data["trend_score"],
            growth=trend_data["growth"],
            keywords=trend_data["keywords"],
        )
        db.add(trend)
        db.commit()
        db.refresh(trend)

    return MarketTrendRead(
        category_id=category.id,
        category_name=category.name,
        trend_score=trend.trend_score,
        growth=trend.growth,
        keywords=trend.keywords,
    )
