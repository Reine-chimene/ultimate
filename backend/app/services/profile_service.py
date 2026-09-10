from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.profile import Interest, Photo, Profile
from app.models.user import User
from app.schemas.profile import (
    InterestCreate,
    InterestResponse,
    PhotoCreate,
    PhotoResponse,
    ProfileResponse,
    ProfileUpdate,
    PublicProfileResponse,
)
from app.services.compatibility import calculate_age, calculate_compatibility


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

    async def get_my_profile(self, user: User) -> ProfileResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")
        return ProfileResponse.model_validate(profile)

    async def update_profile(self, user: User, data: ProfileUpdate) -> ProfileResponse:
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
        return ProfileResponse.model_validate(profile)

    async def add_photo(self, user: User, data: PhotoCreate) -> PhotoResponse:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        if data.is_primary:
            for photo in profile.photos:
                photo.is_primary = False

        photo = Photo(
            profile_id=profile.id,
            url=data.url,
            is_primary=data.is_primary,
            sort_order=data.sort_order,
        )
        self.db.add(photo)
        await self.db.commit()
        await self.db.refresh(photo)
        return PhotoResponse.model_validate(photo)

    async def delete_photo(self, user: User, photo_id: UUID) -> None:
        profile = await self._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")

        result = await self.db.execute(
            select(Photo).where(Photo.id == photo_id, Photo.profile_id == profile.id)
        )
        photo = result.scalar_one_or_none()
        if photo is None:
            raise ValueError("Photo introuvable")
        await self.db.delete(photo)
        await self.db.commit()

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
    ) -> PublicProfileResponse:
        score = compatibility_score
        if score is None and current_user and current_profile:
            score = calculate_compatibility(current_user, current_profile, user, profile)

        return PublicProfileResponse(
            id=profile.id,
            user_id=user.id,
            first_name=user.first_name,
            age=calculate_age(user.date_of_birth),
            gender=user.gender,
            city=user.city,
            bio=profile.bio,
            relationship_intention=profile.relationship_intention,
            occupation=profile.occupation,
            photos=[PhotoResponse.model_validate(p) for p in profile.photos],
            interests=[InterestResponse.model_validate(i) for i in profile.interests],
            compatibility_score=score,
            is_available_tonight=is_available_tonight,
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
