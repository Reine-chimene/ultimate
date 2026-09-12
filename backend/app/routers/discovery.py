from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.enums import DiscoveryMode, Gender, RelationshipIntention
from app.schemas.discovery import DiscoveryFilters, DiscoveryResponse
from app.services.discovery_service import DiscoveryService

router = APIRouter(prefix="/discovery", tags=["discovery"])


@router.get("", response_model=DiscoveryResponse)
async def discover_profiles(
    min_age: int | None = Query(default=None, ge=18, le=99),
    max_age: int | None = Query(default=None, ge=18, le=99),
    city: str | None = None,
    country: str | None = Query(default=None, min_length=2, max_length=2),
    gender: Gender | None = None,
    intention: RelationshipIntention | None = None,
    available_tonight: bool = False,
    mode: DiscoveryMode = DiscoveryMode.NEAR_ME,
    max_distance_km: int | None = Query(default=None, ge=1, le=500),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    filters = DiscoveryFilters(
        min_age=min_age,
        max_age=max_age,
        city=city,
        country=country,
        gender=gender,
        intention=intention,
        available_tonight=available_tonight,
        mode=mode,
        max_distance_km=max_distance_km,
        limit=limit,
    )
    service = DiscoveryService(db)
    try:
        return await service.discover(current_user, filters)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
