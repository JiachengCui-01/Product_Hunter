"""Product model: a specific furniture product observed within a category."""

from sqlalchemy import Column, Integer, Float, Text, JSON, ForeignKey

from app.database.base import Base


class Product(Base):
    """
    A furniture product (real or provider-synthesized) belonging to a
    category. `opportunity_score` and `demand_score` are derived metrics
    computed by app.services.product_service from rating/review_count/
    trend data - they are persisted so listings can be sorted/filtered
    cheaply without recomputation on every request.
    """

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    # Text (not String(N)): real marketplace listing titles regularly exceed
    # 255 chars (observed up to 320 from live Amazon data). SQLite silently
    # ignores VARCHAR length limits, so a capped length passes local dev and
    # then fails only on Postgres with a DataError - keep this unbounded.
    name = Column(Text, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    rating = Column(Float, nullable=False)
    review_count = Column(Integer, nullable=False, default=0)
    features = Column(JSON, nullable=False, default=list)
    opportunity_score = Column(Float, nullable=False, default=0.0)
    demand_score = Column(Float, nullable=False, default=0.0)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Product id={self.id} name={self.name!r}>"
