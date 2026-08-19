"""Pydantic schemas for the MarketTrend resource."""

from enum import Enum

from pydantic import BaseModel


class GrowthEnum(str, Enum):
    """Qualitative market growth direction."""

    increasing = "Increasing"
    stable = "Stable"
    decreasing = "Decreasing"


class MarketTrendRead(BaseModel):
    """
    Response schema for GET /api/trends/{category_id}.

    Note this is a hand-assembled schema (not a direct ORM passthrough)
    because it joins in `category_name` from the related Category row -
    see app.services.trend_service.get_trend_for_category.
    """

    category_id: int
    category_name: str
    trend_score: float
    growth: GrowthEnum
    keywords: list[str]
