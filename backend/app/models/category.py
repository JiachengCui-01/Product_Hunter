"""Category model: a top-level furniture market segment (e.g. 'Living Room')."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, JSON, DateTime

from app.database.base import Base


class Category(Base):
    """
    A furniture market category/segment, e.g. "Living Room" or "Kitchen".

    `keywords` is a JSON list of strings used both for display and as
    lightweight search/embedding seed terms for the mock data provider
    and RAG enrichment.
    """

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    keywords = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover - debug helper only
        return f"<Category id={self.id} name={self.name!r}>"
