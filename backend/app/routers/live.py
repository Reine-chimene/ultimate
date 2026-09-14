from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.live import LiveConfigResponse, LiveRoomCreate, LiveRoomListResponse, LiveRoomResponse
from app.services.live_config_service import build_ice_servers
from app.services.live_service import LiveService
from app.config import get_settings

router = APIRouter(prefix="/live", tags=["live"])


@router.get("/config", response_model=LiveConfigResponse)
async def live_config(user: User = Depends(get_current_user)):
    settings = get_settings()
    return LiveConfigResponse(
        ice_servers=build_ice_servers(),
        max_viewers=settings.live_max_viewers,
    )


@router.get("/rooms/{room_id}", response_model=LiveRoomResponse)
async def get_room(
    room_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await LiveService(db).get_room(user, room_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/rooms", response_model=LiveRoomListResponse)
async def list_rooms(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await LiveService(db).list_live_rooms(user)


@router.post("/rooms", response_model=LiveRoomResponse, status_code=status.HTTP_201_CREATED)
async def start_room(
    data: LiveRoomCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await LiveService(db).start_room(user, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/rooms/{room_id}/join", response_model=LiveRoomResponse)
async def join_room(
    room_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await LiveService(db).join_room(user, room_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/rooms/{room_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_room(
    room_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await LiveService(db).leave_room(user, room_id)


@router.post("/rooms/{room_id}/end", status_code=status.HTTP_204_NO_CONTENT)
async def end_room(
    room_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await LiveService(db).end_room(user, room_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
