from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subscription import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_notifications(self, user: User, unread_only: bool = False) -> list[NotificationResponse]:
        query = select(Notification).where(Notification.user_id == user.id)
        if unread_only:
            query = query.where(Notification.read_at.is_(None))
        query = query.order_by(Notification.created_at.desc())
        result = await self.db.execute(query)
        return [NotificationResponse.model_validate(n) for n in result.scalars().all()]

    async def mark_read(self, user: User, notification_id: UUID) -> NotificationResponse:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user.id,
            )
        )
        notification = result.scalar_one_or_none()
        if notification is None:
            raise ValueError("Notification introuvable")

        notification.read_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(notification)
        return NotificationResponse.model_validate(notification)

    async def mark_all_read(self, user: User) -> int:
        result = await self.db.execute(
            select(Notification).where(
                Notification.user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
        notifications = result.scalars().all()
        now = datetime.now(UTC)
        for n in notifications:
            n.read_at = now
        await self.db.commit()
        return len(notifications)

    async def unread_count(self, user: User) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
        return result.scalar_one()
