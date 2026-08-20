"""
SQLAlchemy models package.

Importing this package (or any name from it) guarantees every model
module has been imported and therefore registered on
`app.database.base.Base.metadata` - this is what allows
Alembic's autogenerate to see every table, and lets migrations run with a single
call, regardless of which module happens to trigger the import.
"""

from app.models.category import Category
from app.models.market_trend import MarketTrend
from app.models.product import Product
from app.models.review import Review
from app.models.review_analysis import ReviewAnalysis
from app.models.opportunity_report import OpportunityReport

__all__ = [
    "Category",
    "MarketTrend",
    "Product",
    "Review",
    "ReviewAnalysis",
    "OpportunityReport",
]
