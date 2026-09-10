from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.meeting import Availability
from app.models.profile import Profile
from app.models.social import Block, Like
from app.models.user import User
from app.schemas.discovery import DiscoveryFilters, DiscoveryResponse
from app.schemas.profile import PublicProfileResponse
from app.services.compatibility import calculate_age, calculate_compatibility
from app.services.profile_service import ProfileService


class DiscoveryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)

    async def _get_excluded_user_ids(self, user_id: UUID) -> set[UUID]:
        liked = await self.db.execute(
            select(Like.receiver_id).where(Like.sender_id == user_id)
        )
        blocked = await self.db.execute(
            select(Block.blocked_id).where(Block.blocker_id == user_id)
        )
        blocked_by = await self.db.execute(
            select(Block.blocker_id).where(Block.blocked_id == user_id)
        )
        excluded = {user_id}
        excluded.update(liked.scalars().all())
        excluded.update(blocked.scalars().all())
        excluded.update(blocked_by.scalars().all())
        return excluded

    async def discover(
        self, current_user: User, filters: DiscoveryFilters
    ) -> DiscoveryResponse:
        my_profile = await self.profile_service._get_profile_by_user_id(current_user.id)
        if my_profile is None:
            raise ValueError("Profil introuvable")

        excluded_ids = await self._get_excluded_user_ids(current_user.id)
        my_age = calculate_age(current_user.date_of_birth)

        query = (
            select(User, Profile)
            .join(Profile, Profile.user_id == User.id)
            .where(User.is_active.is_(True))
            .where(User.id.notin_(excluded_ids))
            .where(Profile.looking_for_genders.any(current_user.gender))
            .where(Profile.min_age <= my_age)
            .where(Profile.max_age >= my_age)
            .options(selectinload(Profile.photos), selectinload(Profile.interests))
        )

        if filters.city:
            query = query.where(func.lower(User.city) == filters.city.lower())

        if filters.min_age:
            max_dob = date.today().replace(year=date.today().year - filters.min_age)
            query = query.where(User.date_of_birth <= max_dob)
        if filters.max_age:
            min_dob = date.today().replace(year=date.today().year - filters.max_age - 1)
            query = query.where(User.date_of_birth >= min_dob)

        if filters.available_tonight:
            tonight = date.today()
            available_users = select(Availability.user_id).where(
                Availability.available_date == tonight,
                Availability.is_available.is_(True),
            )
            query = query.where(User.id.in_(available_users))

        query = query.limit(filters.limit)
        result = await self.db.execute(query)
        rows = result.all()

        tonight = date.today()
        availability_result = await self.db.execute(
            select(Availability.user_id).where(
                Availability.available_date == tonight,
                Availability.is_available.is_(True),
            )
        )
        available_tonight_ids = set(availability_result.scalars().all())

        profiles: list[PublicProfileResponse] = []
        for user, profile in rows:
            if current_user.gender not in profile.looking_for_genders:
                continue
            if not (my_profile.min_age <= calculate_age(user.date_of_birth) <= my_profile.max_age):
                continue

            score = calculate_compatibility(current_user, my_profile, user, profile)
            profiles.append(
                await self.profile_service.to_public_profile(
                    user,
                    profile,
                    current_user,
                    my_profile,
                    compatibility_score=score,
                    is_available_tonight=user.id in available_tonight_ids,
                )
            )

        profiles.sort(key=lambda p: p.compatibility_score or 0, reverse=True)
        return DiscoveryResponse(profiles=profiles, total=len(profiles))
