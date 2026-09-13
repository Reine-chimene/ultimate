from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OnlineStatus
from app.models.privacy import UserPrivacySettings
from app.models.user import User
from app.schemas.privacy import PrivacySettingsResponse, PrivacySettingsUpdate
from app.services.presence_service import PresenceService
from app.services.premium_service import PremiumService


@dataclass(frozen=True)
class PrivacyPrefs:
    show_online: bool = True
    show_last_seen: bool = True
    incognito_enabled: bool = False

    @classmethod
    def from_model(cls, row: UserPrivacySettings | None) -> "PrivacyPrefs":
        if row is None:
            return cls()
        return cls(
            show_online=row.show_online,
            show_last_seen=row.show_last_seen,
            incognito_enabled=row.incognito_enabled,
        )


class PrivacyService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.premium = PremiumService(db)

    async def get_for_user(self, user_id: UUID) -> PrivacyPrefs:
        result = await self.db.execute(
            select(UserPrivacySettings).where(UserPrivacySettings.user_id == user_id)
        )
        return PrivacyPrefs.from_model(result.scalar_one_or_none())

    async def load_map(self, user_ids: list[UUID]) -> dict[UUID, PrivacyPrefs]:
        if not user_ids:
            return {}
        result = await self.db.execute(
            select(UserPrivacySettings).where(UserPrivacySettings.user_id.in_(user_ids))
        )
        rows = {row.user_id: PrivacyPrefs.from_model(row) for row in result.scalars().all()}
        return {uid: rows.get(uid, PrivacyPrefs()) for uid in user_ids}

    async def get_settings_response(self, user: User) -> PrivacySettingsResponse:
        prefs = await self.get_for_user(user.id)
        can_use_incognito = await self.premium.is_premium(user)
        return PrivacySettingsResponse(
            show_online=prefs.show_online,
            show_last_seen=prefs.show_last_seen,
            incognito_enabled=prefs.incognito_enabled if can_use_incognito else False,
            can_use_incognito=can_use_incognito,
        )

    async def update_settings(
        self, user: User, data: PrivacySettingsUpdate
    ) -> PrivacySettingsResponse:
        if not data.has_updates():
            return await self.get_settings_response(user)

        result = await self.db.execute(
            select(UserPrivacySettings).where(UserPrivacySettings.user_id == user.id)
        )
        row = result.scalar_one_or_none()
        if row is None:
            row = UserPrivacySettings(user_id=user.id)
            self.db.add(row)

        if data.show_online is not None:
            row.show_online = data.show_online
        if data.show_last_seen is not None:
            row.show_last_seen = data.show_last_seen
        if data.incognito_enabled is not None:
            if data.incognito_enabled:
                await self.premium.require_premium(user, "Mode Incognito")
            row.incognito_enabled = data.incognito_enabled

        await self.db.commit()
        await self.db.refresh(row)
        return await self.get_settings_response(user)

    @staticmethod
    def public_online_status(
        last_seen_at: datetime | None,
        prefs: PrivacyPrefs,
    ) -> OnlineStatus:
        raw = PresenceService.online_status(last_seen_at)
        if not prefs.show_online:
            return OnlineStatus.OFFLINE
        if not prefs.show_last_seen and raw == OnlineStatus.RECENTLY_ACTIVE:
            return OnlineStatus.OFFLINE
        return raw

    @staticmethod
    def online_only_thresholds() -> tuple[datetime, datetime]:
        now = datetime.now(UTC)
        return now - timedelta(minutes=5), now - timedelta(hours=24)

    @classmethod
    def user_visible_for_online_filter(
        cls,
        last_seen_at: datetime | None,
        prefs: PrivacyPrefs,
    ) -> bool:
        if not prefs.show_online or last_seen_at is None:
            return False
        if last_seen_at.tzinfo is None:
            last_seen_at = last_seen_at.replace(tzinfo=UTC)
        online_threshold, recent_threshold = cls.online_only_thresholds()
        if last_seen_at >= online_threshold:
            return True
        if prefs.show_last_seen and last_seen_at >= recent_threshold:
            return True
        return False
