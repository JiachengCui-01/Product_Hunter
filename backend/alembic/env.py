"""
Alembic migration environment.

Wired to the application's own configuration rather than alembic.ini's
`sqlalchemy.url`, so migrations always run against exactly the same
database the app uses (SQLite locally, managed Postgres in production)
with no second place to keep the URL in sync. `settings.resolved_database_url`
also normalizes the `postgres://` -> `postgresql://` scheme difference
some managed hosts emit - see app/core/config.py.

`target_metadata` points at the app's declarative Base, which is what
makes `alembic revision --autogenerate` able to diff the models against
a live database.

Batch mode note: `render_as_batch=True` is enabled because SQLite cannot
ALTER a column in place - Alembic emulates it by creating a new table,
copying rows, and swapping. Postgres ignores it. Without this, any future
column alteration would work in production and fail on a developer's
local SQLite, which is exactly the class of environment-specific
surprise this project has already been bitten by.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Import the app's settings and metadata. This requires `backend/` to be on
# sys.path, which is the case when alembic is invoked from that directory
# (see alembic.ini's prepend_sys_path).
from app.core.config import settings
from app.database.base import Base
import app.models  # noqa: F401 - registers every model on Base.metadata

config = context.config

# Feed the app's URL into the Alembic config that engine_from_config reads.
config.set_main_option("sqlalchemy.url", settings.resolved_database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Emit SQL to stdout instead of executing it (`alembic upgrade --sql`)."""
    context.configure(
        url=settings.resolved_database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations against a live database connection.

    Two entry paths are supported:

    - Programmatic (app.database.migrate.run_migrations): the caller puts an
      already-open Connection on `config.attributes`, and we migrate THAT
      database. This is Alembic's documented pattern for being driven from
      application code, and it matters for correctness: an earlier version
      always rebuilt the engine from `settings`, which meant
      `run_migrations(engine)` silently ignored the engine it was handed and
      migrated whatever DATABASE_URL pointed at instead. Sharing the
      connection also avoids having to re-serialize a URL containing a
      password through ConfigParser (where a '%' would be interpolated).

    - CLI (`alembic upgrade head`): no connection is supplied, so build one
      from the application settings.
    """
    connection = config.attributes.get("connection", None)

    if connection is not None:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()
        return

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as conn:
        context.configure(
            connection=conn,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
