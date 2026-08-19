"""Pydantic schemas for the Review resource."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class ReviewIn(BaseModel):
    """A single raw review string, as submitted by a client."""

    review: str = Field(..., min_length=1, description="Raw review text")


class ReviewBatchRequest(BaseModel):
    """
    Payload for POST /api/reviews.

    Reviews may be attached to a specific product (product_id), a whole
    category (category_id), or neither field may be required strictly -
    at least one of product_id/category_id should be given by callers,
    but we don't hard-enforce that at the schema level so the endpoint
    can return a clear validation message instead.
    """

    product_id: int | None = None
    category_id: int | None = None
    reviews: list[ReviewIn] = Field(..., min_length=1)


class ReviewRead(ORMBase):
    """Response schema for a single persisted Review row."""

    id: int
    review_text: str
    submitted_at: datetime
