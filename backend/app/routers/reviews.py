"""Renewal reviews router."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from ..services import create_review, get_reviews, update_review

router = APIRouter(prefix="/reviews", tags=["Renewal Reviews"])


@router.get("", response_model=list[ReviewResponse])
def list_reviews_endpoint(
    subscription_id: Optional[UUID] = Query(None),
    decision: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return get_reviews(
        db=db,
        subscription_id=subscription_id,
        decision=decision,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review_endpoint(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
):
    try:
        review = create_review(db, payload, performed_by="web_ui")
        reviews = get_reviews(db, subscription_id=review.subscription_id, limit=1)
        return reviews[0] if reviews else review
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review_endpoint(
    review_id: UUID,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
):
    review = update_review(db, review_id, payload, performed_by="web_ui")
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    reviews = get_reviews(db, subscription_id=review.subscription_id, limit=1)
    return reviews[0] if reviews else review
