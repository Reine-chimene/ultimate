from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.discovery import LikeActionRequest, LikeActionResponse
from app.schemas.likes import PendingRequestsResponse
from app.services.like_service import LikeService

router = APIRouter(prefix="/likes", tags=["likes"])


@router.post("", response_model=LikeActionResponse, status_code=status.HTTP_201_CREATED)
async def like_or_pass(
    data: LikeActionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LikeService(db)
    try:
        return await service.like_or_pass(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/received")
async def received_likes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LikeService(db)
    sender_ids = await service.get_received_likes(current_user)
    return {"sender_ids": sender_ids, "count": len(sender_ids)}


@router.get("/pending", response_model=PendingRequestsResponse)
async def pending_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LikeService(db)
    return await service.get_pending_requests(current_user)
