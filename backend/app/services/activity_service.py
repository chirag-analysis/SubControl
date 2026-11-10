"""Activity logging service — records immutable audit trail entries."""

import uuid
from typing import Any, Optional

from sqlalchemy.orm import Session

from ..models.activity import ActivityLog


def log_activity(
    db: Session,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    performed_by: str = "web_ui",
    changes: Optional[dict[str, Any]] = None,
) -> ActivityLog:
    """Record a mutation event to the activity log."""
    entry = ActivityLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changes=changes,
        performed_by=performed_by,
    )
    db.add(entry)
    db.flush()
    return entry


def get_activity_log(
    db: Session,
    entity_type: Optional[str] = None,
    entity_id: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0,
) -> list[ActivityLog]:
    """Retrieve activity log entries with optional filtering."""
    query = db.query(ActivityLog).order_by(ActivityLog.performed_at.desc())
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(ActivityLog.entity_id == entity_id)
    return query.offset(offset).limit(limit).all()
