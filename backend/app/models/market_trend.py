"""MarketTrend model: a point-in-time market trend snapshot for a category."""

from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, JSON, DateTime, ForeignKey

from app.database.base import Base


class MarketTrend(Base):
    """
    A market trend snapshot for a single category, produced by whichever
    MarketDataProvider is active (mock or Rainforest). One category may
    accumulate multiple MarketTrend rows over time (one per refresh); the
    trend_service typically fetches or creates the most recent one.
    """

    __tablename__ = "market_trends"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    trend_score = Column(Float, nullable=False)
    growth = Column(String(20), nullable=False)  # "Increasing" | "Stable" | "Decreasing"
    keywords = Column(JSON, nullable=False, default=list)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<MarketTrend id={self.id} category_id={self.category_id} score={self.trend_score}>"
