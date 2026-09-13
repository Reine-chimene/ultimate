from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social import ProfilePass
from app.models.user import User


class PassService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def pass_profile(self, user: User, passed_id: UUID) -> None:
        if user.id == passed_id:
            raise ValueError("Action impossible")

        existing = await self.db.execute(
            select(ProfilePass).where(
                ProfilePass.passer_id == user.id,
                ProfilePass.passed_id == passed_id,
            )
        )
        if existing.scalar_one_or_none() is None:
            self.db.add(ProfilePass(passer_id=user.id, passed_id=passed_id))
            await self.db.commit()

    async def remove_pass(self, user: User, passed_id: UUID) -> None:
        await self.db.execute(
            delete(ProfilePass).where(
                ProfilePass.passer_id == user.id,
                ProfilePass.passed_id == passed_id,
            )
        )
        await self.db.commit()

    async def clear_all_passes(self, user: User) -> int:
        result = await self.db.execute(
            delete(ProfilePass).where(ProfilePass.passer_id == user.id)
        )
        await self.db.commit()
        return result.rowcount or 0

    async def get_passed_ids(self, user_id: UUID) -> set[UUID]:
        result = await self.db.execute(
            select(ProfilePass.passed_id).where(ProfilePass.passer_id == user_id)
        )
        return set(result.scalars().all())
