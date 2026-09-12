from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.profile import Profile
from app.models.travel import TravelPlan
from app.models.user import User
from app.schemas.profile import PublicProfileResponse
from app.schemas.travel import TravelMeResponse, TravelPlanCreate, TravelPlanResponse
from app.services.profile_service import ProfileService


class TravelService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)

    async def create_plan(self, user: User, data: TravelPlanCreate) -> TravelPlanResponse:
        if data.arrival_date > data.departure_date:
            raise ValueError("La date d'arrivée doit précéder la date de départ")

        existing = await self.db.execute(
            select(TravelPlan).where(TravelPlan.user_id == user.id, TravelPlan.is_active.is_(True))
        )
        for plan in existing.scalars().all():
            plan.is_active = False

        plan = TravelPlan(
            user_id=user.id,
            country=data.country.upper(),
            city=data.city.strip(),
            arrival_date=data.arrival_date,
            departure_date=data.departure_date,
            wants_to_meet=data.wants_to_meet,
            is_active=True,
        )
        self.db.add(plan)
        await self.db.commit()
        await self.db.refresh(plan)
        return TravelPlanResponse.model_validate(plan)

    async def get_my_plans(self, user: User) -> list[TravelPlanResponse]:
        result = await self.db.execute(
            select(TravelPlan)
            .where(TravelPlan.user_id == user.id)
            .order_by(TravelPlan.arrival_date.desc())
        )
        return [TravelPlanResponse.model_validate(p) for p in result.scalars().all()]

    async def get_active_plan(self, user: User) -> TravelPlan | None:
        today = date.today()
        result = await self.db.execute(
            select(TravelPlan).where(
                TravelPlan.user_id == user.id,
                TravelPlan.is_active.is_(True),
                TravelPlan.departure_date >= today,
            ).order_by(TravelPlan.arrival_date.asc())
        )
        return result.scalars().first()

    async def delete_plan(self, user: User, plan_id: UUID) -> None:
        plan = await self.db.get(TravelPlan, plan_id)
        if plan is None or plan.user_id != user.id:
            raise ValueError("Plan de voyage introuvable")
        plan.is_active = False
        await self.db.commit()

    async def _destination_profiles(
        self, current_user: User, active: TravelPlan | None
    ) -> list[PublicProfileResponse]:
        profiles: list[PublicProfileResponse] = []
        if not active or not active.wants_to_meet:
            return profiles

        my_profile = await self.profile_service._get_profile_by_user_id(current_user.id)
        result = await self.db.execute(
            select(User, Profile)
            .join(Profile, Profile.user_id == User.id)
            .where(
                User.is_active.is_(True),
                User.id != current_user.id,
                func.upper(User.country) == active.country.upper(),
                func.lower(User.city) == active.city.lower(),
            )
            .options(selectinload(Profile.photos), selectinload(Profile.interests))
            .limit(12)
        )
        for user, profile in result.all():
            profiles.append(
                await self.profile_service.to_public_profile(
                    user, profile, current_user, my_profile
                )
            )
        return profiles

    async def get_me(self, current_user: User) -> TravelMeResponse:
        active = await self.get_active_plan(current_user)
        plans = await self.get_my_plans(current_user)
        active_response = TravelPlanResponse.model_validate(active) if active else None
        profiles = await self._destination_profiles(current_user, active)
        return TravelMeResponse(
            active_plan=active_response,
            plans=plans,
            destination_profiles=profiles,
        )
