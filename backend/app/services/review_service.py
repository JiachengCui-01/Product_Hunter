"""
Review service: persistence of raw review text, plus the AI-powered
aspect-based sentiment analysis pipeline (which delegates the actual
reasoning to app.ai.agent.FurnitureInsightAgent and persists the result
as a ReviewAnalysis row).
"""

from sqlalchemy.orm import Session

from app.ai.agent import FurnitureInsightAgent
from app.ai import rag
from app.ai.llm_client import get_llm_client
from app.core.logging import get_logger
from app.models.review import Review
from app.models.review_analysis import ReviewAnalysis
from app.schemas.review import ReviewBatchRequest, ReviewRead
from app.schemas.review_analysis import ReviewAnalysisResponse

logger = get_logger(__name__)


def submit_reviews(db: Session, payload: ReviewBatchRequest) -> tuple[int, list[int]]:
    """
    Persist a batch of raw reviews attached to a product and/or category.

    Returns:
        (count, review_ids) - the number of reviews created and their new
        primary keys, in insertion order.
    """
    rows = [
        Review(
            product_id=payload.product_id,
            category_id=payload.category_id,
            review_text=item.review,
        )
        for item in payload.reviews
    ]
    db.add_all(rows)
    db.commit()
    for row in rows:
        db.refresh(row)
    return len(rows), [row.id for row in rows]


def get_reviews(
    db: Session,
    product_id: int | None = None,
    category_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[ReviewRead]:
    """List reviews, optionally filtered by product_id and/or category_id."""
    query = db.query(Review)
    if product_id is not None:
        query = query.filter(Review.product_id == product_id)
    if category_id is not None:
        query = query.filter(Review.category_id == category_id)

    reviews = query.order_by(Review.submitted_at.desc()).offset(skip).limit(limit).all()
    return [ReviewRead.model_validate(r) for r in reviews]


def analyze_reviews(
    db: Session,
    review_texts: list[str],
    product_id: int | None = None,
    category_id: int | None = None,
    language: str = "en",
) -> ReviewAnalysisResponse:
    """
    Run the LLM-powered aspect-based sentiment analysis over a batch of
    raw review text strings, persist the result as a ReviewAnalysis row,
    and return it as a ReviewAnalysisResponse.

    Raises:
        RuntimeError: propagated from the LLM client if its API key is
            not configured - this is intentional so
            the API layer can translate it into a clear 4xx/5xx response
            rather than the request silently succeeding with fake data.
        app.ai.agent.AgentParseError: if the LLM's response could not be
            parsed as JSON.
    """
    llm_client = get_llm_client()
    agent = FurnitureInsightAgent(llm_client=llm_client, rag_module=rag)

    result = agent.analyze_reviews(reviews=review_texts, language=language)

    analysis = ReviewAnalysis(
        product_id=product_id,
        category_id=category_id,
        positive=result.get("positive", []),
        negative=result.get("negative", []),
        pain_points=result.get("pain_points", []),
        source_review_count=len(review_texts),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return ReviewAnalysisResponse(
        positive=analysis.positive,
        negative=analysis.negative,
        pain_points=analysis.pain_points,
    )
