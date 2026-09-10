from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.match import MessageCreate, MessageResponse
from app.services.match_service import MatchService

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/{match_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    match_id: UUID,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MatchService(db)
    try:
        return await service.send_message(current_user, match_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{match_id}/read")
async def mark_read(
    match_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = MatchService(db)
    try:
        count = await service.mark_messages_read(current_user, match_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return {"marked_read": count}
