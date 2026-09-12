from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.world import WorldResponse
from app.services.world_service import WorldService

router = APIRouter(prefix="/world", tags=["world"])


@router.get("", response_model=WorldResponse)
async def get_world_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    del current_user
    service = WorldService(db)
    return await service.get_world_overview()
