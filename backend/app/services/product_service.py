"""
Product service: listing/filtering/sorting of Product rows, plus the
scoring logic that computes each product's derived `opportunity_score`
and `demand_score` metrics.

Scoring model
-------------
`demand_score` comes straight from the active MarketDataProvider (it
represents raw observed demand signal - e.g. review velocity/sales rank
proxy - and is provider-specific).

`opportunity_score` is a composite metric computed HERE (not by the
provider) as a weighted blend of three normalized (0-100) signals:

    - rating_norm   = (product.rating / 5.0) * 100       (customer satisfaction)
    - demand_score                                          (market demand)
    - trend_score   (from the category's current MarketTrend)  (market momentum)

    opportunity_score = 0.35 * rating_norm + 0.40 * demand_score + 0.25 * trend_score

The weighting favors demand slightly over rating/trend because raw
demand is the strongest signal that a market gap is worth pursuing;
rating and trend act as supporting/confirming signals. This formula is
intentionally simple and transparent (no ML) so it can be explained to
a business stakeholder in one sentence - it can be swapped for a more
sophisticated model later without touching any call sites.
"""

from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.market_trend import MarketTrend
from app.models.product import Product
from app.schemas.product import ProductRead

# Columns that GET /api/products?sort_by= is allowed to sort on. Keeping
# an explicit allow-list prevents arbitrary/unsafe column names from
# reaching the ORM's order_by().
_SORTABLE_COLUMNS = {
    "opportunity_score": Product.opportunity_score,
    "demand_score": Product.demand_score,
    "price": Product.price,
    "rating": Product.rating,
    "review_count": Product.review_count,
    "name": Product.name,
}


def compute_opportunity_score(rating: float, demand_score: float, trend_score: float) -> float:
    """Compute the composite opportunity_score - see module docstring for the formula."""
    rating_norm = (rating / 5.0) * 100.0
    score = 0.35 * rating_norm + 0.40 * demand_score + 0.25 * trend_score
    return round(score, 1)


def get_latest_trend_score(db: Session, category_id: int) -> float:
    """
    Return the most recent trend_score for a category, or a neutral
    default (50.0) if no MarketTrend row exists yet for it.
    """
    trend = (
        db.query(MarketTrend)
        .filter(MarketTrend.category_id == category_id)
        .order_by(MarketTrend.generated_at.desc())
        .first()
    )
    return trend.trend_score if trend is not None else 50.0


def list_products(
    db: Session,
    category_id: int | None = None,
    sort_by: str = "opportunity_score",
    order: str = "desc",
    skip: int = 0,
    limit: int = 50,
) -> list[ProductRead]:
    """
    List products, optionally filtered by category, sorted by any column
    in _SORTABLE_COLUMNS, paginated via skip/limit.
    """
    query = db.query(Product)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    column = _SORTABLE_COLUMNS.get(sort_by, Product.opportunity_score)
    column = column.desc() if order.lower() == "desc" else column.asc()
    query = query.order_by(column)

    products = query.offset(skip).limit(limit).all()
    return [ProductRead.model_validate(p) for p in products]


def get_product(db: Session, product_id: int) -> ProductRead | None:
    """Fetch a single product by id, or None if it doesn't exist."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        return None
    return ProductRead.model_validate(product)


def category_exists(db: Session, category_id: int) -> bool:
    """Small helper used by the products router to 404 on unknown categories."""
    return db.query(Category).filter(Category.id == category_id).first() is not None
