"""Product endpoints: list (filterable/sortable) and fetch-by-id."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import PaginationParams, pagination_params
from app.database.session import get_db
from app.schemas.product import ProductRead
from app.services import product_service

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    category_id: int | None = Query(None, description="Filter to a single category"),
    sort_by: str = Query(
        "opportunity_score",
        description="Column to sort by: opportunity_score, demand_score, price, rating, review_count, name",
    ),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order: asc or desc"),
    pagination: PaginationParams = Depends(pagination_params),
    db: Session = Depends(get_db),
):
    """
    List products, optionally filtered by category_id, sorted by
    sort_by/order, and paginated via skip/limit.
    """
    return product_service.list_products(
        db,
        category_id=category_id,
        sort_by=sort_by,
        order=order,
        skip=pagination.skip,
        limit=pagination.limit,
    )


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
