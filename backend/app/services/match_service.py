from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.profile import Profile
from app.models.social import Conversation, Match, Message
from app.models.user import User
from app.schemas.match import ConversationResponse, MatchResponse, MessageCreate, MessageResponse
from app.services.profile_service import ProfileService


class MatchService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.profile_service = ProfileService(db)

    async def _get_match_for_user(self, match_id: UUID, user_id: UUID) -> Match:
        result = await self.db.execute(
            select(Match).where(
                Match.id == match_id,
                or_(Match.user1_id == user_id, Match.user2_id == user_id),
            )
        )
        match = result.scalar_one_or_none()
        if match is None:
            raise ValueError("Match introuvable")
        return match

    async def list_matches(self, user: User) -> list[MatchResponse]:
        result = await self.db.execute(
            select(Match)
            .where(or_(Match.user1_id == user.id, Match.user2_id == user.id))
            .order_by(Match.matched_at.desc())
        )
        matches = result.scalars().all()
        my_profile = await self.profile_service._get_profile_by_user_id(user.id)

        responses: list[MatchResponse] = []
        for match in matches:
            other_id = match.user2_id if match.user1_id == user.id else match.user1_id
            other_user_result = await self.db.execute(
                select(User, Profile)
                .join(Profile, Profile.user_id == User.id)
                .where(User.id == other_id)
                .options(selectinload(Profile.photos), selectinload(Profile.interests))
            )
            row = other_user_result.first()
            other_user = None
            if row:
                other_u, other_p = row
                other_user = await self.profile_service.to_public_profile(
                    other_u, other_p, user, my_profile
                )

            response = MatchResponse.model_validate(match)
            response.other_user = other_user
            responses.append(response)
        return responses

    async def get_conversation(self, user: User, match_id: UUID) -> ConversationResponse:
        match = await self._get_match_for_user(match_id, user.id)
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.id == match.conversation_id)
            .options(selectinload(Conversation.messages))
        )
        conversation = result.scalar_one_or_none()
        if conversation is None:
            raise ValueError("Conversation introuvable")

        response = ConversationResponse.model_validate(conversation)
        response.match_id = match.id
        return response

    async def send_message(
        self, user: User, match_id: UUID, data: MessageCreate
    ) -> MessageResponse:
        match = await self._get_match_for_user(match_id, user.id)
        message = Message(
            conversation_id=match.conversation_id,
            sender_id=user.id,
            content=data.content.strip(),
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return MessageResponse.model_validate(message)

    async def mark_messages_read(self, user: User, match_id: UUID) -> int:
        match = await self._get_match_for_user(match_id, user.id)
        result = await self.db.execute(
            select(Message).where(
                Message.conversation_id == match.conversation_id,
                Message.sender_id != user.id,
                Message.read_at.is_(None),
            )
        )
        messages = result.scalars().all()
        now = datetime.now(UTC)
        for msg in messages:
            msg.read_at = now
        await self.db.commit()
        return len(messages)
