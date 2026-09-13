from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import ConnectionRequestStatus, ConnectionState
from app.models.profile import Profile
from app.models.social import Block, Conversation, Like, Match
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.connections import (
    ConnectionActionResponse,
    ConnectionRequestCreate,
    ConnectionStatusResponse,
    PendingRequestItem,
    PendingRequestsResponse,
)
from app.services.compatibility import is_compatible
from app.services.premium_service import PremiumService
from app.services.profile_service import ProfileService

class ConnectionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)

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
        result = await self.db.execute(
            select(Match).where(
                or_(
                    and_(Match.user1_id == user_a_id, Match.user2_id == user_b_id),
                    and_(Match.user1_id == user_b_id, Match.user2_id == user_a_id),
                )
            )
        )
        return result.scalar_one_or_none()

    def _display(self, user: User) -> str:
        return (user.display_name or user.first_name).strip()

    async def _daily_limit(self, user: User) -> int:
        return await PremiumService(self.db).daily_like_limit(user)

    async def _requests_sent_today(self, user_id: UUID) -> int:
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

    async def requests_remaining(self, user: User) -> int:
        limit = await self._daily_limit(user)
        sent = await self._requests_sent_today(user.id)
        return max(0, limit - sent)

    async def get_connection_state(self, current_user: User, other_user_id: UUID) -> ConnectionStatusResponse:
        if await self._is_blocked(current_user.id, other_user_id):
            return ConnectionStatusResponse(state=ConnectionState.BLOCKED)

        match = await self._has_match(current_user.id, other_user_id)
        if match:
            return ConnectionStatusResponse(state=ConnectionState.CONNECTED, match_id=match.id)

        sent = await self.db.execute(
            select(Like).where(
                Like.sender_id == current_user.id,
                Like.receiver_id == other_user_id,
            )
        )
        sent_like = sent.scalar_one_or_none()

        received = await self.db.execute(
            select(Like).where(
                Like.sender_id == other_user_id,
                Like.receiver_id == current_user.id,
            )
        )
        received_like = received.scalar_one_or_none()

        if received_like and received_like.is_like and received_like.request_status == ConnectionRequestStatus.PENDING:
            return ConnectionStatusResponse(
                state=ConnectionState.PENDING_RECEIVED,
                intro_message=received_like.intro_message,
                requests_remaining=await self.requests_remaining(current_user),
            )

        if received_like and received_like.is_like and received_like.request_status is None:
            return ConnectionStatusResponse(
                state=ConnectionState.INTEREST_RECEIVED,
                requests_remaining=await self.requests_remaining(current_user),
            )

        if sent_like:
            if sent_like.request_status == ConnectionRequestStatus.DECLINED or not sent_like.is_like:
                return ConnectionStatusResponse(state=ConnectionState.DECLINED)
            if sent_like.request_status == ConnectionRequestStatus.PENDING:
                return ConnectionStatusResponse(
                    state=ConnectionState.PENDING_SENT,
                    intro_message=sent_like.intro_message,
                    requests_remaining=await self.requests_remaining(current_user),
                )
            if sent_like.is_like and sent_like.request_status is None:
                return ConnectionStatusResponse(
                    state=ConnectionState.INTEREST_SENT,
                    requests_remaining=await self.requests_remaining(current_user),
                )

        return ConnectionStatusResponse(
            state=ConnectionState.NONE,
            requests_remaining=await self.requests_remaining(current_user),
        )

    async def _create_connection(self, user1_id: UUID, user2_id: UUID) -> Match:
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

        await self.db.flush()
        return match

    async def send_request(self, sender: User, data: ConnectionRequestCreate) -> ConnectionActionResponse:
        if sender.id == data.receiver_id:
            raise ValueError("Vous ne pouvez pas vous connecter avec vous-même")

        receiver = await self.db.get(User, data.receiver_id)
        if receiver is None or not receiver.is_active:
            raise ValueError("Utilisateur introuvable")

        if await self._is_blocked(sender.id, data.receiver_id):
            raise ValueError("Interaction impossible avec cet utilisateur")

        if await self._has_match(sender.id, data.receiver_id):
            raise ValueError("Vous êtes déjà connectés")

        remaining = await self.requests_remaining(sender)
        if remaining <= 0:
            raise ValueError(
                "Vous avez atteint votre limite quotidienne de demandes. Passez à Premium pour en envoyer davantage."
            )

        existing = await self.db.execute(
            select(Like).where(
                Like.sender_id == sender.id,
                Like.receiver_id == data.receiver_id,
            )
        )
        existing_like = existing.scalar_one_or_none()
        if existing_like:
            if (
                existing_like.is_like
                and existing_like.request_status == ConnectionRequestStatus.PENDING
            ):
                raise ValueError("Une demande existe déjà pour cet utilisateur")
            if existing_like.request_status == ConnectionRequestStatus.ACCEPTED:
                raise ValueError("Vous êtes déjà connectés")

        sender_profile = await self.profile_service._get_profile_by_user_id(sender.id)
        receiver_profile = await self.profile_service._get_profile_by_user_id(data.receiver_id)
        if sender_profile and receiver_profile:
            if not is_compatible(sender, sender_profile, receiver, receiver_profile):
                raise ValueError("Ce profil n'est pas compatible avec vos préférences")

        intro = data.intro_message.strip() if data.intro_message else None
        if intro and len(intro) > 150:
            raise ValueError("Le message d'introduction ne peut pas dépasser 150 caractères")

        if existing_like and existing_like.request_status == ConnectionRequestStatus.DECLINED:
            existing_like.is_like = True
            existing_like.intro_message = intro
            existing_like.request_status = ConnectionRequestStatus.PENDING
            like = existing_like
        else:
            like = Like(
                sender_id=sender.id,
                receiver_id=data.receiver_id,
                is_like=True,
                intro_message=intro,
                request_status=ConnectionRequestStatus.PENDING,
            )
            self.db.add(like)

        await NotificationService(self.db).notify_connection_request(data.receiver_id, sender)
        await self.db.commit()

        return ConnectionActionResponse(
            state=ConnectionState.PENDING_SENT,
            requests_remaining=await self.requests_remaining(sender),
        )

    async def accept_request(self, user: User, sender_id: UUID) -> ConnectionActionResponse:
        if await self._is_blocked(user.id, sender_id):
            raise ValueError("Interaction impossible")

        incoming = await self.db.execute(
            select(Like).where(
                Like.sender_id == sender_id,
                Like.receiver_id == user.id,
                Like.is_like.is_(True),
                Like.request_status == ConnectionRequestStatus.PENDING,
            )
        )
        like = incoming.scalar_one_or_none()
        if like is None:
            raise ValueError("Demande de connexion introuvable")

        if await self._has_match(user.id, sender_id):
            raise ValueError("Vous êtes déjà connectés")

        like.request_status = ConnectionRequestStatus.ACCEPTED
        match = await self._create_connection(user.id, sender_id)

        sender = await self.db.get(User, sender_id)
        notifications = NotificationService(self.db)
        await notifications.notify_connection_accepted(sender_id, user, match.id)
        if sender:
            await notifications.notify_match_created(sender, user, match.id)
            await notifications.notify_match_created(user, sender, match.id)
        await self.db.commit()

        return ConnectionActionResponse(
            state=ConnectionState.CONNECTED,
            match_id=match.id,
        )

    async def decline_request(self, user: User, sender_id: UUID) -> ConnectionActionResponse:
        incoming = await self.db.execute(
            select(Like).where(
                Like.sender_id == sender_id,
                Like.receiver_id == user.id,
                Like.is_like.is_(True),
                Like.request_status == ConnectionRequestStatus.PENDING,
            )
        )
        like = incoming.scalar_one_or_none()
        if like is None:
            raise ValueError("Demande de connexion introuvable")

        like.request_status = ConnectionRequestStatus.DECLINED

        await NotificationService(self.db).notify_connection_declined(sender_id, user)
        await self.db.commit()

        return ConnectionActionResponse(state=ConnectionState.DECLINED)

    async def get_pending_requests(self, user: User) -> PendingRequestsResponse:
        my_profile = await self.profile_service._get_profile_by_user_id(user.id)
        received: list[PendingRequestItem] = []
        sent: list[PendingRequestItem] = []

        incoming = await self.db.execute(
            select(Like)
            .where(
                Like.receiver_id == user.id,
                Like.is_like.is_(True),
                Like.request_status == ConnectionRequestStatus.PENDING,
            )
            .order_by(Like.created_at.desc())
        )
        for like in incoming.scalars().all():
            if await self._is_blocked(user.id, like.sender_id):
                continue
            row = await self.db.execute(
                select(User, Profile)
                .join(Profile, Profile.user_id == User.id)
                .where(User.id == like.sender_id)
                .options(selectinload(Profile.photos), selectinload(Profile.interests))
            )
            result = row.first()
            if not result:
                continue
            sender_user, sender_profile = result
            profile = await self.profile_service.to_public_profile(
                sender_user, sender_profile, user, my_profile, is_connected=False
            )
            received.append(
                PendingRequestItem(
                    user_id=sender_user.id,
                    profile=profile,
                    intro_message=like.intro_message,
                    created_at=like.created_at,
                )
            )

        outgoing = await self.db.execute(
            select(Like)
            .where(
                Like.sender_id == user.id,
                Like.is_like.is_(True),
                Like.request_status == ConnectionRequestStatus.PENDING,
            )
            .order_by(Like.created_at.desc())
        )
        for like in outgoing.scalars().all():
            if await self._has_match(user.id, like.receiver_id):
                continue
            row = await self.db.execute(
                select(User, Profile)
                .join(Profile, Profile.user_id == User.id)
                .where(User.id == like.receiver_id)
                .options(selectinload(Profile.photos), selectinload(Profile.interests))
            )
            result = row.first()
            if not result:
                continue
            receiver_user, receiver_profile = result
            profile = await self.profile_service.to_public_profile(
                receiver_user, receiver_profile, user, my_profile, is_connected=False
            )
            sent.append(
                PendingRequestItem(
                    user_id=receiver_user.id,
                    profile=profile,
                    intro_message=like.intro_message,
                    created_at=like.created_at,
                )
            )

        return PendingRequestsResponse(
            received=received,
            sent=sent,
            requests_remaining=await self.requests_remaining(user),
        )
