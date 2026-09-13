from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    unread_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    return await service.list_notifications(
        current_user, page=page, limit=limit, unread_only=unread_only
    )


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    count = await service.unread_count(current_user)
    return {"count": count}


async def _mark_read_handler(
    notification_id: UUID,
    current_user: User,
    db: AsyncSession,
) -> NotificationResponse:
    service = NotificationService(db)
    try:
        return await service.mark_read(current_user, notification_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read_patch(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _mark_read_handler(notification_id, current_user, db)


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read_post(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _mark_read_handler(notification_id, current_user, db)


@router.patch("/read-all")
async def mark_all_read_patch(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    count = await service.mark_all_read(current_user)
    return {"marked_read": count}


@router.post("/read-all")
async def mark_all_read_post(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    count = await service.mark_all_read(current_user)
    return {"marked_read": count}
