"""Pydantic schemas for ActivityLog operations."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    changes: Optional[dict[str, Any]] = None
    performed_by: str
    performed_at: datetime

    model_config = {"from_attributes": True}

