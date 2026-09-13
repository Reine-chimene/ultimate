from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.private_album_service import PrivateAlbumService

router = APIRouter(prefix="/private-albums", tags=["private-albums"])


@router.get("/{album_id}/photos/{photo_id}")
async def get_private_album_photo(
    album_id: UUID,
    photo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrivateAlbumService(db)
    try:
        content, mime_type = await service.get_photo_content(current_user, album_id, photo_id)
    except ValueError as exc:
        detail = str(exc)
        code = status.HTTP_404_NOT_FOUND if "introuvable" in detail.lower() else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=code, detail=detail) from exc
    return Response(
        content=content,
        media_type=mime_type,
        headers={"Cache-Control": "private, no-store"},
    )
