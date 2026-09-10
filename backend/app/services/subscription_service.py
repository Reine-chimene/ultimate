from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import PaymentStatus, SubscriptionPlan, SubscriptionStatus
from app.models.subscription import Payment, Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse

DURATION_PRICES_CAD = {
    1: Decimal("19.99"),
    3: Decimal("44.99"),
    6: Decimal("69.99"),
}


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_current(self, user: User) -> SubscriptionResponse | None:
        result = await self.db.execute(
            select(Subscription)
            .where(Subscription.user_id == user.id, Subscription.status == SubscriptionStatus.ACTIVE)
            .options(selectinload(Subscription.payments))
            .order_by(Subscription.created_at.desc())
        )
        subscription = result.scalars().first()
        if subscription is None:
            return None
        return SubscriptionResponse.model_validate(subscription)

    async def subscribe(self, user: User, data: SubscriptionCreate) -> SubscriptionResponse:
        if data.plan == SubscriptionPlan.FREE:
            raise ValueError("Le plan gratuit est déjà inclus")
        if data.duration_months not in DURATION_PRICES_CAD:
            raise ValueError("Durée d'abonnement invalide")

        now = datetime.now(UTC)
        expires_at = now + timedelta(days=data.duration_months * 30)

        active = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user.id,
                Subscription.status == SubscriptionStatus.ACTIVE,
            )
        )
        for sub in active.scalars().all():
            sub.status = SubscriptionStatus.CANCELLED

        subscription = Subscription(
            user_id=user.id,
            plan=data.plan,
            status=SubscriptionStatus.ACTIVE,
            started_at=now,
            expires_at=expires_at,
        )
        self.db.add(subscription)
        await self.db.flush()

        payment = Payment(
            subscription_id=subscription.id,
            amount=DURATION_PRICES_CAD[data.duration_months],
            currency="CAD",
            status=PaymentStatus.SIMULATED,
            paid_at=now,
        )
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(subscription)

        result = await self.db.execute(
            select(Subscription)
            .where(Subscription.id == subscription.id)
            .options(selectinload(Subscription.payments))
        )
        return SubscriptionResponse.model_validate(result.scalar_one())

    async def cancel(self, user: User) -> SubscriptionResponse:
        result = await self.db.execute(
            select(Subscription)
            .where(
                Subscription.user_id == user.id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.plan != SubscriptionPlan.FREE,
            )
            .options(selectinload(Subscription.payments))
        )
        subscription = result.scalars().first()
        if subscription is None:
            raise ValueError("Aucun abonnement actif à annuler")

        subscription.status = SubscriptionStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(subscription)
        return SubscriptionResponse.model_validate(subscription)
