"""
Declarative base for all SQLAlchemy ORM models.

Every model in app.models must inherit from this `Base` so that
`Base.metadata` reflects the full schema and `create_all()` (see
alembic/) can generate migrations for every table.
"""

from sqlalchemy.orm import declarative_base

Base = declarative_base()
