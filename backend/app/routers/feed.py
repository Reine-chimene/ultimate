from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.feed import FeedCommentCreate, FeedCommentResponse, FeedListResponse, FeedPostCreate, FeedPostResponse
from app.services.feed_service import FeedService

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedListResponse)
async def list_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FeedService(db).list_feed(user, page=page, limit=limit)


@router.post("", response_model=FeedPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: FeedPostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await FeedService(db).create_post(user, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{post_id}/like", response_model=FeedPostResponse)
async def like_post(
    post_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await FeedService(db).like_post(user, post_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{post_id}/like", response_model=FeedPostResponse)
async def unlike_post(
    post_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await FeedService(db).unlike_post(user, post_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{post_id}/comments", response_model=FeedCommentResponse, status_code=status.HTTP_201_CREATED)
async def comment_post(
    post_id: UUID,
    data: FeedCommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await FeedService(db).add_comment(user, post_id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await FeedService(db).delete_post(user, post_id)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
