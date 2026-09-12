from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.connections import (
    ConnectionActionResponse,
    ConnectionRequestCreate,
    ConnectionStatusResponse,
    PendingRequestsResponse,
)
from app.services.connection_service import ConnectionService

router = APIRouter(prefix="/connections", tags=["connections"])


@router.post("/request", response_model=ConnectionActionResponse, status_code=status.HTTP_201_CREATED)
async def send_connection_request(
    data: ConnectionRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ConnectionService(db)
    try:
        return await service.send_request(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{user_id}/accept", response_model=ConnectionActionResponse)
async def accept_connection(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ConnectionService(db)
    try:
        return await service.accept_request(current_user, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{user_id}/decline", response_model=ConnectionActionResponse)
async def decline_connection(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ConnectionService(db)
    try:
        return await service.decline_request(current_user, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/status/{user_id}", response_model=ConnectionStatusResponse)
async def connection_status(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ConnectionService(db)
    return await service.get_connection_state(current_user, user_id)


@router.get("/pending", response_model=PendingRequestsResponse)
async def pending_connections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ConnectionService(db)
    return await service.get_pending_requests(current_user)
