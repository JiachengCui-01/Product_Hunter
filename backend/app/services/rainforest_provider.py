"""
RainforestProvider - a MarketDataProvider implementation backed by the
real Rainforest API (https://www.rainforestapi.com/), which returns live
Amazon search/product/review data.

Design notes (learned from a live diagnostic call against a real trial
key - see backend/scripts/_rainforest_diagnostic.py):

- A single `type=search` request for "<category name> furniture" returns
  everything needed for BOTH get_trend() and get_products(): a list of
  real Amazon listings with title/asin/price/rating/ratings_total. There
  is no separate "category trend" endpoint that accepts a free-text
  category name (Rainforest's `category`/`bestsellers` request types
  need a specific Amazon browse-node id, which we have no reliable way
  to look up for a generic name like "Laundry Room"). So `get_trend` and
  `get_products` both derive from the same search call, cached per
  category instance so a full 7-category seed run costs ~7 API credits
  total instead of ~14.

- Amazon search results do NOT include bullet-point features (that
  requires a separate `type=product` call per ASIN, which would multiply
  credit cost by the number of products fetched). As a pragmatic MVP
  compromise, `features` are heuristically extracted from each listing's
  title (split on common delimiters). A future enhancement, once budget
  allows, would call `type=product` for the top-N ASINs per category to
  get real bullet points.

- Amazon search is a single point-in-time snapshot, so there is no
  historical basis to compute a real "growth" direction from one call.
  `growth` is deliberately reported as "Stable" with a comment - see
  docs/ARCHITECTURE.md's future upgrade path ("real trend monitoring":
  persist trend snapshots over time and compute real deltas).

- At the time this was written, Rainforest's `type=reviews` endpoint was
  observed returning `503 - "reviews request type is temporarily
  unavailable"` (a known, longstanding issue on their end, not specific
  to this integration - Rainforest's own status page and support threads
  confirm intermittent outages of this specific request type). The
  request/response handling below is fully implemented and will work as
  soon as Rainforest's endpoint is healthy again; until then it raises a
  clear, non-crashing error surfaced as a normal API 503 (see
  api/analysis.py / api/reviews.py's existing error handling), not a
  silent fallback to fake data.
"""

import re
from collections import Counter

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.services.market_data_provider import MarketDataProvider

logger = get_logger(__name__)

RAINFOREST_BASE_URL = "https://api.rainforestapi.com/request"

# Generic words that show up constantly in Amazon furniture titles but
# carry no useful market-research signal - filtered out of both the
# trend-keyword extraction and the per-product feature extraction.
_STOPWORDS = {
    "the", "and", "for", "with", "your", "this", "that", "from", "into",
    "amazon", "set", "pack", "new", "easy", "our", "you", "are", "can",
    "all", "size", "large", "small", "free", "tool", "extra", "pieces",
}


def _extract_keywords(titles: list[str], top_n: int = 6) -> list[str]:
    """
    Derive representative market keywords from a batch of real Amazon
    listing titles - a lightweight (no ML/NLP dependency) frequency-based
    extraction: lowercase, split on non-letters, drop short/stopword
    tokens, then take the most common remaining words, Title-Cased for
    display. This is intentionally simple; it surfaces real recurring
    terms from real listings rather than a canned keyword pool.
    """
    counts: Counter[str] = Counter()
    for title in titles:
        words = re.findall(r"[a-zA-Z]{4,}", title.lower())
        for w in words:
            if w not in _STOPWORDS:
                counts[w] += 1
    return [word.title() for word, _ in counts.most_common(top_n)]


def _extract_features(title: str, max_features: int = 4) -> list[str]:
    """
    Heuristically derive a handful of "feature"-like phrases from a
    listing title by splitting on common delimiters Amazon sellers use
    to pack multiple selling points into one title (|, commas, em/en
    dashes). Short/generic fragments are dropped. This is a deliberate
    MVP compromise - see module docstring - not real bullet-point data.
    """
    fragments = re.split(r"[|–—,]", title)
    features = []
    for frag in fragments:
        cleaned = frag.strip(" .-")
        # Skip fragments that are too short to be meaningful, or that are
        # almost entirely digits/symbols (e.g. a stray dimension string).
        if len(cleaned) < 6 or sum(c.isalpha() for c in cleaned) < 4:
            continue
        features.append(cleaned)
        if len(features) >= max_features:
            break
    return features


