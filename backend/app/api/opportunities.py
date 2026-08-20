"""
Opportunity report endpoints: generate (AI-powered), list, and
fetch-by-id.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.ai.agent import AgentParseError
from app.api.deps import PaginationParams, pagination_params
from app.database.session import get_db
from app.schemas.opportunity_report import OpportunityGenerateRequest, OpportunityReportRead
from app.services import opportunity_service

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


@router.post("/generate", response_model=OpportunityReportRead, status_code=status.HTTP_201_CREATED)
def generate_opportunity(payload: OpportunityGenerateRequest, db: Session = Depends(get_db)):
    """
    Run the full AI pipeline (trend + review analysis + RAG enrichment +
    LLM recommendation) to generate a new OpportunityReport for a
    category (optionally scoped to a specific product).

    Requires the configured LLM provider's API key to be configured; returns a clear 503 if
    it is not, and a 502 if the LLM's output could not be parsed.
    """
    try:
        report = opportunity_service.generate_opportunity(
            db,
            category_id=payload.category_id,
            product_id=payload.product_id,
            language=payload.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except AgentParseError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI response could not be parsed: {exc}",
        ) from exc

    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {payload.category_id} not found.",
        )
    return report


@router.get("", response_model=list[OpportunityReportRead])
def list_opportunities(
    category_id: int | None = Query(None),
    pagination: PaginationParams = Depends(pagination_params),
    db: Session = Depends(get_db),
):
    """List previously generated opportunity reports, optionally filtered by category."""
    return opportunity_service.list_opportunities(
        db, category_id=category_id, skip=pagination.skip, limit=pagination.limit
    )


@router.get("/{report_id}", response_model=OpportunityReportRead)
def get_opportunity(report_id: int, db: Session = Depends(get_db)):
    """Fetch a single opportunity report by id."""
    report = opportunity_service.get_opportunity(db, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Opportunity report {report_id} not found.",
        )
    return report
