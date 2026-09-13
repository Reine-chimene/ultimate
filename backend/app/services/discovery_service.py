from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import DiscoveryMode, RelationshipIntention
from app.models.meeting import Availability
from app.models.profile import Profile
from app.models.social import Block, Like
from app.models.travel import TravelPlan
from app.models.user import User
from app.schemas.discovery import DiscoveryFilters, DiscoveryResponse
from app.schemas.profile import PublicProfileResponse
from app.services.compatibility import calculate_age, is_compatible
from app.services.pass_service import PassService
from app.services.premium_service import PremiumService
from app.services.profile_service import ProfileService


class DiscoveryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)

    async def _get_excluded_user_ids(self, user_id: UUID) -> set[UUID]:
        from app.models.enums import ConnectionRequestStatus

        liked = await self.db.execute(
            select(Like.receiver_id).where(
                Like.sender_id == user_id,
                Like.is_like.is_(True),
                or_(
                    Like.request_status.is_(None),
                    Like.request_status.in_([
                        ConnectionRequestStatus.PENDING,
                        ConnectionRequestStatus.ACCEPTED,
                    ]),
                ),
            )
        )
        blocked = await self.db.execute(
            select(Block.blocked_id).where(Block.blocker_id == user_id)
        )
        blocked_by = await self.db.execute(
            select(Block.blocker_id).where(Block.blocked_id == user_id)
        )
        passed = await PassService(self.db).get_passed_ids(user_id)
        excluded = {user_id}
        excluded.update(liked.scalars().all())
        excluded.update(blocked.scalars().all())
        excluded.update(blocked_by.scalars().all())
        excluded.update(passed)
        return excluded

    async def _get_active_travel(self, user_id: UUID) -> TravelPlan | None:
        today = date.today()
        result = await self.db.execute(
            select(TravelPlan).where(
                TravelPlan.user_id == user_id,
                TravelPlan.is_active.is_(True),
                TravelPlan.departure_date >= today,
            ).order_by(TravelPlan.arrival_date.asc())
        )
        return result.scalars().first()

    async def discover(
        self, current_user: User, filters: DiscoveryFilters
    ) -> DiscoveryResponse:
        my_profile = await self.profile_service._get_profile_by_user_id(current_user.id)
        if my_profile is None:
            raise ValueError("Profil introuvable")

        premium = PremiumService(self.db)
        if filters.mode == DiscoveryMode.INTERNATIONAL:
            await premium.require_premium(current_user, "découverte internationale")
        elif filters.mode == DiscoveryMode.TRAVEL:
            await premium.require_premium(current_user, "mode voyage")

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

        if filters.country:
            query = query.where(func.upper(User.country) == filters.country.upper())
        elif filters.mode == DiscoveryMode.NEAR_ME:
            query = query.where(func.upper(User.country) == current_user.country.upper())
        elif filters.mode == DiscoveryMode.INTERNATIONAL:
            query = query.where(func.upper(User.country) != current_user.country.upper())
        elif filters.mode == DiscoveryMode.TRAVEL:
            travel = await self._get_active_travel(current_user.id)
            if travel:
                query = query.where(
                    func.upper(User.country) == travel.country.upper(),
                    func.lower(User.city) == travel.city.lower(),
                )
            else:
                query = query.where(
                    Profile.relationship_intention.in_([
                        RelationshipIntention.TRAVEL,
                        RelationshipIntention.FRIENDSHIP,
                        RelationshipIntention.UNSURE,
                    ])
                )

        if filters.city:
            query = query.where(func.lower(User.city) == filters.city.lower())

        if filters.gender:
            query = query.where(User.gender == filters.gender)

        if filters.intention:
            query = query.where(Profile.relationship_intention == filters.intention)

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

        query = query.limit(filters.limit * 2)
        result = await self.db.execute(query)
        rows = result.all()

        tonight = date.today()
        availability_result = await self.db.execute(
            select(Availability).where(
                Availability.available_date == tonight,
                Availability.is_available.is_(True),
            )
        )
        availability_map = {a.user_id: a.note for a in availability_result.scalars().all()}
        available_tonight_ids = set(availability_map.keys())

        max_distance = filters.max_distance_km or my_profile.max_distance_km

        privacy_map = await self.profile_service.privacy.load_map([user.id for user, _ in rows])

        profiles: list[PublicProfileResponse] = []
        for user, profile in rows:
            if not is_compatible(current_user, my_profile, user, profile):
                continue

            pub = await self.profile_service.to_public_profile(
                user,
                profile,
                current_user,
                my_profile,
                is_available_tonight=user.id in available_tonight_ids,
                availability_note=availability_map.get(user.id),
                privacy_map=privacy_map,
            )

            if max_distance and pub.distance_km is not None:
                if pub.distance_km > max_distance:
                    continue

            profiles.append(pub)

        profiles.sort(
            key=lambda p: (
                p.profile_completion_percent or 0,
                len(p.compatibility_indicators or []),
                p.compatibility_score or 0,
            ),
            reverse=True,
        )
        profiles = profiles[: filters.limit]
        return DiscoveryResponse(profiles=profiles, total=len(profiles))
