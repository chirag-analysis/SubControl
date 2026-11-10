"""Subscription model — core entity representing a SaaS subscription."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .category import Category
    from .payment import PaymentHistory
    from .review import RenewalReview
    from .savings import SavingsOpportunity


class Subscription(Base):
    __tablename__ = "subscriptions"
    __table_args__ = (
        CheckConstraint(
            "billing_cycle IN ('monthly', 'quarterly', 'annual')",
            name="ck_billing_cycle",
        ),
        CheckConstraint(
            "status IN ('active', 'paused', 'cancelled', 'trial', 'pending_review')",
            name="ck_status",
        ),
        CheckConstraint("cost_per_cycle > 0", name="ck_cost_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    vendor: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True, index=True
    )
    cost_per_cycle: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    billing_cycle: Mapped[str] = mapped_column(String(20), nullable=False)
    currency: Mapped[str] = mapped_column(
        String(3), nullable=False, server_default="USD"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="active", index=True
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    next_renewal_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True, index=True
    )
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    owner: Mapped[str] = mapped_column(String(150), nullable=False)
    license_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    used_licenses: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    category: Mapped[Optional["Category"]] = relationship(
        back_populates="subscriptions"
    )
    payments: Mapped[List["PaymentHistory"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan",
        order_by="desc(PaymentHistory.payment_date)",
    )
    reviews: Mapped[List["RenewalReview"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan",
        order_by="desc(RenewalReview.created_at)",
    )
    savings: Mapped[List["SavingsOpportunity"]] = relationship(
        back_populates="subscription", cascade="all, delete-orphan",
        order_by="desc(SavingsOpportunity.detected_at)",
    )

