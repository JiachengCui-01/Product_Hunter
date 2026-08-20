"""
Refresh market data (trends + products) for existing categories.

Distinct from `seed_data.py`, which bootstraps an EMPTY database and
deliberately skips any category that already exists. This script is for a
database that is already populated and needs its market data re-fetched
from the active MarketDataProvider - either because the data has gone
stale, or because new product fields were added and the existing rows
predate them.

That second case is the immediate reason this exists: the Alembic
migration that introduced `material` / `asin` / `url` could add the
columns to existing rows but obviously could not invent their values,
since they come from the marketplace API. Migrations move schema;
backfilling data needs a real fetch.

It is also the first concrete step toward the "real trend monitoring"
item on the roadmap (see docs/ARCHITECTURE.md) - a scheduled job would
just call this on a timer.

Reviews and generated opportunity reports are NOT touched: they are
either real customer text or real analysis output, and re-fetching
listings is no reason to discard them.

Usage (from backend/, venv active):
    python -m app.seed.refresh_market_data                  # all categories
    python -m app.seed.refresh_market_data --category "Laundry Room"
    python -m app.seed.refresh_market_data --dry-run

Cost note: with DATA_PROVIDER=rainforest this issues one real search
request per category (~1 API credit each), since get_trend/get_products
share a cached search per provider instance.
"""

import argparse

from app.core.logging import get_logger
from app.database.migrate import run_migrations
from app.database.session import SessionLocal, engine
from app.models.category import Category
from app.models.market_trend import MarketTrend
from app.models.product import Product
from app.models.review import Review
from app.services.product_service import compute_opportunity_score
from app.services.provider_factory import get_data_provider

logger = get_logger(__name__)

PRODUCTS_PER_CATEGORY = 8


def refresh(category_name: str | None = None, dry_run: bool = False) -> None:
    """Re-fetch trend + product data for one or all categories."""
    run_migrations(engine)

    db = SessionLocal()
    provider = get_data_provider()
    logger.info("Refreshing via provider: %s", type(provider).__name__)

    summary = {"categories": 0, "products_replaced": 0, "trends_added": 0, "failed": []}

    try:
        query = db.query(Category)
        if category_name:
            query = query.filter(Category.name == category_name)
        categories = query.order_by(Category.id).all()

        if not categories:
            print(f"No matching categories found{f' for {category_name!r}' if category_name else ''}.")
            return

        for category in categories:
            try:
                trend_data = provider.get_trend(category)
                product_dicts = provider.get_products(category, limit=PRODUCTS_PER_CATEGORY)
            except RuntimeError as exc:
                # One category failing (e.g. a provider hiccup) must not abort
                # the rest of the refresh - same reasoning as the seed script.
                logger.warning("Skipping '%s': %s", category.name, exc)
                summary["failed"].append(category.name)
                continue

            if dry_run:
                print(f"[dry-run] {category.name}: trend_score={trend_data['trend_score']}, "
                      f"{len(product_dicts)} products, "
                      f"first={product_dicts[0]['name'][:60] if product_dicts else 'n/a'}")
                summary["categories"] += 1
                continue

            # A new trend row rather than an overwrite: MarketTrend is read
            # "latest wins" (see product_service.get_latest_trend_score), so
            # appending builds the historical series that sales forecasting
            # and real growth-direction calculation will need.
            db.add(
                MarketTrend(
                    category_id=category.id,
                    trend_score=trend_data["trend_score"],
                    growth=trend_data["growth"],
                    keywords=trend_data["keywords"],
                )
            )
            db.commit()
            summary["trends_added"] += 1

            old_products = db.query(Product).filter(Product.category_id == category.id).all()
            old_ids = [p.id for p in old_products]

            # Detach reviews from the products being replaced instead of
            # cascading the delete: the review text is real customer feedback
            # and stays useful at category level, and a FK pointing at a
            # deleted product would break every reviews query.
            if old_ids:
                (
                    db.query(Review)
                    .filter(Review.product_id.in_(old_ids))
                    .update({Review.product_id: None}, synchronize_session=False)
                )
                db.query(Product).filter(Product.id.in_(old_ids)).delete(synchronize_session=False)
                db.commit()

            for pd in product_dicts:
                db.add(
                    Product(
                        name=pd["name"],
                        category_id=category.id,
                        price=pd["price"],
                        rating=pd["rating"],
                        review_count=pd["review_count"],
                        features=pd["features"],
                        material=pd.get("material") or [],
                        asin=pd.get("asin"),
                        url=pd.get("url"),
                        opportunity_score=compute_opportunity_score(
                            rating=pd["rating"],
                            demand_score=pd["demand_score"],
                            trend_score=trend_data["trend_score"],
                        ),
                        demand_score=pd["demand_score"],
                    )
                )
            db.commit()

            summary["products_replaced"] += len(product_dicts)
            summary["categories"] += 1
            with_links = sum(1 for pd in product_dicts if pd.get("url"))
            logger.info(
                "Refreshed '%s': %d products (%d with real listing URLs).",
                category.name, len(product_dicts), with_links,
            )
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("REFRESH SUMMARY" + (" (dry run - nothing written)" if dry_run else ""))
    print("=" * 60)
    print(f"Categories refreshed : {summary['categories']}")
    print(f"Trend snapshots added: {summary['trends_added']}")
    print(f"Products replaced    : {summary['products_replaced']}")
    if summary["failed"]:
        print(f"Failed               : {', '.join(summary['failed'])}")
    print("=" * 60 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", help="Only refresh this category (exact name)")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and report, write nothing")
    args = parser.parse_args()
    refresh(category_name=args.category, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
