from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.availability import AvailabilityResponse, AvailabilitySet, TonightAvailabilityResponse
from app.services.availability_service import AvailabilityService

router = APIRouter(prefix="/availability", tags=["availability"])


@router.post("", response_model=AvailabilityResponse)
async def set_availability(
    data: AvailabilitySet,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AvailabilityService(db)
    try:
        return await service.set_availability(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/me", response_model=list[AvailabilityResponse])
async def get_my_availability(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AvailabilityService(db)
    return await service.get_my_availability(current_user)


@router.get("/tonight", response_model=TonightAvailabilityResponse)
async def get_tonight(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AvailabilityService(db)
    return await service.get_tonight(current_user)
