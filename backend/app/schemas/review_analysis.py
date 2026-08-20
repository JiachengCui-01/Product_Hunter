"""Pydantic schemas for ad-hoc review analysis (POST /api/analysis/reviews)."""

from pydantic import BaseModel, Field

from app.schemas.opportunity_report import Language
from app.schemas.review import ReviewIn


class ReviewAnalysisRequest(BaseModel):
    """Payload for POST /api/analysis/reviews - an arbitrary batch of reviews to analyze."""

    reviews: list[ReviewIn] = Field(..., min_length=1)
    # Language for the aspect labels / pain-point phrasing the LLM
    # returns. Defaults to English so existing clients are unaffected.
    language: Language = "en"


class ReviewAnalysisResponse(BaseModel):
    """
    Aspect-based sentiment analysis result returned by the LLM agent
    (app.ai.agent.FurnitureInsightAgent.analyze_reviews) and by
    GET/POST endpoints that surface a ReviewAnalysis row.
    """

    positive: list[str] = Field(default_factory=list, description="Positive aspects/themes mentioned")
    negative: list[str] = Field(default_factory=list, description="Negative aspects/themes mentioned")
    pain_points: list[str] = Field(default_factory=list, description="Specific, actionable customer pain points")
