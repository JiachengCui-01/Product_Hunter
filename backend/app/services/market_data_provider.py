"""
MarketDataProvider abstract base class.

This is the seam that lets the whole application swap between a fully
deterministic, offline "mock" data source (MockDataProvider) and a real
market-data integration (RainforestProvider, using the Rainforest API to
scrape live Amazon data) without any service or router code changing -
see app.services.provider_factory.get_data_provider().
"""

from abc import ABC, abstractmethod


class MarketDataProvider(ABC):
    """Abstract interface for any furniture market data source."""

    @abstractmethod
    def get_trend(self, category) -> dict:
        """
        Return market trend data for a category.

        Args:
            category: a Category ORM instance (uses .name / .keywords).

        Returns:
            dict: {"trend_score": float, "growth": str, "keywords": list[str]}
        """
        raise NotImplementedError

    @abstractmethod
    def get_products(self, category, limit: int = 10) -> list[dict]:
        """
        Return a list of representative products for a category.

        Args:
            category: a Category ORM instance.
            limit: max number of products to return.

        Returns:
            list[dict]: each dict has keys
                {"name": str, "price": float, "rating": float,
                 "review_count": int, "features": list[str], "demand_score": float}
        """
        raise NotImplementedError

    @abstractmethod
    def get_reviews(self, product_name: str, limit: int = 15) -> list[str]:
        """
        Return a list of raw review text strings for a given product name.

        Args:
            product_name: the product to fetch/generate reviews for.
            limit: max number of reviews to return.

        Returns:
            list[str]: raw review sentences/paragraphs.
        """
        raise NotImplementedError
