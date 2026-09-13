from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.profile import Profile
from app.models.social import Block, ProfileView
from app.models.user import User
from app.schemas.profile_view import ProfileVisitorItem, ProfileVisitorsResponse
from app.services.premium_service import PremiumService
from app.services.privacy_service import PrivacyService
from app.services.notification_service import NotificationService
from app.services.profile_service import ProfileService

DEDUP_WINDOW = timedelta(hours=24)
VISITOR_RETENTION = timedelta(days=30)


class ProfileViewService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.premium = PremiumService(db)
        self.privacy = PrivacyService(db)
        self.profile_service = ProfileService(db)

    async def _is_blocked(self, user_a_id: UUID, user_b_id: UUID) -> bool:
        result = await self.db.execute(
            select(Block).where(
                or_(
                    and_(Block.blocker_id == user_a_id, Block.blocked_id == user_b_id),
                    and_(Block.blocker_id == user_b_id, Block.blocked_id == user_a_id),
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def record_view(self, viewer: User, viewed_user: User) -> bool:
        if viewer.id == viewed_user.id:
            return False
        if await self._is_blocked(viewer.id, viewed_user.id):
            return False

        viewer_prefs = await self.privacy.get_for_user(viewer.id)
        if viewer_prefs.incognito_enabled and await self.premium.is_premium(viewer):
            return False

        since = datetime.now(UTC) - DEDUP_WINDOW
        existing = await self.db.execute(
            select(ProfileView.id).where(
                ProfileView.viewer_id == viewer.id,
                ProfileView.viewed_user_id == viewed_user.id,
                ProfileView.created_at >= since,
            )
        )
        if existing.scalar_one_or_none() is not None:
            return False

        self.db.add(
            ProfileView(
                viewer_id=viewer.id,
                viewed_user_id=viewed_user.id,
            )
        )
        profile_result = await self.db.execute(
            select(Profile.id).where(Profile.user_id == viewer.id)
        )
        viewer_profile_id = profile_result.scalar_one_or_none()
        if viewer_profile_id:
            await NotificationService(self.db).notify_profile_view(
                viewed_user, viewer, viewer_profile_id
            )
        await self.db.commit()
        return True

    def _recent_views_query(self, user_id: UUID):
        since = datetime.now(UTC) - VISITOR_RETENTION
        return (
            select(ProfileView)
            .where(
                ProfileView.viewed_user_id == user_id,
                ProfileView.created_at >= since,
            )
            .order_by(ProfileView.created_at.desc())
        )

    async def _count_visitors(self, user_id: UUID) -> int:
        since = datetime.now(UTC) - VISITOR_RETENTION
        result = await self.db.execute(
            select(func.count(func.distinct(ProfileView.viewer_id))).where(
                ProfileView.viewed_user_id == user_id,
                ProfileView.created_at >= since,
            )
        )
        return int(result.scalar_one() or 0)

    async def list_visitors(
        self, user: User, page: int = 1, limit: int = 20
    ) -> ProfileVisitorsResponse:
        page = max(page, 1)
        limit = min(max(limit, 1), 50)
        total_count = await self._count_visitors(user.id)
        is_premium = await self.premium.is_premium(user)

        if not is_premium:
            teaser = None
            if total_count > 0:
                label = "personne a" if total_count == 1 else "personnes ont"
                teaser = (
                    f"{total_count} {label} visité votre profil récemment. "
                    "Passez à Premium pour voir qui."
                )
            return ProfileVisitorsResponse(
                is_premium=False,
                total_count=total_count,
                page=page,
                limit=limit,
                visitors=[],
                teaser=teaser,
            )

        offset = (page - 1) * limit
        result = await self.db.execute(
            self._recent_views_query(user.id).offset(offset).limit(limit)
        )
        views = result.scalars().all()

        viewer_ids = [view.viewer_id for view in views]
        blocked_ids: set[UUID] = set()
        for viewer_id in viewer_ids:
            if await self._is_blocked(user.id, viewer_id):
                blocked_ids.add(viewer_id)

        my_profile = await self.profile_service._get_profile_by_user_id(user.id)
        privacy_map = await self.privacy.load_map(viewer_ids)
        items: list[ProfileVisitorItem] = []

        for view in views:
            if view.viewer_id in blocked_ids:
                continue
            row = await self.db.execute(
                select(User, Profile)
                .join(Profile, Profile.user_id == User.id)
                .where(User.id == view.viewer_id)
                .options(selectinload(Profile.photos), selectinload(Profile.interests))
            )
            pair = row.first()
            if not pair:
                continue
            viewer_user, viewer_profile = pair
            pub = await self.profile_service.to_public_profile(
                viewer_user,
                viewer_profile,
                user,
                my_profile,
                privacy_map=privacy_map,
            )
            items.append(
                ProfileVisitorItem(
                    user_id=viewer_user.id,
                    visited_at=view.created_at,
                    profile=pub,
                )
            )

        return ProfileVisitorsResponse(
            is_premium=True,
            total_count=total_count,
            page=page,
            limit=limit,
            visitors=items,
        )
