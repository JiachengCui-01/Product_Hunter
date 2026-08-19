"""Pydantic schemas for the Category resource."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class CategoryBase(BaseModel):
    """Fields shared between create and read schemas."""

    name: str = Field(..., description="Unique category name, e.g. 'Living Room'")
    description: str | None = Field(None, description="Human-readable description of the category")
    keywords: list[str] = Field(default_factory=list, description="Representative keywords/tags")


class CategoryCreate(CategoryBase):
    """Payload for POST /api/categories."""

    pass


class CategoryRead(ORMBase, CategoryBase):
    """Response schema for a Category row."""

    id: int
    created_at: datetime
