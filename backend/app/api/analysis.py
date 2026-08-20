"""
Ad-hoc review analysis endpoint: POST /api/analysis/reviews.

Unlike POST /api/reviews (which just persists raw text), this endpoint
runs the full LLM-powered aspect-based sentiment analysis immediately
and returns the result (also persisting it as a ReviewAnalysis row for
audit/reuse). Requires the configured LLM provider's API key; if it is not set,
this endpoint returns a clear 503 rather than crashing or returning fake
data.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.ai.agent import AgentParseError
from app.database.session import get_db
from app.schemas.review_analysis import ReviewAnalysisRequest, ReviewAnalysisResponse
from app.services import review_service

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/reviews", response_model=ReviewAnalysisResponse)
def analyze_reviews(payload: ReviewAnalysisRequest, db: Session = Depends(get_db)):
    """Run aspect-based sentiment analysis over a batch of raw review strings."""
    review_texts = [item.review for item in payload.reviews]

    try:
        return review_service.analyze_reviews(db, review_texts, language=payload.language)
    except RuntimeError as exc:
        # Raised by the LLM client when its API key is not configured,
        # or when the upstream LLM API call itself fails.
        # 503 Service Unavailable is the correct status for "this
        # feature's upstream dependency isn't configured/reachable".
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except AgentParseError as exc:
        # The LLM responded but its output could not be parsed as JSON.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI response could not be parsed: {exc}",
        ) from exc
