from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.countries import COUNTRIES
from app.models.user import User
from app.schemas.world import CountryStats, WorldResponse


class WorldService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_world_overview(self) -> WorldResponse:
        result = await self.db.execute(
            select(User.country, func.count())
            .where(User.is_active.is_(True))
            .group_by(User.country)
            .order_by(func.count().desc())
        )
        counts = {row[0].upper(): row[1] for row in result.all()}

        countries: list[CountryStats] = []
        for code, info in COUNTRIES.items():
            countries.append(
                CountryStats(
                    code=code,
                    name=info.name,
                    name_fr=info.name_fr,
                    flag=info.flag,
                    user_count=counts.get(code, 0),
                )
            )

        countries.sort(key=lambda c: (-c.user_count, c.name_fr))
        return WorldResponse(countries=countries, total_countries=len([c for c in countries if c.user_count > 0]))
