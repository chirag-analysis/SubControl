"""Activity log router."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.activity import ActivityResponse
from ..services.activity_service import get_activity_log

router = APIRouter(prefix="/activity", tags=["Activity Log"])


@router.get("", response_model=list[ActivityResponse])
def list_activity_endpoint(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return get_activity_log(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
        offset=offset,
    )
