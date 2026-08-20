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

from collections import Counter

from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.market_trend import MarketTrend
from app.models.product import Product
from app.schemas.product import ProductFacets, ProductRead, ScoreBreakdown

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


DEMAND_FORMULA = "log10(review_count + 1) / log10(5001) * 100, clamped to 5-100"
OPPORTUNITY_FORMULA = "0.35 * rating_norm + 0.40 * demand_score + 0.25 * trend_score"
SCORE_WEIGHTS = {"rating": 0.35, "demand": 0.40, "trend": 0.25}


def build_score_breakdown(product: Product, trend_score: float) -> ScoreBreakdown:
    """
    Assemble the auditable explanation of a product's opportunity_score.

    The weights and formula strings come from the module-level constants
    that `compute_opportunity_score` itself uses, so what the UI displays
    can never drift from what was actually computed.
    """
    return ScoreBreakdown(
        rating_norm=round((product.rating / 5.0) * 100.0, 1),
        demand_score=product.demand_score,
        trend_score=trend_score,
        weights=SCORE_WEIGHTS,
        demand_formula=DEMAND_FORMULA,
        opportunity_formula=OPPORTUNITY_FORMULA,
    )


def list_products(
    db: Session,
    category_id: int | None = None,
    sort_by: str = "opportunity_score",
    order: str = "desc",
    skip: int = 0,
    limit: int = 50,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    materials: list[str] | None = None,
) -> list[ProductRead]:
    """
    List products with optional category / price / rating / material
    filters, sorted by any column in _SORTABLE_COLUMNS, paginated via
    skip/limit. Every product carries its score_breakdown so the client
    can explain the ranking.
    """
    query = db.query(Product)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if min_rating is not None:
        query = query.filter(Product.rating >= min_rating)

    column = _SORTABLE_COLUMNS.get(sort_by, Product.opportunity_score)
    column = column.desc() if order.lower() == "desc" else column.asc()
    query = query.order_by(column)

    products = query.all()

    # Material is a JSON list column. Filtering it in SQL would need
    # dialect-specific JSON operators (Postgres jsonb containment vs.
    # SQLite json_each), which would break the deliberate cross-dialect
    # portability of this codebase - see docs/ARCHITECTURE.md. Product
    # counts here are small (tens per category), so an OR-any match in
    # Python is both correct and cheap. Revisit if the catalogue grows to
    # a scale where this matters.
    if materials:
        wanted = {m.strip().lower() for m in materials if m.strip()}
        products = [
            p for p in products
            if wanted & {str(m).lower() for m in (p.material or [])}
        ]

    # Pagination is applied after material filtering so `skip`/`limit`
    # describe the filtered result set, not the pre-filter one.
    page = products[skip: skip + limit]

    trend_cache: dict[int, float] = {}
    results: list[ProductRead] = []
    for p in page:
        if p.category_id not in trend_cache:
            trend_cache[p.category_id] = get_latest_trend_score(db, p.category_id)
        item = ProductRead.model_validate(p)
        item.score_breakdown = build_score_breakdown(p, trend_cache[p.category_id])
        results.append(item)
    return results


def get_facets(db: Session, category_id: int | None = None) -> ProductFacets:
    """
    Summarize the filterable ranges and material values actually present
    in the data, so the UI's filter controls reflect reality instead of
    hardcoded guesses.
    """
    query = db.query(Product)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    products = query.all()

    if not products:
        return ProductFacets(
            price_min=0.0, price_max=0.0, rating_min=0.0, rating_max=0.0, materials=[]
        )

    counter: Counter[str] = Counter()
    for p in products:
        for m in (p.material or []):
            counter[str(m)] += 1

    prices = [p.price for p in products]
    ratings = [p.rating for p in products]
    return ProductFacets(
        price_min=round(min(prices), 2),
        price_max=round(max(prices), 2),
        rating_min=round(min(ratings), 1),
        rating_max=round(max(ratings), 1),
        materials=[
            {"value": value, "count": count}
            for value, count in sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))
        ],
    )


def get_product(db: Session, product_id: int) -> ProductRead | None:
    """Fetch a single product by id, or None if it doesn't exist."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        return None
    item = ProductRead.model_validate(product)
    # Same breakdown as the list endpoint, so a detail view can explain
    # the score without a second request.
    item.score_breakdown = build_score_breakdown(
        product, get_latest_trend_score(db, product.category_id)
    )
    return item


def category_exists(db: Session, category_id: int) -> bool:
    """Small helper used by the products router to 404 on unknown categories."""
    return db.query(Category).filter(Category.id == category_id).first() is not None
