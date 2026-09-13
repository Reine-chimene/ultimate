from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OnlineStatus
from app.models.user import User

ONLINE_THRESHOLD = timedelta(minutes=5)
RECENTLY_ACTIVE_THRESHOLD = timedelta(hours=24)


class PresenceService:
    @staticmethod
    def online_status(last_seen_at: datetime | None) -> OnlineStatus:
        if last_seen_at is None:
            return OnlineStatus.OFFLINE
        now = datetime.now(UTC)
        if last_seen_at.tzinfo is None:
            last_seen_at = last_seen_at.replace(tzinfo=UTC)
        delta = now - last_seen_at
        if delta <= ONLINE_THRESHOLD:
            return OnlineStatus.ONLINE
        if delta <= RECENTLY_ACTIVE_THRESHOLD:
            return OnlineStatus.RECENTLY_ACTIVE
        return OnlineStatus.OFFLINE

    @staticmethod
    async def touch(user: User, db: AsyncSession) -> None:
        user.last_seen_at = datetime.now(UTC)
        await db.commit()
