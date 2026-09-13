from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.feed import FeedPost, FeedPostComment, FeedPostLike
from app.models.user import User
from app.schemas.feed import (
    FeedCommentCreate,
    FeedCommentResponse,
    FeedListResponse,
    FeedPostCreate,
    FeedPostResponse,
)
from app.services.notification_service import NotificationService


class FeedService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.notifications = NotificationService(db)

    @staticmethod
    def _display_name(user: User) -> str:
        return (user.display_name or user.first_name).strip()

    async def _post_response(self, post: FeedPost, viewer: User) -> FeedPostResponse:
        like_count = len(post.likes)
        comment_count = len(post.comments)
        liked_by_me = any(like.user_id == viewer.id for like in post.likes)
        author = post.author
        comments = [
            FeedCommentResponse(
                id=c.id,
                post_id=c.post_id,
                author_id=c.author_id,
                author_display_name=self._display_name(c.author),
                content=c.content,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in post.comments[:5]
        ]
        return FeedPostResponse(
            id=post.id,
            author_id=post.author_id,
            author_display_name=self._display_name(author),
            author_account_type=author.account_type.value,
            content=post.content,
            image_url=post.image_url,
            like_count=like_count,
            comment_count=comment_count,
            liked_by_me=liked_by_me,
            comments=comments,
            created_at=post.created_at,
            updated_at=post.updated_at,
        )

    async def create_post(self, user: User, data: FeedPostCreate) -> FeedPostResponse:
        post = FeedPost(
            author_id=user.id,
            content=data.content.strip(),
            image_url=data.image_url,
        )
        self.db.add(post)
        await self.db.commit()
        await self.db.refresh(post)
        result = await self.db.execute(
            select(FeedPost)
            .where(FeedPost.id == post.id)
            .options(
                selectinload(FeedPost.author),
                selectinload(FeedPost.likes),
                selectinload(FeedPost.comments).selectinload(FeedPostComment.author),
            )
        )
        loaded = result.scalar_one()
        return await self._post_response(loaded, user)

    async def list_feed(self, user: User, page: int = 1, limit: int = 20) -> FeedListResponse:
        page = max(page, 1)
        limit = min(max(limit, 1), 50)
        offset = (page - 1) * limit

        total_result = await self.db.execute(
            select(func.count())
            .select_from(FeedPost)
            .where(FeedPost.is_active.is_(True))
        )
        total = int(total_result.scalar_one() or 0)

        result = await self.db.execute(
            select(FeedPost)
            .where(FeedPost.is_active.is_(True))
            .options(
                selectinload(FeedPost.author),
                selectinload(FeedPost.likes),
                selectinload(FeedPost.comments).selectinload(FeedPostComment.author),
            )
            .order_by(FeedPost.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        posts = result.scalars().all()
        items = [await self._post_response(post, user) for post in posts]
        return FeedListResponse(items=items, total=total, page=page, limit=limit)

    async def like_post(self, user: User, post_id: UUID) -> FeedPostResponse:
        post = await self._get_post(post_id)
        if post is None:
            raise ValueError("Publication introuvable")
        if post.author_id == user.id:
            raise ValueError("Vous ne pouvez pas aimer votre propre publication")
        existing = await self.db.execute(
            select(FeedPostLike).where(
                FeedPostLike.post_id == post_id,
                FeedPostLike.user_id == user.id,
            )
        )
        if existing.scalar_one_or_none() is None:
            self.db.add(FeedPostLike(post_id=post_id, user_id=user.id))
            await self.notifications.create(
                post.author_id,
                "feed_post_liked",
                "Publication aimée",
                f"❤️ {self._display_name(user)} a aimé votre publication",
                actor_user_id=user.id,
                reference_type="feed_post",
                reference_id=post_id,
            )
            await self.db.commit()
        return await self._get_post_response(post_id, user)

    async def unlike_post(self, user: User, post_id: UUID) -> FeedPostResponse:
        result = await self.db.execute(
            select(FeedPostLike).where(
                FeedPostLike.post_id == post_id,
                FeedPostLike.user_id == user.id,
            )
        )
        like = result.scalar_one_or_none()
        if like is not None:
            await self.db.delete(like)
            await self.db.commit()
        return await self._get_post_response(post_id, user)

    async def add_comment(
        self, user: User, post_id: UUID, data: FeedCommentCreate
    ) -> FeedCommentResponse:
        post = await self._get_post(post_id)
        if post is None:
            raise ValueError("Publication introuvable")
        comment = FeedPostComment(
            post_id=post_id,
            author_id=user.id,
            content=data.content.strip(),
        )
        self.db.add(comment)
        if post.author_id != user.id:
            await self.notifications.create(
                post.author_id,
                "feed_post_commented",
                "Nouveau commentaire",
                f"💬 {self._display_name(user)} a commenté votre publication",
                actor_user_id=user.id,
                reference_type="feed_post",
                reference_id=post_id,
            )
        await self.db.commit()
        await self.db.refresh(comment)
        return FeedCommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_display_name=self._display_name(user),
            content=comment.content,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )

    async def delete_post(self, user: User, post_id: UUID) -> None:
        post = await self._get_post(post_id)
        if post is None:
            raise ValueError("Publication introuvable")
        if post.author_id != user.id:
            raise ValueError("Accès refusé")
        post.is_active = False
        await self.db.commit()

    async def _get_post(self, post_id: UUID) -> FeedPost | None:
        result = await self.db.execute(
            select(FeedPost)
            .where(FeedPost.id == post_id, FeedPost.is_active.is_(True))
            .options(
                selectinload(FeedPost.author),
                selectinload(FeedPost.likes),
                selectinload(FeedPost.comments).selectinload(FeedPostComment.author),
            )
        )
        return result.scalar_one_or_none()

    async def _get_post_response(self, post_id: UUID, viewer: User) -> FeedPostResponse:
        post = await self._get_post(post_id)
        if post is None:
            raise ValueError("Publication introuvable")
        return await self._post_response(post, viewer)
