"""
Declarative base for all SQLAlchemy ORM models.

Every model in app.models must inherit from this `Base` so that
`Base.metadata` reflects the full schema and `create_all()` (see
init_db.py) can create every table in one call.
"""

from sqlalchemy.orm import declarative_base

Base = declarative_base()
