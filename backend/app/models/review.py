"""Review model: a single raw customer review, tied to a product and/or category."""

from datetime import datetime

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey

from app.database.base import Base


class Review(Base):
    """
    A raw review submitted via POST /api/reviews (batch) or created by the
    seed script from the mock data provider. `product_id` and/or
    `category_id` may be null depending on how the review was submitted
    (a review can be attached to a specific product, or just to a broad
    category for general sentiment analysis).
    """

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True, index=True)
    review_text = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Review id={self.id} product_id={self.product_id} category_id={self.category_id}>"
