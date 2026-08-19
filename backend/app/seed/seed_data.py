"""
Database seed script.

Populates the database with:
    - all 7 categories (from fixtures/categories.json)
    - one MarketTrend per category (via MockDataProvider)
    - ~8 Products per category (via MockDataProvider) => ~56 products total
    - ~15 reviews each for the top 3 products per category by review_count
      (via MockDataProvider) => ~315 reviews total

Idempotent-ish: categories that already exist (matched by name) are
skipped entirely (including their products/trends/reviews), so running
this script twice will not duplicate data for categories that were
already seeded.

Run from the `backend/` directory with the venv active:

    python -m app.seed.seed_data
"""

import json
from pathlib import Path

from app.core.logging import get_logger
from app.database.init_db import create_all
from app.database.session import SessionLocal, engine
from app.models.category import Category
from app.models.market_trend import MarketTrend
from app.models.product import Product
from app.models.review import Review
from app.services.mock_data_provider import MockDataProvider
from app.services.product_service import compute_opportunity_score

logger = get_logger(__name__)

FIXTURES_PATH = Path(__file__).resolve().parent / "fixtures" / "categories.json"

PRODUCTS_PER_CATEGORY = 8
TOP_PRODUCTS_FOR_REVIEWS = 3
REVIEWS_PER_TOP_PRODUCT = 15


def load_category_fixtures() -> list[dict]:
    """Load the 7-category fixture list from fixtures/categories.json."""
    with open(FIXTURES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def seed() -> None:
    """Run the full seed pipeline. Safe to re-run (skips existing categories)."""
    # Ensure tables exist before we try to insert into them - the seed
    # script can be run standalone (e.g. before ever starting uvicorn),
    # so it must not depend on app.main's startup event having run.
    create_all(engine)

    db = SessionLocal()
    provider = MockDataProvider()

    summary = {
        "categories_created": [],
        "categories_skipped": [],
        "products_created": 0,
        "trends_created": 0,
        "reviews_created": 0,
    }

    try:
        fixtures = load_category_fixtures()

        for fixture in fixtures:
            existing = db.query(Category).filter(Category.name == fixture["name"]).first()
            if existing is not None:
                summary["categories_skipped"].append(fixture["name"])
                logger.info("Category '%s' already exists (id=%s) - skipping.", fixture["name"], existing.id)
                continue

            # --- Create the category ---
            category = Category(
                name=fixture["name"],
                description=fixture["description"],
                keywords=fixture["keywords"],
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            summary["categories_created"].append(category.name)
            logger.info("Created category '%s' (id=%s).", category.name, category.id)

            # --- Create one MarketTrend ---
            trend_data = provider.get_trend(category)
            trend = MarketTrend(
                category_id=category.id,
                trend_score=trend_data["trend_score"],
                growth=trend_data["growth"],
                keywords=trend_data["keywords"],
            )
            db.add(trend)
            db.commit()
            summary["trends_created"] += 1

            # --- Create ~8 products, scoring opportunity_score using the
            #     trend we just created ---
            product_dicts = provider.get_products(category, limit=PRODUCTS_PER_CATEGORY)
            created_products: list[Product] = []
            for pd in product_dicts:
                opportunity_score = compute_opportunity_score(
                    rating=pd["rating"],
                    demand_score=pd["demand_score"],
                    trend_score=trend_data["trend_score"],
                )
                product = Product(
                    name=pd["name"],
                    category_id=category.id,
                    price=pd["price"],
                    rating=pd["rating"],
                    review_count=pd["review_count"],
                    features=pd["features"],
                    opportunity_score=opportunity_score,
                    demand_score=pd["demand_score"],
                )
                db.add(product)
                created_products.append(product)
            db.commit()
            for p in created_products:
                db.refresh(p)
            summary["products_created"] += len(created_products)
            logger.info("Created %d products for category '%s'.", len(created_products), category.name)

            # --- Create ~15 reviews each for the top 3 products by review_count ---
            top_products = sorted(created_products, key=lambda p: p.review_count, reverse=True)[
                :TOP_PRODUCTS_FOR_REVIEWS
            ]
            review_rows = []
            for product in top_products:
                review_texts = provider.get_reviews(product.name, limit=REVIEWS_PER_TOP_PRODUCT)
                for text in review_texts:
                    review_rows.append(
                        Review(
                            product_id=product.id,
                            category_id=category.id,
                            review_text=text,
                        )
                    )
            db.add_all(review_rows)
            db.commit()
            summary["reviews_created"] += len(review_rows)
            logger.info(
                "Created %d reviews across top %d products for category '%s'.",
                len(review_rows),
                len(top_products),
                category.name,
            )

    finally:
        db.close()

    # --- Print a human-readable summary ---
    print("\n" + "=" * 60)
    print("SEED SUMMARY")
    print("=" * 60)
    print(f"Categories created : {len(summary['categories_created'])} -> {summary['categories_created']}")
    print(f"Categories skipped : {len(summary['categories_skipped'])} -> {summary['categories_skipped']}")
    print(f"Market trends created : {summary['trends_created']}")
    print(f"Products created      : {summary['products_created']}")
    print(f"Reviews created       : {summary['reviews_created']}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    seed()
