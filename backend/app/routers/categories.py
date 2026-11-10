"""Categories router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from ..services import create_category, get_categories, update_category

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories_endpoint(db: Session = Depends(get_db)):
    return get_categories(db)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category_endpoint(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
):
    try:
        cat = create_category(db, payload, performed_by="web_ui")
        return {
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "budget_limit": cat.budget_limit,
            "created_at": cat.created_at,
            "updated_at": cat.updated_at,
            "subscription_count": 0,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category_endpoint(
    category_id: UUID,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
):
    cat = update_category(db, category_id, payload, performed_by="web_ui")
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "budget_limit": cat.budget_limit,
        "created_at": cat.created_at,
        "updated_at": cat.updated_at,
        "subscription_count": len(cat.subscriptions) if cat.subscriptions else 0,
    }
