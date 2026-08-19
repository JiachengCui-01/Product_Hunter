"""Pydantic schemas for the OpportunityReport resource."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMBase


class OpportunityGenerateRequest(BaseModel):
    """Payload for POST /api/opportunities/generate."""

    category_id: int
    product_id: int | None = None


class OpportunityReportRead(ORMBase):
    """Response schema for a persisted OpportunityReport row."""

    id: int
    category_id: int
    product_name: str
    target_customer: str
    pain_points: list[str]
    solution: str
    features: list[str]
    selling_points: list[str]
    created_at: datetime
