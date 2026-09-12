from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.countries import get_country
from app.geo import haversine_km
from app.models.profile import Interest, Photo, Profile
from app.models.user import User
from app.models.social import Match
from app.schemas.profile import (
    InterestCreate,
    InterestResponse,
    PhotoCreate,
    PhotoResponse,
    PreferencesResponse,
    PreferencesUpdate,
    ProfileResponse,
    ProfileUpdate,
    PublicProfileResponse,
)
from app.models.enums import ConnectionRequestStatus, ConnectionState
from app.models.social import Like
from app.services.compatibility import (
    calculate_age,
    calculate_compatibility,
    get_compatibility_indicators,
    is_compatible,
)
from app.services.profile_completion import compute_profile_completion
from app.timezone_utils import format_availability_until


class ProfileService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_profile_by_user_id(self, user_id: UUID) -> Profile | None:
        result = await self.db.execute(
            select(Profile)
            .where(Profile.user_id == user_id)
            .options(selectinload(Profile.photos), selectinload(Profile.interests))
        )
        return result.scalar_one_or_none()

    def _profile_response(self, user: User, profile: Profile) -> ProfileResponse:
        country = get_country(user.country)
        return ProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            bio=profile.bio,
            relationship_intention=profile.relationship_intention,
            looking_for_genders=profile.looking_for_genders,
            preferred_intentions=profile.preferred_intentions or [],
            preferred_countries=profile.preferred_countries or [],
            min_age=profile.min_age,
            max_age=profile.max_age,
            max_distance_km=profile.max_distance_km,
            occupation=profile.occupation,
            city=user.city,
            country=user.country,
            country_name=country.name_fr,
            timezone=user.timezone,
            photos=[PhotoResponse.model_validate(p) for p in profile.photos],
            interests=[InterestResponse.model_validate(i) for i in profile.interests],
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )

    async def get_my_profile(self, user: User) -> ProfileResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")
        return self._profile_response(user, profile)

    async def update_profile(self, user: User, data: ProfileUpdate) -> ProfileResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        update_data = data.model_dump(exclude_unset=True)
        user_fields = {"city", "country", "timezone"}
        for key in list(update_data.keys()):
            if key in user_fields:
                setattr(user, key, update_data.pop(key))
                if key == "country" and "timezone" not in update_data and "timezone" not in data.model_fields_set:
                    from app.countries import default_timezone_for_country

                    user.timezone = default_timezone_for_country(user.country)

        for key, value in update_data.items():
            setattr(profile, key, value)
        await self.db.commit()
        await self.db.refresh(profile)
        await self.db.refresh(user)
        return self._profile_response(user, profile)

    async def get_preferences(self, user: User) -> PreferencesResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")
        return PreferencesResponse(
            looking_for_genders=profile.looking_for_genders,
            preferred_intentions=profile.preferred_intentions or [],
            preferred_countries=profile.preferred_countries or [],
            min_age=profile.min_age,
            max_age=profile.max_age,
            max_distance_km=profile.max_distance_km,
        )

    async def update_preferences(self, user: User, data: PreferencesUpdate) -> PreferencesResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        update_data = data.model_dump(exclude_unset=True)
        if "min_age" in update_data and "max_age" in update_data:
            if update_data["min_age"] > update_data["max_age"]:
                raise ValueError("L'âge minimum ne peut pas dépasser l'âge maximum")
        elif "min_age" in update_data and update_data["min_age"] > profile.max_age:
            raise ValueError("L'âge minimum ne peut pas dépasser l'âge maximum")
        elif "max_age" in update_data and update_data["max_age"] < profile.min_age:
            raise ValueError("L'âge minimum ne peut pas dépasser l'âge maximum")

        for key, value in update_data.items():
            setattr(profile, key, value)
        await self.db.commit()
        await self.db.refresh(profile)
        return await self.get_preferences(user)

    async def _connection_state(self, current_user_id: UUID, other_user_id: UUID) -> ConnectionState:
        if await self._are_connected(current_user_id, other_user_id):
            return ConnectionState.CONNECTED

        sent = await self.db.execute(
            select(Like).where(
                Like.sender_id == current_user_id,
                Like.receiver_id == other_user_id,
            )
        )
        sent_like = sent.scalar_one_or_none()

        received = await self.db.execute(
            select(Like).where(
                Like.sender_id == other_user_id,
                Like.receiver_id == current_user_id,
            )
        )
        received_like = received.scalar_one_or_none()

        if (
            received_like
            and received_like.is_like
            and received_like.request_status == ConnectionRequestStatus.PENDING
        ):
            return ConnectionState.PENDING_RECEIVED

        if sent_like:
            if sent_like.request_status == ConnectionRequestStatus.DECLINED or not sent_like.is_like:
                return ConnectionState.DECLINED
            if sent_like.request_status == ConnectionRequestStatus.PENDING:
                return ConnectionState.PENDING_SENT

        return ConnectionState.NONE

    async def _are_connected(self, user_id_a, user_id_b) -> bool:
        from sqlalchemy import or_, and_

        result = await self.db.execute(
            select(Match).where(
                or_(
                    and_(Match.user1_id == user_id_a, Match.user2_id == user_id_b),
                    and_(Match.user1_id == user_id_b, Match.user2_id == user_id_a),
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def add_photo(self, user: User, data: PhotoCreate) -> PhotoResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        if data.is_primary:
            for photo in profile.photos:
                photo.is_primary = False

        sort_order = data.sort_order if data.sort_order else len(profile.photos)
        photo = Photo(
            profile_id=profile.id,
            url=data.url,
            is_primary=data.is_primary or len(profile.photos) == 0,
            sort_order=sort_order,
        )
        self.db.add(photo)
        await self.db.commit()
        await self.db.refresh(photo)
        return PhotoResponse.model_validate(photo)

    async def delete_photo(self, user: User, photo_id: UUID) -> None:
        from app.services.storage_service import StorageService

        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        result = await self.db.execute(
            select(Photo).where(Photo.id == photo_id, Photo.profile_id == profile.id)
        )
        photo = result.scalar_one_or_none()
        if photo is None:
            raise ValueError("Photo introuvable")

        was_primary = photo.is_primary
        photo_url = photo.url
        await self.db.delete(photo)
        await self.db.flush()

        if was_primary:
            remaining = await self.db.execute(
                select(Photo)
                .where(Photo.profile_id == profile.id)
                .order_by(Photo.sort_order.asc(), Photo.created_at.asc())
            )
            first = remaining.scalars().first()
            if first:
                first.is_primary = True

        await self.db.commit()
        await StorageService().delete_by_url(photo_url)

    async def add_interest(self, user: User, data: InterestCreate) -> InterestResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        interest = Interest(profile_id=profile.id, name=data.name.strip())
        self.db.add(interest)
        await self.db.commit()
        await self.db.refresh(interest)
        return InterestResponse.model_validate(interest)

    async def delete_interest(self, user: User, interest_id: UUID) -> None:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        result = await self.db.execute(
            select(Interest).where(Interest.id == interest_id, Interest.profile_id == profile.id)
        )
        interest = result.scalar_one_or_none()
        if interest is None:
            raise ValueError("Intérêt introuvable")
        await self.db.delete(interest)
        await self.db.commit()

    async def to_public_profile(
        self,
        user: User,
        profile: Profile,
        current_user: User | None = None,
        current_profile: Profile | None = None,
        compatibility_score: float | None = None,
        is_available_tonight: bool = False,
        availability_note: str | None = None,
        is_connected: bool | None = None,
    ) -> PublicProfileResponse:
        indicators: list[str] = []
        score = compatibility_score
        if current_user and current_profile:
            if is_compatible(current_user, current_profile, user, profile):
                indicators = get_compatibility_indicators(
                    current_user, current_profile, user, profile
                )
            if score is None:
                score = calculate_compatibility(current_user, current_profile, user, profile)

        connected = is_connected
        connection_state: ConnectionState | None = None
        if current_user:
            connection_state = await self._connection_state(current_user.id, user.id)
            if connected is None:
                connected = connection_state == ConnectionState.CONNECTED

        completion = compute_profile_completion(user, profile)

        country = get_country(user.country)
        distance_km = None
        if (
            current_user
            and current_user.latitude is not None
            and current_user.longitude is not None
            and user.latitude is not None
            and user.longitude is not None
        ):
            distance_km = haversine_km(
                current_user.latitude,
                current_user.longitude,
                user.latitude,
                user.longitude,
            )

        note = availability_note
        if is_available_tonight and not note:
            note = format_availability_until(None, user.timezone)

        return PublicProfileResponse(
            id=profile.id,
            user_id=user.id,
            first_name=user.first_name,
            age=calculate_age(user.date_of_birth),
            gender=user.gender,
            city=user.city,
            country=user.country,
            country_name=country.name_fr,
            country_flag=country.flag,
            timezone=user.timezone,
            location_label=f"{user.city}, {country.name_fr} {country.flag}",
            bio=profile.bio,
            relationship_intention=profile.relationship_intention,
            occupation=profile.occupation,
            photos=[PhotoResponse.model_validate(p) for p in profile.photos],
            interests=[InterestResponse.model_validate(i) for i in profile.interests],
            compatibility_score=score,
            compatibility_indicators=indicators,
            is_available_tonight=is_available_tonight,
            availability_note=note,
            distance_km=distance_km,
            is_connected=connected or False,
            profile_completion_percent=completion.percent,
            connection_state=connection_state.value if connection_state else None,
        )

    async def get_public_profile(self, profile_id: UUID, current_user: User) -> PublicProfileResponse:
        result = await self.db.execute(
            select(Profile, User)
            .join(User, User.id == Profile.user_id)
            .where(Profile.id == profile_id)
            .options(selectinload(Profile.photos), selectinload(Profile.interests))
        )
        row = result.first()
        if row is None:
            raise ValueError("Profil introuvable")

        profile, user = row
        my_profile = await self._get_profile_by_user_id(current_user.id)
        return await self.to_public_profile(user, profile, current_user, my_profile)
