from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import PaymentStatus, SubscriptionPlan, SubscriptionStatus
from app.schemas.common import ORMModel, TimestampSchema


class SubscriptionCreate(BaseModel):
    plan: SubscriptionPlan = SubscriptionPlan.PREMIUM
    duration_months: int = 1


class PaymentResponse(ORMModel, TimestampSchema):
    id: UUID
    amount: Decimal
    currency: str
    status: PaymentStatus
    paid_at: datetime | None


class SubscriptionResponse(ORMModel, TimestampSchema):
    id: UUID
    user_id: UUID
    plan: SubscriptionPlan
    status: SubscriptionStatus
    started_at: datetime
    expires_at: datetime | None
    payments: list[PaymentResponse] = []
