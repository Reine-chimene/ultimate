from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.enums import DiscoveryMode, Gender, RelationshipIntention
from app.models.user import User
from app.schemas.search import SearchFilters, SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search_profiles(
    gender: Gender | None = None,
    min_age: int | None = Query(default=None, ge=18, le=99),
    max_age: int | None = Query(default=None, ge=18, le=99),
    country: str | None = Query(default=None, min_length=2, max_length=2),
    city: str | None = None,
    max_distance_km: int | None = Query(default=None, ge=1, le=500),
    intention: RelationshipIntention | None = None,
    available_tonight: bool = False,
    has_photo: bool = False,
    online_only: bool = False,
    interest_category: str | None = None,
    mode: DiscoveryMode = DiscoveryMode.NEAR_ME,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = SearchService(db)
    filters = SearchFilters(
        gender=gender,
        min_age=min_age,
        max_age=max_age,
        country=country,
        city=city,
        max_distance_km=max_distance_km,
        intention=intention,
        available_tonight=available_tonight,
        has_photo=has_photo,
        online_only=online_only,
        interest_category=interest_category,
        mode=mode,
        page=page,
        page_size=page_size,
    )
    try:
        return await service.search(current_user, filters)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
