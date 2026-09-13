from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SubscriptionPlan, SubscriptionStatus
from app.models.subscription import Subscription
from app.models.user import User

FREE_DAILY_LIKE_LIMIT = 5
PREMIUM_DAILY_LIKE_LIMIT = 25


class PremiumService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def is_premium(self, user: User) -> bool:
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user.id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.plan.in_([SubscriptionPlan.PREMIUM, SubscriptionPlan.VIP]),
            )
        )
        sub = result.scalars().first()
        if sub is None:
            return False
        if sub.expires_at and sub.expires_at < datetime.now(UTC):
            return False
        return True

    async def daily_like_limit(self, user: User) -> int:
        return PREMIUM_DAILY_LIKE_LIMIT if await self.is_premium(user) else FREE_DAILY_LIKE_LIMIT

    async def require_premium(self, user: User, feature: str) -> None:
        if not await self.is_premium(user):
            raise ValueError(f"Cette fonctionnalité ({feature}) est réservée aux membres Premium.")

    async def can_use_advanced_search(self, user: User) -> bool:
        return await self.is_premium(user)

    async def can_use_worldwide_discovery(self, user: User) -> bool:
        return True

    async def can_use_international_discovery(self, user: User) -> bool:
        return await self.can_use_worldwide_discovery(user)

    async def can_use_travel_discovery(self, user: User) -> bool:
        return await self.is_premium(user)

    async def can_use_advanced_tonight_filters(self, user: User) -> bool:
        return await self.is_premium(user)

    async def can_upload_private_videos(self, user: User) -> bool:
        return await self.is_premium(user)
