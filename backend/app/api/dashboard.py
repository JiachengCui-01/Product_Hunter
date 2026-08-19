"""Dashboard summary endpoint: a single aggregate view for a landing-page/dashboard UI."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.category import Category
from app.models.market_trend import MarketTrend
from app.models.opportunity_report import OpportunityReport

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    """
    Return a compact summary for a dashboard: total category/report
    counts, plus the top 5 categories by most-recent trend_score.
    """
    category_count = db.query(Category).count()
    report_count = db.query(OpportunityReport).count()

    categories = db.query(Category).all()
    trending = []
    for category in categories:
        latest_trend = (
            db.query(MarketTrend)
            .filter(MarketTrend.category_id == category.id)
            .order_by(MarketTrend.generated_at.desc())
            .first()
        )
        if latest_trend is not None:
            trending.append(
                {
                    "category_id": category.id,
                    "name": category.name,
                    "trend_score": latest_trend.trend_score,
                    "growth": latest_trend.growth,
                }
            )

    trending.sort(key=lambda t: t["trend_score"], reverse=True)

    return {
        "category_count": category_count,
        "report_count": report_count,
        "trending_categories": trending[:5],
    }
