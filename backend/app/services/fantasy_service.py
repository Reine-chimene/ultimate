from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants.fantasies import ALL_FANTASY_TAGS, FANTASY_CATALOG
from app.models.profile import ProfileFantasy
from app.models.user import User
from app.schemas.fantasies import FantasyCreate, FantasyResponse
from app.services.profile_service import ProfileService


class FantasyService:
    MAX_FANTASIES = 12

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profiles = ProfileService(db)

    @staticmethod
    def catalog() -> dict[str, list[str]]:
        return FANTASY_CATALOG

    async def list_for_user(self, user: User) -> list[FantasyResponse]:
        profile = await self.profiles._get_profile_by_user_id(user.id)
        if profile is None:
            return []
        return [FantasyResponse.model_validate(f) for f in profile.fantasies]

    async def add(self, user: User, data: FantasyCreate) -> FantasyResponse:
        tag = data.tag.strip()
        if tag not in ALL_FANTASY_TAGS:
            raise ValueError("Fantaisie non reconnue")
        profile = await self.profiles._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")
        if len(profile.fantasies) >= self.MAX_FANTASIES:
            raise ValueError(f"Maximum {self.MAX_FANTASIES} fantaisies")
        existing = await self.db.execute(
            select(ProfileFantasy).where(
                ProfileFantasy.profile_id == profile.id,
                ProfileFantasy.tag == tag,
            )
        )
        if existing.scalar_one_or_none() is not None:
            raise ValueError("Cette fantaisie est déjà ajoutée")
        fantasy = ProfileFantasy(profile_id=profile.id, tag=tag, category=data.category)
        self.db.add(fantasy)
        await self.db.commit()
        await self.db.refresh(fantasy)
        return FantasyResponse.model_validate(fantasy)

    async def remove(self, user: User, fantasy_id: UUID) -> None:
        profile = await self.profiles._get_profile_by_user_id(user.id)
        if profile is None:
            raise ValueError("Profil introuvable")
        result = await self.db.execute(
            select(ProfileFantasy).where(
                ProfileFantasy.id == fantasy_id,
                ProfileFantasy.profile_id == profile.id,
            )
        )
        fantasy = result.scalar_one_or_none()
        if fantasy is None:
            raise ValueError("Fantaisie introuvable")
        await self.db.delete(fantasy)
        await self.db.commit()
