from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin
from app.database import get_db
from app.models.enums import ReportStatus
from app.models.user import User
from app.schemas.admin import AdminStatsResponse, AdminUserUpdate, AdminUsersResponse
from app.schemas.auth import UserResponse
from app.schemas.report import ReportResponse
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def admin_stats(
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_stats()


@router.get("/users", response_model=AdminUsersResponse)
async def admin_list_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_users(skip=skip, limit=limit)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def admin_update_user(
    user_id: UUID,
    data: AdminUserUpdate,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        return await service.update_user(user_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/reports", response_model=list[ReportResponse])
async def admin_list_reports(
    status_filter: ReportStatus | None = Query(default=None, alias="status"),
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.list_reports(status=status_filter)


@router.patch("/reports/{report_id}", response_model=ReportResponse)
async def admin_update_report(
    report_id: UUID,
    status: ReportStatus,
    _: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    try:
        return await service.update_report(report_id, status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
