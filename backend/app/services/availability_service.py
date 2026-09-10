from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.meeting import Availability
from app.models.profile import Profile
from app.models.user import User
from app.schemas.availability import AvailabilityResponse, AvailabilitySet, TonightAvailabilityResponse
from app.services.profile_service import ProfileService


class AvailabilityService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)

    async def set_availability(self, user: User, data: AvailabilitySet) -> AvailabilityResponse:
        target_date = data.available_date or date.today()

        result = await self.db.execute(
            select(Availability).where(
                Availability.user_id == user.id,
                Availability.available_date == target_date,
            )
        )
        availability = result.scalar_one_or_none()

        if availability:
            availability.is_available = data.is_available
            availability.note = data.note
        else:
            availability = Availability(
                user_id=user.id,
                available_date=target_date,
                is_available=data.is_available,
                note=data.note,
            )
            self.db.add(availability)

        await self.db.commit()
        await self.db.refresh(availability)
        return AvailabilityResponse.model_validate(availability)

    async def get_my_availability(self, user: User) -> list[AvailabilityResponse]:
        result = await self.db.execute(
            select(Availability)
            .where(Availability.user_id == user.id)
            .order_by(Availability.available_date.desc())
        )
        return [AvailabilityResponse.model_validate(a) for a in result.scalars().all()]

    async def get_tonight(self, current_user: User) -> TonightAvailabilityResponse:
        tonight = date.today()
        result = await self.db.execute(
            select(User, Profile, Availability)
            .join(Availability, Availability.user_id == User.id)
            .join(Profile, Profile.user_id == User.id)
            .where(
                Availability.available_date == tonight,
                Availability.is_available.is_(True),
                User.is_active.is_(True),
                User.id != current_user.id,
            )
            .options(selectinload(Profile.photos), selectinload(Profile.interests))
        )
        rows = result.all()
        my_profile = await self.profile_service._get_profile_by_user_id(current_user.id)

        users = []
        for user, profile, _availability in rows:
            users.append(
                await self.profile_service.to_public_profile(
                    user, profile, current_user, my_profile, is_available_tonight=True
                )
            )

        return TonightAvailabilityResponse(date=tonight, users=users)
