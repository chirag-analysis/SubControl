"""Savings opportunities router."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.savings import SavingsResponse, SavingsUpdate
from ..services import (
    detect_savings_opportunities,
    get_savings_opportunities,
    update_savings_status,
)

router = APIRouter(prefix="/savings", tags=["Savings Opportunities"])


@router.get("", response_model=list[SavingsResponse])
def list_savings_endpoint(
    status: Optional[str] = Query(None, description="Filter by status (identified, in_progress, realized, dismissed)"),
    type: Optional[str] = Query(None, description="Filter by opportunity_type"),
    db: Session = Depends(get_db),
):
    return get_savings_opportunities(db, status=status, opportunity_type=type)


@router.post("/detect", response_model=list[SavingsResponse])
def run_savings_detection_endpoint(db: Session = Depends(get_db)):
    """Run deterministic savings rules against current subscriptions."""
    new_opps = detect_savings_opportunities(db)
    return get_savings_opportunities(db)


@router.put("/{opportunity_id}", response_model=SavingsResponse)
def update_savings_status_endpoint(
    opportunity_id: UUID,
    payload: SavingsUpdate,
    db: Session = Depends(get_db),
):
    opp = update_savings_status(
        db,
        opportunity_id=opportunity_id,
        new_status=payload.status,
        performed_by="web_ui",
    )
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    all_opps = get_savings_opportunities(db)
    matched = [o for o in all_opps if o["id"] == opportunity_id]
    return matched[0] if matched else opp
