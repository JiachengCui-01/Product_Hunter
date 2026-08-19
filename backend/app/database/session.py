"""
SQLAlchemy engine and session factory.

Provides:
    engine        - the SQLAlchemy Engine, built from settings.resolved_database_url
    SessionLocal  - a sessionmaker bound to that engine
    get_db()      - a FastAPI dependency that yields a Session and
                    guarantees it is closed after the request, even on
                    error.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

_DATABASE_URL = settings.resolved_database_url

# SQLite needs `check_same_thread=False` because FastAPI (via Starlette)
# may service a single request's dependency chain across different
# threads under the hood (e.g. when running sync endpoints in a
# threadpool). Other dialects (Postgres, MySQL, ...) do not need and do
# not accept this argument, so it is only applied conditionally - this
# is what keeps the codebase portable to a real database later.
_connect_args = {"check_same_thread": False} if _DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(_DATABASE_URL, connect_args=_connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session per-request.

    Usage:
        @router.get("/things")
        def list_things(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
