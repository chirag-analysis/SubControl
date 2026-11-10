"""SavingsOpportunity model — deterministically detected cost-saving opportunities."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .subscription import Subscription


class SavingsOpportunity(Base):
    __tablename__ = "savings_opportunities"
    __table_args__ = (
        CheckConstraint(
            "opportunity_type IN ('unused_licenses', 'duplicate_tool', "
            "'downgrade_possible', 'annual_switch', 'negotiation')",
            name="ck_opportunity_type",
        ),
        CheckConstraint(
            "status IN ('identified', 'in_progress', 'realized', 'dismissed')",
            name="ck_savings_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subscriptions.id"),
        nullable=False,
        index=True,
    )
    opportunity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_savings: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, server_default="USD"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="identified", index=True
    )
    detected_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    subscription: Mapped["Subscription"] = relationship(back_populates="savings")

