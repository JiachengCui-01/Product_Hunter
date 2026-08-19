"""Review endpoints: batch submission and listing (raw text only, no AI here)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import PaginationParams, pagination_params
from app.database.session import get_db
from app.schemas.review import ReviewBatchRequest, ReviewRead
from app.services import review_service

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_reviews(payload: ReviewBatchRequest, db: Session = Depends(get_db)):
    """
    Batch-insert raw reviews, attached to a product_id and/or category_id.

    Returns {"count": int, "review_ids": [int, ...]}.
    """
    if payload.product_id is None and payload.category_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one of product_id or category_id must be provided.",
        )

    count, review_ids = review_service.submit_reviews(db, payload)
    return {"count": count, "review_ids": review_ids}


@router.get("", response_model=list[ReviewRead])
def list_reviews(
    product_id: int | None = Query(None),
    category_id: int | None = Query(None),
    pagination: PaginationParams = Depends(pagination_params),
    db: Session = Depends(get_db),
):
    """List reviews, optionally filtered by product_id and/or category_id."""
    return review_service.get_reviews(
        db,
        product_id=product_id,
        category_id=category_id,
        skip=pagination.skip,
        limit=pagination.limit,
    )
