from datetime import date

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.meeting import Availability
from app.models.profile import Profile
from app.models.user import User
from app.schemas.availability import AvailabilityResponse, AvailabilitySet, TonightAvailabilityResponse
from app.services.compatibility import is_compatible
from app.services.pass_service import PassService
from app.services.profile_service import ProfileService
from app.timezone_utils import format_availability_slot


class AvailabilityService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)

    async def _expire_past_availability(self) -> None:
        today = date.today()
        await self.db.execute(
            update(Availability)
            .where(Availability.available_date < today, Availability.is_available.is_(True))
            .values(is_available=False)
        )
        await self.db.commit()

    def _availability_response(self, availability: Availability, user: User | None = None) -> AvailabilityResponse:
        label = None
        if availability.is_available and user:
            label = format_availability_slot(
                availability.start_time,
                availability.end_time,
                user.timezone,
                user.city,
            )
        data = AvailabilityResponse.model_validate(availability)
        return data.model_copy(update={"availability_label": label})

    async def set_availability(self, user: User, data: AvailabilitySet) -> AvailabilityResponse:
        await self._expire_past_availability()
        target_date = data.available_date or date.today()

        if data.start_time and data.end_time and data.start_time >= data.end_time:
            raise ValueError("L'heure de début doit être avant l'heure de fin")

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
            if data.start_time is not None:
                availability.start_time = data.start_time
            if data.end_time is not None:
                availability.end_time = data.end_time
        else:
            availability = Availability(
                user_id=user.id,
                available_date=target_date,
                is_available=data.is_available,
                note=data.note,
                start_time=data.start_time,
                end_time=data.end_time,
            )
            self.db.add(availability)

        await self.db.commit()
        await self.db.refresh(availability)
        return self._availability_response(availability, user)

    async def get_my_availability(self, user: User) -> list[AvailabilityResponse]:
        await self._expire_past_availability()
        result = await self.db.execute(
            select(Availability)
            .where(Availability.user_id == user.id)
            .order_by(Availability.available_date.desc())
        )
        return [self._availability_response(a, user) for a in result.scalars().all()]

    async def get_tonight(self, current_user: User) -> TonightAvailabilityResponse:
        await self._expire_past_availability()
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
        passed_ids = await PassService(self.db).get_passed_ids(current_user.id)

        privacy_map = await self.profile_service.privacy.load_map([user.id for user, _, _ in rows])

        users = []
        for user, profile, availability in rows:
            if user.id in passed_ids:
                continue
            if my_profile and not is_compatible(current_user, my_profile, user, profile):
                continue
            note = availability.note
            if not note:
                note = format_availability_slot(
                    availability.start_time,
                    availability.end_time,
                    user.timezone,
                    user.city,
                )
            users.append(
                await self.profile_service.to_public_profile(
                    user,
                    profile,
                    current_user,
                    my_profile,
                    is_available_tonight=True,
                    availability_note=note,
                    privacy_map=privacy_map,
                )
            )

        return TonightAvailabilityResponse(date=tonight, users=users)
