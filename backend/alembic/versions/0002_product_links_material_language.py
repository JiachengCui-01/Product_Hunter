"""Add product material/asin/url and report language/source_products

The change that motivated introducing Alembic: these five columns were
added to the models, but `create_all()` only creates missing TABLES - it
never alters existing ones. So the deployed database kept its old
`products` table and every SELECT against it failed with a 500 once the
models expected the new columns.

Adding them via migration means the existing rows (categories, products,
reviews, generated reports) survive, instead of the database being
dropped and re-seeded.

Server defaults: the new non-nullable JSON/text columns are added WITH a
server_default so the ALTER succeeds on a table that already has rows -
Postgres would otherwise reject adding a NOT NULL column with no default.
The defaults are then dropped, because the application layer (SQLAlchemy
`default=`) owns defaults from here on and leaving them in the DDL would
be a second, silently diverging source of truth.

Revision ID: 0002_product_links
Revises: 0001_baseline
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_product_links"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- products: derived material tags + real listing identifiers ---
    op.add_column(
        "products",
        sa.Column("material", sa.JSON(), nullable=False, server_default=sa.text("'[]'")),
    )
    # asin/url are nullable by design: mock-generated products have no real
    # listing, and a fabricated link would render as real but broken.
    op.add_column("products", sa.Column("asin", sa.Text(), nullable=True))
    op.add_column("products", sa.Column("url", sa.Text(), nullable=True))

    # --- opportunity_reports: generated language + cited source listings ---
    op.add_column(
        "opportunity_reports",
        sa.Column("language", sa.Text(), nullable=False, server_default="en"),
    )
    op.add_column(
        "opportunity_reports",
        sa.Column(
            "source_products", sa.JSON(), nullable=False, server_default=sa.text("'[]'")
        ),
    )

    # The server defaults above exist only so the ALTER succeeds against a
    # table that already has rows. Now that the columns are populated, drop
    # them so the application layer's SQLAlchemy `default=` stays the single
    # source of truth.
    #
    # SQLite cannot do this: it has no `ALTER COLUMN ... DROP DEFAULT`, and
    # Alembic's batch mode (which emulates ALTER by rebuilding the table) is
    # not worth a full table rebuild for a cosmetic cleanup. Leaving the
    # default in place there is harmless - it matches the application default
    # exactly - so this is skipped on SQLite rather than worked around.
    if op.get_bind().dialect.name != "sqlite":
        op.alter_column("products", "material", server_default=None)
        op.alter_column("opportunity_reports", "language", server_default=None)
        op.alter_column("opportunity_reports", "source_products", server_default=None)


def downgrade() -> None:
    op.drop_column("opportunity_reports", "source_products")
    op.drop_column("opportunity_reports", "language")
    op.drop_column("products", "url")
    op.drop_column("products", "asin")
    op.drop_column("products", "material")
