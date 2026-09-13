from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.connections import ProfileCompletionResponse
from app.schemas.profile import (
    InterestCreate,
    InterestResponse,
    PhotoCreate,
    PhotoResponse,
    PreferencesResponse,
    PreferencesUpdate,
    ProfileResponse,
    ProfileUpdate,
    PublicProfileResponse,
)
from app.constants.interests import INTEREST_CATALOG
from app.schemas.fantasies import FantasyCreate, FantasyResponse
from app.services.fantasy_service import FantasyService
from app.services.interest_service import InterestService
from app.services.pass_service import PassService
from app.services.photo_upload_service import PhotoUploadError, PhotoUploadService
from app.services.profile_completion import compute_profile_completion
from app.services.profile_service import ProfileService
from app.schemas.interests import InterestListsResponse
from app.schemas.privacy import PrivacySettingsResponse, PrivacySettingsUpdate
from app.schemas.profile_view import ProfileVisitorsResponse
from app.services.privacy_service import PrivacyService
from app.services.profile_view_service import ProfileViewService
from app.schemas.private_album import (
    PrivateAlbumAccessRequestListResponse,
    PrivateAlbumAccessRequestResponse,
    PrivateAlbumCreate,
    PrivateAlbumDetail,
    PrivateAlbumListResponse,
    PrivateAlbumPhotoResponse,
    PrivateAlbumUpdate,
)
from app.services.private_album_service import PrivateAlbumService

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me/completion", response_model=ProfileCompletionResponse)
async def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        profile = await service._get_profile_by_user_id(current_user.id)
        if profile is None:
            raise ValueError("Profil introuvable")
        return compute_profile_completion(current_user, profile)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        return await service.get_my_profile(current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        return await service.update_profile(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/me/preferences", response_model=PreferencesResponse)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        return await service.get_preferences(current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/me/preferences", response_model=PreferencesResponse)
async def update_my_preferences(
    data: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        return await service.update_preferences(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/me/photos/upload", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    is_primary: bool = Form(default=False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile_service = ProfileService(db)
    upload_service = PhotoUploadService(profile_service)
    content = await file.read()
    try:
        return await upload_service.upload(current_user, content, file.content_type, is_primary)
    except PhotoUploadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/me/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def add_photo(
    data: PhotoCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        return await service.add_photo(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/me/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        await service.delete_photo(current_user, photo_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/me/interests", response_model=InterestResponse, status_code=status.HTTP_201_CREATED)
async def add_interest(
    data: InterestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        return await service.add_interest(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/me/interests/{interest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_interest(
    interest_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        await service.delete_interest(current_user, interest_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/interests/catalog")
async def get_interests_catalog():
    return {"categories": INTEREST_CATALOG}


@router.get("/fantasies/catalog")
async def get_fantasies_catalog():
    return {"categories": FantasyService.catalog()}


@router.get("/me/fantasies", response_model=list[FantasyResponse])
async def list_my_fantasies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FantasyService(db).list_for_user(current_user)


@router.post("/me/fantasies", response_model=FantasyResponse, status_code=status.HTTP_201_CREATED)
async def add_fantasy(
    data: FantasyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await FantasyService(db).add(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/me/fantasies/{fantasy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_fantasy(
    fantasy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await FantasyService(db).remove(current_user, fantasy_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/me/like/{user_id}", status_code=status.HTTP_201_CREATED)
async def like_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InterestService(db)
    try:
        return await service.send_interest(current_user, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/me/like/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = InterestService(db)
    try:
        await service.remove_interest(current_user, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/me/likes-received", response_model=InterestListsResponse)
async def likes_received(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await InterestService(db).get_received(current_user)


@router.get("/me/likes-sent", response_model=InterestListsResponse)
async def likes_sent(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await InterestService(db).get_sent(current_user)


@router.post("/me/pass/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def pass_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await PassService(db).pass_profile(current_user, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/me/passes", status_code=status.HTTP_200_OK)
async def clear_passes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await PassService(db).clear_all_passes(current_user)
    return {"cleared": count}


@router.get("/me/privacy", response_model=PrivacySettingsResponse)
async def get_my_privacy(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PrivacyService(db).get_settings_response(current_user)


@router.patch("/me/privacy", response_model=PrivacySettingsResponse)
async def update_my_privacy(
    data: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivacyService(db).update_settings(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/me/visitors", response_model=ProfileVisitorsResponse)
async def get_my_visitors(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ProfileViewService(db).list_visitors(current_user, page=page, limit=limit)


@router.get("/me/private-albums", response_model=PrivateAlbumListResponse)
async def list_my_private_albums(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PrivateAlbumService(db).list_owner_albums(current_user)


@router.post("/me/private-albums", response_model=PrivateAlbumDetail, status_code=status.HTTP_201_CREATED)
async def create_private_album(
    data: PrivateAlbumCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).create_album(current_user, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/me/private-albums/{album_id}", response_model=PrivateAlbumDetail)
async def get_my_private_album(
    album_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).get_owner_album_detail(current_user, album_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/me/private-albums/{album_id}", response_model=PrivateAlbumDetail)
async def update_private_album(
    album_id: UUID,
    data: PrivateAlbumUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).update_album(current_user, album_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/me/private-albums/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_private_album(
    album_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await PrivateAlbumService(db).delete_album(current_user, album_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/me/private-albums/{album_id}/photos",
    response_model=PrivateAlbumPhotoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_private_album_photo(
    album_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PrivateAlbumService(db)
    content = await file.read()
    try:
        return await service.add_photo(current_user, album_id, content, file.content_type)
    except (PhotoUploadError, ValueError) as exc:
        detail = str(exc)
        code = status.HTTP_404_NOT_FOUND if "introuvable" in detail.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail) from exc


@router.delete("/me/private-albums/{album_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_private_album_photo(
    album_id: UUID,
    photo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await PrivateAlbumService(db).delete_photo(current_user, album_id, photo_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/me/private-album-requests", response_model=PrivateAlbumAccessRequestListResponse)
async def list_my_private_album_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PrivateAlbumService(db).list_my_access_requests(current_user)


@router.get(
    "/me/private-albums/{album_id}/requests",
    response_model=PrivateAlbumAccessRequestListResponse,
)
async def list_private_album_requests(
    album_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).list_access_requests_for_owner(current_user, album_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post(
    "/me/private-albums/{album_id}/requests/{request_id}/approve",
    response_model=PrivateAlbumAccessRequestResponse,
)
async def approve_private_album_request(
    album_id: UUID,
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).approve_access(current_user, album_id, request_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post(
    "/me/private-albums/{album_id}/requests/{request_id}/reject",
    response_model=PrivateAlbumAccessRequestResponse,
)
async def reject_private_album_request(
    album_id: UUID,
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).reject_access(current_user, album_id, request_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post(
    "/me/private-albums/{album_id}/requests/{request_id}/revoke",
    response_model=PrivateAlbumAccessRequestResponse,
)
async def revoke_private_album_access(
    album_id: UUID,
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).revoke_access(current_user, album_id, request_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{user_id}/private-albums", response_model=PrivateAlbumListResponse)
async def list_user_private_albums(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await PrivateAlbumService(db).list_visible_albums(user_id, current_user)


@router.post(
    "/{user_id}/private-albums/{album_id}/request-access",
    response_model=PrivateAlbumAccessRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_private_album_access(
    user_id: UUID,
    album_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await PrivateAlbumService(db).request_access(current_user, user_id, album_id)
    except ValueError as exc:
        detail = str(exc)
        code = status.HTTP_404_NOT_FOUND if "introuvable" in detail.lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=code, detail=detail) from exc


@router.get("/{profile_id}", response_model=PublicProfileResponse)
async def get_profile(
    profile_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProfileService(db)
    try:
        return await service.get_public_profile(profile_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
