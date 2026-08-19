"""
Factory that selects the active MarketDataProvider implementation based
on settings.DATA_PROVIDER. This is the single seam services should go
through - never import MockDataProvider/RainforestProvider directly
elsewhere in the codebase.
"""

from app.core.config import settings
from app.services.market_data_provider import MarketDataProvider
from app.services.mock_data_provider import MockDataProvider
from app.services.rainforest_provider import RainforestProvider


def get_data_provider() -> MarketDataProvider:
    """Return the configured MarketDataProvider (mock by default)."""
    if settings.DATA_PROVIDER.lower() == "rainforest":
        return RainforestProvider()
    return MockDataProvider()
