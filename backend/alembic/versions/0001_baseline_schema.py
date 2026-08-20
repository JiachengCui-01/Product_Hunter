"""Baseline schema (state before material/asin/url/language/source_products)

This revision describes the schema as it existed BEFORE the product-link,
material and output-language work. It exists as a separate baseline so an
already-deployed database created by the old `create_all()` can be
`alembic stamp`-ed here and then upgraded forward, instead of having to be
dropped and re-seeded (which is what happened three times before Alembic
was introduced).

For a brand-new database this revision simply creates every table.

Revision ID: 0001_baseline
Revises: None
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("keywords", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categories_id"), "categories", ["id"])
    op.create_index(op.f("ix_categories_name"), "categories", ["name"], unique=True)

    op.create_table(
        "market_trends",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("trend_score", sa.Float(), nullable=False),
        sa.Column("growth", sa.String(length=20), nullable=False),
        sa.Column("keywords", sa.JSON(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_market_trends_id"), "market_trends", ["id"])
    op.create_index(op.f("ix_market_trends_category_id"), "market_trends", ["category_id"])

    # NOTE: `name` is Text, not String(N). Real Amazon listing titles exceed
    # 255 chars (observed 320); SQLite ignores VARCHAR limits so a capped
    # length passed local tests and then failed only on Postgres.
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=False),
        sa.Column("review_count", sa.Integer(), nullable=False),
        sa.Column("features", sa.JSON(), nullable=False),
        sa.Column("opportunity_score", sa.Float(), nullable=False),
        sa.Column("demand_score", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_id"), "products", ["id"])
    op.create_index(op.f("ix_products_name"), "products", ["name"])
    op.create_index(op.f("ix_products_category_id"), "products", ["category_id"])

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("review_text", sa.Text(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reviews_id"), "reviews", ["id"])
    op.create_index(op.f("ix_reviews_product_id"), "reviews", ["product_id"])
    op.create_index(op.f("ix_reviews_category_id"), "reviews", ["category_id"])

    op.create_table(
        "review_analyses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("positive", sa.JSON(), nullable=False),
        sa.Column("negative", sa.JSON(), nullable=False),
        sa.Column("pain_points", sa.JSON(), nullable=False),
        sa.Column("source_review_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_review_analyses_id"), "review_analyses", ["id"])
    op.create_index(op.f("ix_review_analyses_product_id"), "review_analyses", ["product_id"])
    op.create_index(op.f("ix_review_analyses_category_id"), "review_analyses", ["category_id"])

    op.create_table(
        "opportunity_reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("product_name", sa.Text(), nullable=False),
        sa.Column("target_customer", sa.Text(), nullable=False),
        sa.Column("pain_points", sa.JSON(), nullable=False),
        sa.Column("solution", sa.Text(), nullable=False),
        sa.Column("features", sa.JSON(), nullable=False),
        sa.Column("selling_points", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_opportunity_reports_id"), "opportunity_reports", ["id"])
    op.create_index(
        op.f("ix_opportunity_reports_category_id"), "opportunity_reports", ["category_id"]
    )


def downgrade() -> None:
    op.drop_table("opportunity_reports")
    op.drop_table("review_analyses")
    op.drop_table("reviews")
    op.drop_table("products")
    op.drop_table("market_trends")
    op.drop_table("categories")