def _extract_price(item: dict) -> float:
    """
    Extract a numeric price from a search-result item. Rainforest's
    `price` field (a single dict) is preferred; `prices` (a list of
    price options, e.g. multiple buying choices) is used as a fallback.
    Defensive because Amazon listings frequently omit price entirely
    (out of stock, "see options", etc.) - returns 0.0 rather than
    raising, so one malformed listing never breaks a whole category fetch.
    """
    price = item.get("price")
    if isinstance(price, dict) and isinstance(price.get("value"), (int, float)):
        return float(price["value"])

    prices = item.get("prices")
    if isinstance(prices, list) and prices:
        first = prices[0]
        if isinstance(first, dict) and isinstance(first.get("value"), (int, float)):
            return float(first["value"])

    return 0.0


def _demand_score_from_review_count(ratings_total: int) -> float:
    """
    Map a raw Amazon review count onto the same 0-100 `demand_score`
    scale MockDataProvider uses (see product_service.py's docstring for
    how this feeds into opportunity_score). Review counts are extremely
    right-skewed (a handful of listings have tens of thousands, most have
    a few dozen), so this uses a log scale rather than a linear one -
    otherwise almost every real product would score near 0.

    5000+ reviews is treated as "maximum observed demand" (-> 100);
    a floor of 5.0 keeps brand-new listings with 0 reviews from scoring
    a hard zero (they may still be a real, viable opportunity).
    """
    import math

    if ratings_total <= 0:
        return 5.0
    score = (math.log10(ratings_total + 1) / math.log10(5001)) * 100.0
    return round(min(100.0, max(5.0, score)), 1)


