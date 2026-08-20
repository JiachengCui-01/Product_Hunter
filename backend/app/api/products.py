"""Product endpoints: list (filterable/sortable), filter facets, fetch-by-id."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import PaginationParams, pagination_params
from app.database.session import get_db
from app.schemas.product import ProductFacets, ProductRead
from app.services import product_service

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    category_id: int | None = Query(None, description="Filter to a single category"),
    min_price: float | None = Query(None, ge=0, description="Minimum price, inclusive"),
    max_price: float | None = Query(None, ge=0, description="Maximum price, inclusive"),
    min_rating: float | None = Query(None, ge=0, le=5, description="Minimum star rating, inclusive"),
    material: str | None = Query(
        None,
        description=(
            "Comma-separated canonical material values, e.g. 'Wood,Metal'. "
            "Matches products having ANY of the given materials."
        ),
    ),
    sort_by: str = Query(
        "opportunity_score",
        description="Column to sort by: opportunity_score, demand_score, price, rating, review_count, name",
    ),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order: asc or desc"),
    pagination: PaginationParams = Depends(pagination_params),
    db: Session = Depends(get_db),
):
    """
    List products with optional category / price / rating / material
    filters, sorted by sort_by/order and paginated via skip/limit.

    Each item includes a `score_breakdown` explaining how its
    opportunity_score was derived (see product_service).
    """
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="min_price cannot be greater than max_price.",
        )

    materials = [m.strip() for m in material.split(",") if m.strip()] if material else None

    return product_service.list_products(
        db,
        category_id=category_id,
        sort_by=sort_by,
        order=order,
        skip=pagination.skip,
        limit=pagination.limit,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        materials=materials,
    )


@router.get("/facets", response_model=ProductFacets)
def get_facets(
    category_id: int | None = Query(None, description="Scope facets to a single category"),
    db: Session = Depends(get_db),
):
    """
    Filter metadata (price/rating bounds, available materials with counts)
    for building the product-filter UI from the data that actually exists.

    NOTE: this route is declared BEFORE `/{product_id}` on purpose -
    FastAPI matches routes in declaration order, and "facets" would
    otherwise be captured by the int path param and 422 out.
    """
    return product_service.get_facets(db, category_id=category_id)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Fetch a single product by id."""
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found.",
        )
    return product
