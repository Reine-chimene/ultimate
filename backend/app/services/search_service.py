from datetime import UTC, date, datetime, timedelta

from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import DiscoveryMode, RelationshipIntention
from app.models.meeting import Availability
from app.models.profile import Interest, Photo, Profile
from app.models.social import Block, Like
from app.models.travel import TravelPlan
from app.models.user import User
from app.schemas.search import SearchFilters, SearchResponse
from app.services.compatibility import calculate_age, is_compatible
from app.services.pass_service import PassService
from app.services.premium_service import PremiumService
from app.models.privacy import UserPrivacySettings
from app.services.privacy_service import PrivacyService
from app.services.profile_service import ProfileService


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)
        self.premium = PremiumService(db)
        self.passes = PassService(db)

    async def _excluded_ids(self, user_id) -> set:
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
        passed = await self.passes.get_passed_ids(user_id)
        excluded = {user_id}
        excluded.update(liked.scalars().all())
        excluded.update(blocked.scalars().all())
        excluded.update(blocked_by.scalars().all())
        excluded.update(passed)
        return excluded

    async def _get_active_travel(self, user_id):
        today = date.today()
        result = await self.db.execute(
            select(TravelPlan).where(
                TravelPlan.user_id == user_id,
                TravelPlan.is_active.is_(True),
                TravelPlan.departure_date >= today,
            ).order_by(TravelPlan.arrival_date.asc())
        )
        return result.scalars().first()

    async def search(self, current_user: User, filters: SearchFilters) -> SearchResponse:
        my_profile = await self.profile_service._get_profile_by_user_id(current_user.id)
        if my_profile is None:
            raise ValueError("Profil introuvable")

        advanced = (
            filters.has_photo
            or filters.online_only
            or filters.interest_category
            or filters.max_distance_km is not None
        )
        if advanced and not await self.premium.can_use_advanced_search(current_user):
            raise ValueError("La recherche avancée est réservée aux membres Premium.")

        if filters.mode == DiscoveryMode.TRAVEL:
            await self.premium.require_premium(current_user, "mode voyage")

        excluded_ids = await self._excluded_ids(current_user.id)
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
        elif filters.mode == DiscoveryMode.WORLDWIDE:
            pass
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

        if filters.has_photo:
            query = query.where(
                exists().where(Photo.profile_id == Profile.id)
            )

        if filters.interest_category:
            query = query.where(
                exists().where(
                    Interest.profile_id == Profile.id,
                    Interest.category == filters.interest_category,
                )
            )

        if filters.online_only:
            online_threshold, recent_threshold = PrivacyService.online_only_thresholds()
            query = query.outerjoin(
                UserPrivacySettings, UserPrivacySettings.user_id == User.id
            )
            query = query.where(
                User.last_seen_at.isnot(None),
                or_(
                    UserPrivacySettings.id.is_(None),
                    UserPrivacySettings.show_online.is_(True),
                ),
                or_(
                    User.last_seen_at >= online_threshold,
                    and_(
                        or_(
                            UserPrivacySettings.id.is_(None),
                            UserPrivacySettings.show_last_seen.is_(True),
                        ),
                        User.last_seen_at >= recent_threshold,
                    ),
                ),
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        offset = (filters.page - 1) * filters.page_size
        query = query.offset(offset).limit(filters.page_size * 2)
        result = await self.db.execute(query)
        rows = result.all()

        tonight = date.today()
        availability_result = await self.db.execute(
            select(Availability).where(
                Availability.available_date == tonight,
                Availability.is_available.is_(True),
            )
        )
        availability_map = {a.user_id: a for a in availability_result.scalars().all()}

        max_distance = filters.max_distance_km or my_profile.max_distance_km
        privacy_map = await self.profile_service.privacy.load_map([user.id for user, _ in rows])
        profiles = []
        for user, profile in rows:
            if not is_compatible(current_user, my_profile, user, profile):
                continue
            avail = availability_map.get(user.id)
            pub = await self.profile_service.to_public_profile(
                user,
                profile,
                current_user,
                my_profile,
                is_available_tonight=avail is not None,
                availability_note=avail.note if avail else None,
                privacy_map=privacy_map,
            )
            if max_distance and pub.distance_km is not None and pub.distance_km > max_distance:
                continue
            profiles.append(pub)
            if len(profiles) >= filters.page_size:
                break

        return SearchResponse(
            profiles=profiles,
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            has_more=(offset + len(profiles)) < total,
        )
