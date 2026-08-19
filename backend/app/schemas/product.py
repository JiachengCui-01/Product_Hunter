"""Pydantic schemas for the Product resource."""

from app.schemas.common import ORMBase


class ProductRead(ORMBase):
    """Response schema for a Product row, including derived scoring fields."""

    id: int
    name: str
    category_id: int
    price: float
    rating: float
    review_count: int
    features: list[str]
    opportunity_score: float
    demand_score: float
