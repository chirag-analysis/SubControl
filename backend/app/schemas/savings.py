"""Pydantic schemas for SavingsOpportunity operations."""

from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


class SavingsUpdate(BaseModel):
    status: Literal["identified", "in_progress", "realized", "dismissed"]


class SavingsResponse(BaseModel):
    id: UUID
    subscription_id: UUID
    opportunity_type: str
    description: str
    estimated_savings: Decimal
    currency: str
    status: str
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    subscription_name: Optional[str] = None

    model_config = {"from_attributes": True}

