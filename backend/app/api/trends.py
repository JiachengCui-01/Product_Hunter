"""Market trend endpoint: GET /api/trends/{category_id}."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.market_trend import MarketTrendRead
from app.services import trend_service

router = APIRouter(prefix="/api/trends", tags=["trends"])


@router.get("/{category_id}", response_model=MarketTrendRead)
def get_trend(category_id: int, db: Session = Depends(get_db)):
    """
    Return the current market trend snapshot for a category, lazily
    creating one via the active MarketDataProvider if none exists yet.
    """
    trend = trend_service.get_trend_for_category(db, category_id)
    if trend is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {category_id} not found.",
        )
    return trend
