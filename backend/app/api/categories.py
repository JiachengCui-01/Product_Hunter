"""
Category endpoints: list, create, and fetch-by-id for the 7 furniture
market categories that anchor the rest of the data model.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import PaginationParams, pagination_params
from app.database.session import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryRead

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(
    pagination: PaginationParams = Depends(pagination_params),
    db: Session = Depends(get_db),
):
    """List all categories, paginated."""
    categories = (
        db.query(Category)
        .order_by(Category.name.asc())
        .offset(pagination.skip)
        .limit(pagination.limit)
        .all()
    )
    return categories


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    """
    Create a new category.

    Returns 409 if a category with the same name already exists (name is
    a unique column).
    """
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category with name '{payload.name}' already exists (id={existing.id}).",
        )

    category = Category(
        name=payload.name,
        description=payload.description,
        keywords=payload.keywords,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Fetch a single category by id."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {category_id} not found.",
        )
    return category
