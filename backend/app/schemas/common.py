"""
Shared schema helpers.

`ORMBase` is a small mixin that turns on `from_attributes=True`
(pydantic v2's replacement for the old `orm_mode = True`), which lets a
Pydantic model be constructed directly from a SQLAlchemy ORM instance,
e.g. `CategoryRead.model_validate(category_orm_obj)`.
"""

from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    """Base class for response schemas that are built from ORM objects."""

    model_config = ConfigDict(from_attributes=True)