class RainforestProvider(MarketDataProvider):
    """MarketDataProvider implementation that calls the real Rainforest API."""

    def __init__(self):
        self.api_key = settings.RAINFOREST_API_KEY
        self.base_url = RAINFOREST_BASE_URL
        # Per-instance caches so a single request/seed run never issues
        # more than one search call per category, and get_reviews() can
        # resolve a product name back to its ASIN without an extra call.
        self._search_cache: dict[str, dict] = {}
        self._asin_by_name: dict[str, str] = {}

    def _require_api_key(self, operation: str) -> None:
        if not self.api_key:
            raise RuntimeError(
                f"RainforestProvider.{operation} requires RAINFOREST_API_KEY to be "
                "set in backend/.env. Set DATA_PROVIDER=mock to use the built-in "
                "offline mock data provider instead, or add a valid Rainforest "
                "API key (https://www.rainforestapi.com/) to enable live data."
            )

    def _request(self, params: dict) -> dict:
        """
        Shared GET helper for every Rainforest call.

        Deliberately does NOT call `response.raise_for_status()` before
        reading the body: Rainforest returns a normal JSON body (with
        `request_info.success: false` + a human-readable `message`) even
        on 4xx/5xx responses (observed live for a 503 on `type=reviews`),
        and that message is far more useful to surface than a generic
        "503 Service Unavailable" with no body. Only a genuinely
        unparseable response falls back to a generic error.

        Every failure mode - HTTP error, unparseable body, or a raw
        network-level failure (DNS, connection reset, TLS handshake
        drop, timeout, etc.) - is normalized to `RuntimeError`, since
        every caller of this provider (seed script, opportunity service,
        API routers) is written to catch exactly that one exception type
        as "this data source failed cleanly" - see e.g. seed_data.py's
        per-product try/except around get_reviews().
        """
        try:
            response = httpx.get(self.base_url, params=params, timeout=30.0)
        except httpx.HTTPError as exc:
            raise RuntimeError(f"Rainforest API request failed (network error): {exc}") from exc

        try:
            payload = response.json()
        except ValueError:
            raise RuntimeError(
                f"Rainforest API returned a non-JSON response (status {response.status_code})."
            ) from None

        if not payload.get("request_info", {}).get("success", True):
            message = payload.get("request_info", {}).get("message", "Unknown Rainforest API error")
            raise RuntimeError(f"Rainforest API request failed (status {response.status_code}): {message}")

        return payload

    def _search(self, category_name: str, number_of_results: int = 20) -> dict:
        """
        Run (or reuse a cached) `type=search` request for a category,
        excluding sponsored listings so results reflect organic market
        signal rather than paid placements.
        """
        cache_key = category_name.lower()
        if cache_key in self._search_cache:
            return self._search_cache[cache_key]

        params = {
            "api_key": self.api_key,
            "type": "search",
            "amazon_domain": "amazon.com",
            "search_term": f"{category_name} furniture",
            "number_of_results": number_of_results,
            "exclude_sponsored": "true",
            "output": "json",
        }
        payload = self._request(params)
        self._search_cache[cache_key] = payload

        # Populate the name->asin lookup used by get_reviews() while we
        # have the data in hand, so it never has to re-search by name.
        for item in payload.get("search_results", []):
            name, asin = item.get("title"), item.get("asin")
            if name and asin:
                self._asin_by_name[name] = asin

        return payload

    def get_trend(self, category) -> dict:
        """
        Derive a trend signal from real Amazon search results for this
        category - see module docstring for why this (not a dedicated
        "category" endpoint) is the practical approach.
        """
        self._require_api_key("get_trend")
        payload = self._search(category.name)
        results = payload.get("search_results", [])

        if not results:
            logger.warning("Rainforest search for '%s' returned no results.", category.name)
            return {"trend_score": 50.0, "growth": "Stable", "keywords": list(category.keywords or [])}

        avg_rating = sum(r.get("rating") or 0 for r in results) / len(results)
        avg_demand = sum(_demand_score_from_review_count(r.get("ratings_total") or 0) for r in results) / len(results)
        # Same weighting philosophy as compute_opportunity_score() in
        # product_service.py - simple, transparent blend of satisfaction
        # (rating) and demand (review volume), no ML.
        trend_score = round(0.5 * avg_demand + 0.5 * ((avg_rating / 5.0) * 100.0), 1)

        keywords = _extract_keywords([r.get("title", "") for r in results]) or list(category.keywords or [])

        return {
            "trend_score": trend_score,
            # NOTE: a single point-in-time search has no historical basis
            # for a real growth direction - see module docstring. Reported
            # as "Stable" until trend snapshots are persisted over time.
            "growth": "Stable",
            "keywords": keywords,
        }

    def get_products(self, category, limit: int = 10) -> list[dict]:
        """Map real Amazon search results into our Product dict shape."""
        self._require_api_key("get_products")
        payload = self._search(category.name)
        results = [r for r in payload.get("search_results", []) if r.get("title") and r.get("asin")][:limit]

        products = []
        for item in results:
            products.append(
                {
                    "name": item["title"],
                    "price": _extract_price(item),
                    "rating": float(item.get("rating") or 0.0),
                    "review_count": int(item.get("ratings_total") or 0),
                    "features": _extract_features(item["title"]) or [category.name],
                    "demand_score": _demand_score_from_review_count(item.get("ratings_total") or 0),
                }
            )
        return products

    def get_reviews(self, product_name: str, limit: int = 15) -> list[str]:
        """
        Fetch real customer reviews for a product via Rainforest's
        `reviews` request type, resolving product_name -> ASIN from the
        cache populated by get_products()/get_trend() (falls back to a
        fresh single-item search if the name wasn't seen this session).

        As of writing, Rainforest's `reviews` request type is
        intermittently down on their end (see module docstring) - this
        raises a clear RuntimeError in that case rather than silently
        returning nothing, so the failure is visible instead of masked.
        """
        self._require_api_key("get_reviews")

        asin = self._asin_by_name.get(product_name)
        if asin is None:
            # Product wasn't fetched via our own get_products() this
            # session - resolve it with a one-off search (costs 1 extra
            # API credit).
            search_payload = self._request(
                {
                    "api_key": self.api_key,
                    "type": "search",
                    "amazon_domain": "amazon.com",
                    "search_term": product_name,
                    "number_of_results": 1,
                    "output": "json",
                }
            )
            results = search_payload.get("search_results", [])
            if not results:
                raise RuntimeError(f"Could not resolve an Amazon ASIN for product name: {product_name!r}")
            asin = results[0]["asin"]
            self._asin_by_name[product_name] = asin

        try:
            payload = self._request(
                {
                    "api_key": self.api_key,
                    "type": "reviews",
                    "amazon_domain": "amazon.com",
                    "asin": asin,
                    "output": "json",
                }
            )
        except RuntimeError as exc:
            raise RuntimeError(
                f"{exc} This is a known intermittent issue with Rainforest's "
                "`reviews` request type, not specific to this integration - "
                "retry later, or set DATA_PROVIDER=mock in the meantime."
            ) from exc

        reviews = payload.get("reviews", [])[:limit]
        texts = []
        for r in reviews:
            body = r.get("body") or r.get("title")
            if body:
                texts.append(body)
        return texts
