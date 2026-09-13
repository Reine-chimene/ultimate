from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ConnectionRequestStatus, ConnectionState
from app.models.profile import Profile
from app.models.social import Block, Like, Match
from app.models.subscription import Notification
from app.models.user import User
from app.schemas.discovery import LikeActionResponse
from app.schemas.interests import InterestListItem, InterestListsResponse
from app.services.compatibility import is_compatible
from app.services.connection_service import ConnectionService
from app.services.premium_service import PremiumService
from app.services.profile_service import ProfileService


class InterestService:
    """Clic-Match style mutual interest: like → reciprocal like → match."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)
        self.connections = ConnectionService(db)
        self.premium = PremiumService(db)

    async def _is_blocked(self, user_a_id: UUID, user_b_id: UUID) -> bool:
        result = await self.db.execute(
            select(Block).where(
                or_(
                    and_(Block.blocker_id == user_a_id, Block.blocked_id == user_b_id),
                    and_(Block.blocker_id == user_b_id, Block.blocked_id == user_a_id),
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def _has_match(self, user_a_id: UUID, user_b_id: UUID) -> Match | None:
        return await self.connections._has_match(user_a_id, user_b_id)

    async def _likes_sent_today(self, user_id: UUID) -> int:
        today = date.today()
        result = await self.db.execute(
            select(func.count())
            .select_from(Like)
            .where(
                Like.sender_id == user_id,
                Like.is_like.is_(True),
                func.date(Like.created_at) == today,
            )
        )
        return result.scalar_one()

    async def likes_remaining(self, user: User) -> int:
        limit = await self.premium.daily_like_limit(user)
        sent = await self._likes_sent_today(user.id)
        return max(0, limit - sent)

    def _display(self, user: User) -> str:
        return (user.display_name or user.first_name).strip()

    async def send_interest(self, sender: User, receiver_id: UUID) -> LikeActionResponse:
        if sender.id == receiver_id:
            raise ValueError("Action impossible")

        receiver = await self.db.get(User, receiver_id)
        if receiver is None or not receiver.is_active:
            raise ValueError("Utilisateur introuvable")

        if await self._is_blocked(sender.id, receiver_id):
            raise ValueError("Interaction impossible avec cet utilisateur")

        if await self._has_match(sender.id, receiver_id):
            match = await self._has_match(sender.id, receiver_id)
            return LikeActionResponse(is_like=True, is_match=True, match_id=match.id if match else None)

        remaining = await self.likes_remaining(sender)
        existing = await self.db.execute(
            select(Like).where(Like.sender_id == sender.id, Like.receiver_id == receiver_id)
        )
        existing_like = existing.scalar_one_or_none()

        if existing_like and existing_like.is_like:
            if existing_like.request_status == ConnectionRequestStatus.PENDING:
                raise ValueError("Une demande de connexion est déjà en attente")
            if existing_like.request_status is None:
                raise ValueError("Vous avez déjà manifesté votre intérêt")
            if existing_like.request_status == ConnectionRequestStatus.ACCEPTED:
                raise ValueError("Vous êtes déjà connectés")
        if existing_like and not existing_like.is_like:
            await self.db.delete(existing_like)
            existing_like = None

        if remaining <= 0 and existing_like is None:
            raise ValueError(
                "Limite quotidienne atteinte. Passez à Premium pour plus d'interactions."
            )

        sender_profile = await self.profile_service._get_profile_by_user_id(sender.id)
        receiver_profile = await self.profile_service._get_profile_by_user_id(receiver_id)
        if sender_profile and receiver_profile:
            if not is_compatible(sender, sender_profile, receiver, receiver_profile):
                raise ValueError("Ce profil n'est pas compatible avec vos préférences")

        reverse = await self.db.execute(
            select(Like).where(
                Like.sender_id == receiver_id,
                Like.receiver_id == sender.id,
                Like.is_like.is_(True),
            )
        )
        reverse_like = reverse.scalar_one_or_none()

        if existing_like:
            existing_like.is_like = True
            existing_like.request_status = None
            existing_like.intro_message = None
            like = existing_like
        else:
            like = Like(
                sender_id=sender.id,
                receiver_id=receiver_id,
                is_like=True,
                request_status=None,
            )
            self.db.add(like)

        is_match = False
        match_id = None

        reciprocal = (
            reverse_like
            and reverse_like.is_like
            and reverse_like.request_status != ConnectionRequestStatus.DECLINED
            and (
                reverse_like.request_status is None
                or reverse_like.request_status == ConnectionRequestStatus.PENDING
            )
        )
        if reciprocal:
            like.request_status = ConnectionRequestStatus.ACCEPTED
            reverse_like.request_status = ConnectionRequestStatus.ACCEPTED
            match = await self.connections._create_connection(sender.id, receiver_id)
            is_match = True
            match_id = match.id

            for uid, other in [(sender.id, receiver), (receiver_id, sender)]:
                self.db.add(
                    Notification(
                        user_id=uid,
                        type="match",
                        title="Nouveau match !",
                        body=f"Vous et {self._display(other)} vous êtes mutuellement intéressés.",
                    )
                )
        else:
            self.db.add(
                Notification(
                    user_id=receiver_id,
                    type="interest_received",
                    title="Nouvel intérêt",
                    body=f"{self._display(sender)} s'intéresse à votre profil.",
                )
            )

        await self.db.commit()
        return LikeActionResponse(
            is_like=True,
            is_match=is_match,
            match_id=match_id,
            likes_remaining=await self.likes_remaining(sender),
        )

    async def remove_interest(self, sender: User, receiver_id: UUID) -> None:
        if await self._has_match(sender.id, receiver_id):
            raise ValueError("Impossible de retirer l'intérêt après un match")

        result = await self.db.execute(
            select(Like).where(
                Like.sender_id == sender.id,
                Like.receiver_id == receiver_id,
                Like.is_like.is_(True),
                Like.request_status.is_(None),
            )
        )
        like = result.scalar_one_or_none()
        if like is None:
            raise ValueError("Intérêt introuvable")
        await self.db.delete(like)
        await self.db.commit()

    async def get_received(self, user: User) -> InterestListsResponse:
        my_profile = await self.profile_service._get_profile_by_user_id(user.id)
        items: list[InterestListItem] = []

        result = await self.db.execute(
            select(Like)
            .where(
                Like.receiver_id == user.id,
                Like.is_like.is_(True),
                Like.request_status.is_(None),
            )
            .order_by(Like.created_at.desc())
        )
        for like in result.scalars().all():
            if await self._is_blocked(user.id, like.sender_id):
                continue
            if await self._has_match(user.id, like.sender_id):
                continue
            row = await self.db.execute(
                select(User, Profile)
                .join(Profile, Profile.user_id == User.id)
                .where(User.id == like.sender_id)
                .options(selectinload(Profile.photos), selectinload(Profile.interests))
            )
            pair = row.first()
            if not pair:
                continue
            sender_user, sender_profile = pair
            profile = await self.profile_service.to_public_profile(
                sender_user, sender_profile, user, my_profile, is_connected=False
            )
            items.append(
                InterestListItem(
                    user_id=sender_user.id,
                    profile=profile,
                    created_at=like.created_at,
                )
            )

        return InterestListsResponse(
            received=items,
            likes_remaining=await self.likes_remaining(user),
        )

    async def get_sent(self, user: User) -> InterestListsResponse:
        my_profile = await self.profile_service._get_profile_by_user_id(user.id)
        items: list[InterestListItem] = []

        result = await self.db.execute(
            select(Like)
            .where(
                Like.sender_id == user.id,
                Like.is_like.is_(True),
                Like.request_status.is_(None),
            )
            .order_by(Like.created_at.desc())
        )
        for like in result.scalars().all():
            if await self._has_match(user.id, like.receiver_id):
                continue
            row = await self.db.execute(
                select(User, Profile)
                .join(Profile, Profile.user_id == User.id)
                .where(User.id == like.receiver_id)
                .options(selectinload(Profile.photos), selectinload(Profile.interests))
            )
            pair = row.first()
            if not pair:
                continue
            receiver_user, receiver_profile = pair
            profile = await self.profile_service.to_public_profile(
                receiver_user, receiver_profile, user, my_profile, is_connected=False
            )
            items.append(
                InterestListItem(
                    user_id=receiver_user.id,
                    profile=profile,
                    created_at=like.created_at,
                )
            )

        return InterestListsResponse(
            sent=items,
            likes_remaining=await self.likes_remaining(user),
        )

    async def get_connection_state_for_interest(
        self, current_user_id: UUID, other_user_id: UUID
    ) -> ConnectionState | None:
        sent = await self.db.execute(
            select(Like).where(Like.sender_id == current_user_id, Like.receiver_id == other_user_id)
        )
        sent_like = sent.scalar_one_or_none()
        received = await self.db.execute(
            select(Like).where(Like.sender_id == other_user_id, Like.receiver_id == current_user_id)
        )
        received_like = received.scalar_one_or_none()

        if received_like and received_like.is_like and received_like.request_status is None:
            return ConnectionState.INTEREST_RECEIVED
        if sent_like and sent_like.is_like and sent_like.request_status is None:
            return ConnectionState.INTEREST_SENT
        return None
