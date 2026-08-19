"""
RainforestProvider - a MarketDataProvider implementation backed by the
real Rainforest API (https://www.rainforestapi.com/), which scrapes live
Amazon search/product/review data.

This is a real-integration SKETCH: the HTTP call shapes below follow
Rainforest's documented request conventions (a single GET to
/request with a `type` parameter selecting the sub-API), but this class
intentionally raises NotImplementedError with a clear message whenever
RAINFOREST_API_KEY is not configured, since we have no live key to
validate response parsing against in this environment. When a real key
is available, the response-parsing TODOs below should be adjusted to
match actual observed payloads (Rainforest's response schema varies
slightly by category/marketplace).
"""

from app.core.config import settings
from app.core.logging import get_logger
from app.services.market_data_provider import MarketDataProvider

logger = get_logger(__name__)

RAINFOREST_BASE_URL = "https://api.rainforestapi.com/request"


class RainforestProvider(MarketDataProvider):
    """MarketDataProvider implementation that calls the real Rainforest API."""

    def __init__(self):
        self.api_key = settings.RAINFOREST_API_KEY
        self.base_url = RAINFOREST_BASE_URL

    def _require_api_key(self, operation: str) -> None:
        if not self.api_key:
            raise NotImplementedError(
                f"RainforestProvider.{operation} requires RAINFOREST_API_KEY to be "
                "set in backend/.env. Set DATA_PROVIDER=mock to use the built-in "
                "offline mock data provider instead, or add a valid Rainforest "
                "API key (https://www.rainforestapi.com/) to enable live data."
            )

    def get_trend(self, category) -> dict:
        """
        Fetch category-level trend signal from Rainforest's `category`
        request type (which returns Amazon category/bestseller metadata
        we can use as a market-trend proxy).

        Real request shape (per Rainforest docs conventions):
            GET https://api.rainforestapi.com/request
                ?api_key=<key>
                &type=category
                &amazon_domain=amazon.com
                &category_id=<amazon category id derived from category.name>
        """
        self._require_api_key("get_trend")

        import httpx  # imported lazily; only needed on the real-API path

        params = {
            "api_key": self.api_key,
            "type": "category",
            "amazon_domain": "amazon.com",
            "search_term": category.name,
        }
        response = httpx.get(self.base_url, params=params, timeout=30.0)
        response.raise_for_status()
        payload = response.json()

        # TODO: Rainforest's `category` response includes bestseller and
        # category metadata; a production implementation would derive
        # trend_score from rank deltas / bestseller movement, growth from
        # a historical comparison, and keywords from related searches.
        # Left unimplemented pending a live API key to validate against.
        raise NotImplementedError(
            "RainforestProvider.get_trend response parsing is not yet "
            "implemented - add parsing logic once a live RAINFOREST_API_KEY "
            f"is available. Raw payload keys observed: {list(payload.keys())}"
        )

    def get_products(self, category, limit: int = 10) -> list[dict]:
        """
        Fetch representative products for a category via Rainforest's
        `search` request type.

        Real request shape (per Rainforest docs conventions):
            GET https://api.rainforestapi.com/request
                ?api_key=<key>
                &type=search
                &amazon_domain=amazon.com
                &search_term=<category.name furniture>
                &output=json
        """
        self._require_api_key("get_products")

        import httpx

        params = {
            "api_key": self.api_key,
            "type": "search",
            "amazon_domain": "amazon.com",
            "search_term": f"{category.name} furniture",
            "output": "json",
        }
        response = httpx.get(self.base_url, params=params, timeout=30.0)
        response.raise_for_status()
        payload = response.json()

        # TODO: map payload["search_results"][:limit] into
        # {"name": r["title"], "price": r["price"]["value"], "rating": r["rating"],
        #  "review_count": r["ratings_total"], "features": [...], "demand_score": ...}
        # Left unimplemented pending a live API key to validate the exact
        # field names Rainforest returns for the "search" request type.
        raise NotImplementedError(
            "RainforestProvider.get_products response parsing is not yet "
            "implemented - add parsing logic once a live RAINFOREST_API_KEY "
            f"is available. Raw payload keys observed: {list(payload.keys())}"
        )

    def get_reviews(self, product_name: str, limit: int = 15) -> list[str]:
        """
        Fetch real customer reviews for a product via Rainforest's
        `reviews` request type (requires an Amazon ASIN, which a full
        implementation would resolve from product_name via a prior
        `search` call).

        Real request shape (per Rainforest docs conventions):
            GET https://api.rainforestapi.com/request
                ?api_key=<key>
                &type=reviews
                &amazon_domain=amazon.com
                &asin=<resolved ASIN>
        """
        self._require_api_key("get_reviews")

        import httpx

        # A full implementation would first resolve product_name -> ASIN
        # via a `search` call, then fetch reviews for that ASIN. Sketched
        # here as a direct call assuming an ASIN lookup step happened.
        params = {
            "api_key": self.api_key,
            "type": "reviews",
            "amazon_domain": "amazon.com",
            "search_term": product_name,  # placeholder until ASIN resolution is implemented
        }
        response = httpx.get(self.base_url, params=params, timeout=30.0)
        response.raise_for_status()
        payload = response.json()

        # TODO: map payload["reviews"][:limit] -> [r["body"] for r in ...]
        raise NotImplementedError(
            "RainforestProvider.get_reviews response parsing is not yet "
            "implemented - add parsing logic once a live RAINFOREST_API_KEY "
            f"is available. Raw payload keys observed: {list(payload.keys())}"
        )
