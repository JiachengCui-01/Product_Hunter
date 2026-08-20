"""
Real-review fixture loader.

Serves genuine Amazon customer reviews (sourced from the free Amazon
Reviews'23 academic dataset) from committed JSON fixtures, as a review
source for aspect-based sentiment analysis and opportunity generation.

WHY THIS EXISTS
---------------
Review text is the one input this app needs that is both expensive to buy
live (a paid marketplace API bills per product) and largely
freshness-insensitive - a complaint that a dresser drawer arrives with the
rails backwards is exactly as actionable a year later. It is also, at time
of writing, simply unavailable from the configured live provider:
Rainforest's `type=reviews` endpoint has been returning 503 for an
extended period, which left "Generate Report" broken in production.

So real reviews are shipped with the repo instead of fetched. This is
strictly better than the synthetic MockDataProvider templates (which
repeat across products and are obviously not real customer language) and
costs nothing.

The fixtures are produced by `backend/scripts/build_review_fixtures.py`,
a build-time script - see its docstring for sourcing, filtering, and the
licensing caveat. This module only reads what that script committed.
"""

import json
from functools import lru_cache
from pathlib import Path

from app.core.logging import get_logger

logger = get_logger(__name__)

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "seed" / "fixtures" / "reviews"


def _slugify(category_name: str) -> str:
    """"Laundry Room" -> "laundry-room" (matches the build script's naming)."""
    return category_name.strip().lower().replace(" ", "-")


@lru_cache(maxsize=32)
def _load_fixture(slug: str) -> tuple[dict, ...]:
    """
    Read and cache one category's fixture file.

    Returns an empty tuple (rather than raising) when a category has no
    fixture, so a newly added category simply has no dataset reviews
    instead of breaking the callers that fall back to other sources.
    Cached as a tuple because lru_cache requires a hashable return value.
    """
    path = FIXTURES_DIR / f"{slug}.json"
    if not path.exists():
        return ()
    try:
        with open(path, "r", encoding="utf-8") as f:
            return tuple(json.load(f))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not read review fixture %s: %s", path, exc)
        return ()


def has_reviews(category_name: str) -> bool:
    """True if this category has any dataset reviews available."""
    return bool(_load_fixture(_slugify(category_name)))


def get_reviews(category_name: str, limit: int = 20, negative_bias: bool = True) -> list[str]:
    """
    Return real review texts for a category.

    Args:
        category_name: an app category name, e.g. "Laundry Room".
        limit: maximum number of reviews to return.
        negative_bias: when True (the default), lower-rated reviews are
            returned first. Aspect-based sentiment analysis is most useful
            when it surfaces concrete pain points, and 1-3 star reviews are
            where those live; a natural rating distribution is dominated by
            5-star reviews that mostly say "love it", which produces a
            report with plenty of positives and no actionable problems.
            The fixtures still include positives, so the "what users love"
            side of the analysis has material too.
    """
    records = _load_fixture(_slugify(category_name))
    if not records:
        return []

    ordered = list(records)
    if negative_bias:
        ordered.sort(key=lambda r: (r.get("rating") or 5))

    return [r["review"] for r in ordered[:limit] if r.get("review")]


def get_review_records(category_name: str, limit: int = 20) -> list[dict]:
    """
    Like `get_reviews`, but returns the full records (rating, title,
    verified_purchase, helpful_vote, asin) - used by the seed script so
    stored Review rows can carry the real rating alongside the text.
    """
    records = _load_fixture(_slugify(category_name))
    if not records:
        return []
    ordered = sorted(records, key=lambda r: (r.get("rating") or 5))
    return ordered[:limit]


def available_categories() -> list[str]:
    """Category slugs that currently have fixtures - useful for diagnostics."""
    if not FIXTURES_DIR.exists():
        return []
    return sorted(p.stem for p in FIXTURES_DIR.glob("*.json"))
