from uuid import UUID

from pydantic import BaseModel

from app.models.enums import ReportStatus, UserRole
from app.schemas.auth import UserResponse
from app.schemas.report import ReportResponse


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    new_users_7d: int
    total_matches: int
    total_messages: int
    tonight_users: int
    total_meetings: int
    pending_reports: int
    active_subscriptions: int


class AdminUserUpdate(BaseModel):
    is_active: bool | None = None
    role: UserRole | None = None


class AdminUsersResponse(BaseModel):
    users: list[UserResponse]
    total: int


class AdminReportsResponse(BaseModel):
    reports: list[ReportResponse]
    total: int


class AdminReportUpdate(BaseModel):
    status: ReportStatus
