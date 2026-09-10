from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social import Conversation, Like, Match
from app.models.subscription import Notification
from app.models.user import User
from app.schemas.discovery import LikeActionRequest, LikeActionResponse


class LikeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _create_match(self, user1_id: UUID, user2_id: UUID) -> Match:
        conversation = Conversation()
        self.db.add(conversation)
        await self.db.flush()

        ordered = sorted([user1_id, user2_id], key=str)
        match = Match(
            user1_id=ordered[0],
            user2_id=ordered[1],
            conversation_id=conversation.id,
            matched_at=datetime.now(UTC),
        )
        self.db.add(match)

        for uid, other_name_query in [(user1_id, user2_id), (user2_id, user1_id)]:
            other = await self.db.get(User, other_name_query)
            notification = Notification(
                user_id=uid,
                type="match",
                title="Nouveau match!",
                body=f"Vous avez un match avec {other.first_name if other else 'quelqu un'}!",
            )
            self.db.add(notification)

        await self.db.flush()
        return match

    async def like_or_pass(self, sender: User, data: LikeActionRequest) -> LikeActionResponse:
        if sender.id == data.receiver_id:
            raise ValueError("Vous ne pouvez pas interagir avec votre propre profil")

        receiver = await self.db.get(User, data.receiver_id)
        if receiver is None or not receiver.is_active:
            raise ValueError("Utilisateur introuvable")

        existing = await self.db.execute(
            select(Like).where(
                Like.sender_id == sender.id,
                Like.receiver_id == data.receiver_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Vous avez déjà interagi avec cet utilisateur")

        like = Like(
            sender_id=sender.id,
            receiver_id=data.receiver_id,
            is_like=data.is_like,
        )
        self.db.add(like)

        is_match = False
        match_id = None

        if data.is_like:
            mutual = await self.db.execute(
                select(Like).where(
                    Like.sender_id == data.receiver_id,
                    Like.receiver_id == sender.id,
                    Like.is_like.is_(True),
                )
            )
            if mutual.scalar_one_or_none():
                existing_match = await self.db.execute(
                    select(Match).where(
                        or_(
                            and_(Match.user1_id == sender.id, Match.user2_id == data.receiver_id),
                            and_(Match.user1_id == data.receiver_id, Match.user2_id == sender.id),
                        )
                    )
                )
                if existing_match.scalar_one_or_none() is None:
                    match = await self._create_match(sender.id, data.receiver_id)
                    is_match = True
                    match_id = match.id
            else:
                notification = Notification(
                    user_id=data.receiver_id,
                    type="like",
                    title="Nouveau like",
                    body=f"{sender.first_name} a aimé votre profil!",
                )
                self.db.add(notification)

        await self.db.commit()
        return LikeActionResponse(is_like=data.is_like, is_match=is_match, match_id=match_id)

    async def get_received_likes(self, user: User) -> list[UUID]:
        result = await self.db.execute(
            select(Like.sender_id).where(
                Like.receiver_id == user.id,
                Like.is_like.is_(True),
            )
        )
        return list(result.scalars().all())
