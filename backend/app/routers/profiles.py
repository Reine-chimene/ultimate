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
