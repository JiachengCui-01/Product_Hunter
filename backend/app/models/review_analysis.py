"""ReviewAnalysis model: a persisted LLM-generated sentiment analysis of a review batch."""

from datetime import datetime

from sqlalchemy import Column, Integer, JSON, DateTime, ForeignKey

from app.database.base import Base


class ReviewAnalysis(Base):
    """
    Persisted result of running app.ai.agent.FurnitureInsightAgent.analyze_reviews
    over a batch of review texts. Storing this lets opportunity_service
    reuse a prior analysis instead of re-calling the LLM every time, and
    gives the API an audit trail of past analyses.
    """

    __tablename__ = "review_analyses"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    positive = Column(JSON, nullable=False, default=list)
    negative = Column(JSON, nullable=False, default=list)
    pain_points = Column(JSON, nullable=False, default=list)
    source_review_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ReviewAnalysis id={self.id} product_id={self.product_id} category_id={self.category_id}>"
