"""Pydantic schemas for the Product resource."""

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class ScoreBreakdown(BaseModel):
    """
    The inputs and formula behind a product's derived scores, returned
    alongside every product so the UI can show *why* a product scored
    what it did rather than presenting an unexplained number.

    Product managers act on these rankings, so an opaque score is not
    good enough - the breakdown makes the model auditable at a glance.
    Weights and formulas are echoed from product_service (the single
    source of truth) instead of being restated in the frontend, so the
    displayed explanation can never drift from the actual computation.
    """

    rating_norm: float = Field(..., description="rating / 5 * 100, i.e. satisfaction on a 0-100 scale")
    demand_score: float = Field(..., description="Review-volume-derived demand, 0-100")
    trend_score: float = Field(..., description="The category's current market trend score, 0-100")
    weights: dict[str, float] = Field(..., description="Weight applied to each component")
    demand_formula: str = Field(..., description="How demand_score is derived from review_count")
    opportunity_formula: str = Field(..., description="How opportunity_score combines the components")


class ProductRead(ORMBase):
    """Response schema for a Product row, including derived scoring fields."""

    id: int
    name: str
    category_id: int
    price: float
    rating: float
    review_count: int
    features: list[str]
    # Canonical English material tags, e.g. ["Solid Wood", "Steel"]. May be
    # empty when the listing text names no recognizable material.
    material: list[str] = Field(default_factory=list)
    # Null for provider-synthesized (mock) products, which have no real
    # marketplace listing to link to.
    asin: str | None = None
    url: str | None = None
    opportunity_score: float
    demand_score: float
    # Computed per-request (not stored) - see product_service.build_score_breakdown.
    score_breakdown: ScoreBreakdown | None = None


class ProductFacets(BaseModel):
    """
    Filter metadata for GET /api/products/facets.

    Lets the UI build price/rating/material controls from what is actually
    present in the data (optionally scoped to one category) instead of
    hardcoding ranges and material lists that would go stale the moment
    the catalogue is re-seeded from a live provider.
    """

    price_min: float
    price_max: float
    rating_min: float
    rating_max: float
    materials: list[dict] = Field(
        default_factory=list,
        description='Available materials with counts, e.g. [{"value": "Wood", "count": 12}]',
    )
