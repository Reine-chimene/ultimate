from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.countries import get_country
from app.models.enums import ReportStatus, SubscriptionStatus, UserRole
from app.models.meeting import Availability, Meeting
from app.models.social import Match, Message, Report
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.admin import AdminStatsResponse, AdminUserUpdate, AdminUsersResponse, CountryUserCount
from app.schemas.auth import UserResponse
from app.schemas.report import ReportResponse


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_stats(self) -> AdminStatsResponse:
        total_users = (await self.db.execute(select(func.count()).select_from(User))).scalar_one()
        active_users = (
            await self.db.execute(select(func.count()).select_from(User).where(User.is_active.is_(True)))
        ).scalar_one()
        total_matches = (await self.db.execute(select(func.count()).select_from(Match))).scalar_one()
        pending_reports = (
            await self.db.execute(
                select(func.count()).select_from(Report).where(Report.status == ReportStatus.PENDING)
            )
        ).scalar_one()
        active_subscriptions = (
            await self.db.execute(
                select(func.count())
                .select_from(Subscription)
                .where(Subscription.status == SubscriptionStatus.ACTIVE)
            )
        ).scalar_one()
        week_ago = datetime.now(UTC) - timedelta(days=7)
        new_users_7d = (
            await self.db.execute(
                select(func.count()).select_from(User).where(User.created_at >= week_ago)
            )
        ).scalar_one()
        total_messages = (
            await self.db.execute(select(func.count()).select_from(Message))
        ).scalar_one()
        tonight_users = (
            await self.db.execute(
                select(func.count())
                .select_from(Availability)
                .where(Availability.available_date == date.today(), Availability.is_available.is_(True))
            )
        ).scalar_one()
        total_meetings = (
            await self.db.execute(select(func.count()).select_from(Meeting))
        ).scalar_one()

        country_rows = await self.db.execute(
            select(User.country, func.count())
            .where(User.is_active.is_(True))
            .group_by(User.country)
            .order_by(func.count().desc())
        )
        users_by_country = [
            CountryUserCount(
                code=row[0].upper(),
                name=get_country(row[0]).name_fr,
                count=row[1],
            )
            for row in country_rows.all()
        ]

        return AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            new_users_7d=new_users_7d,
            total_matches=total_matches,
            total_messages=total_messages,
            tonight_users=tonight_users,
            total_meetings=total_meetings,
            pending_reports=pending_reports,
            active_subscriptions=active_subscriptions,
            users_by_country=users_by_country,
        )

    async def list_users(self, skip: int = 0, limit: int = 50) -> AdminUsersResponse:
        total = (await self.db.execute(select(func.count()).select_from(User))).scalar_one()
        result = await self.db.execute(
            select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
        )
        users = [UserResponse.model_validate(u) for u in result.scalars().all()]
        return AdminUsersResponse(users=users, total=total)

    async def update_user(self, user_id: UUID, data: AdminUserUpdate) -> UserResponse:
        user = await self.db.get(User, user_id)
        if user is None:
            raise ValueError("Utilisateur introuvable")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)

        await self.db.commit()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    async def list_reports(self, status: ReportStatus | None = None) -> list[ReportResponse]:
        query = select(Report).order_by(Report.created_at.desc())
        if status:
            query = query.where(Report.status == status)
        result = await self.db.execute(query)
        return [ReportResponse.model_validate(r) for r in result.scalars().all()]

    async def update_report(self, report_id: UUID, status: ReportStatus) -> ReportResponse:
        report = await self.db.get(Report, report_id)
        if report is None:
            raise ValueError("Signalement introuvable")

        report.status = status
        await self.db.commit()
        await self.db.refresh(report)
        return ReportResponse.model_validate(report)
