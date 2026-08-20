"""Pydantic schemas for the OpportunityReport resource."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase

# The languages the AI features can generate prose in. A Literal (not a
# free string) so an unsupported value is rejected at the API boundary
# with a clear 422 instead of silently reaching the prompt layer.
Language = Literal["en", "zh"]


class SourceProduct(BaseModel):
    """A real marketplace listing that informed a generated report."""

    name: str
    asin: str | None = None
    url: str | None = None


class OpportunityGenerateRequest(BaseModel):
    """Payload for POST /api/opportunities/generate."""

    category_id: int
    product_id: int | None = None
    # Language for the generated prose. Defaults to English so existing
    # clients that omit it keep their current behavior.
    language: Language = "en"


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
    # Which language this report's stored prose is actually in. Past
    # reports cannot be re-rendered in another language without re-running
    # the model, so the client needs this to label them correctly.
    language: str = "en"
    # The real listings this report was based on, snapshotted at generation
    # time. Empty when generated from mock data (no real listings exist).
    source_products: list[SourceProduct] = Field(default_factory=list)
    created_at: datetime
