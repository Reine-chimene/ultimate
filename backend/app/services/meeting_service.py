from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MeetingStatus
from app.models.meeting import Meeting
from app.models.subscription import Notification
from app.models.user import User
from app.schemas.meeting import MeetingCreate, MeetingResponse


class MeetingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _to_response(self, meeting: Meeting) -> MeetingResponse:
        requester = await self.db.get(User, meeting.requester_id)
        receiver = await self.db.get(User, meeting.receiver_id)
        response = MeetingResponse.model_validate(meeting)
        response.requester_name = requester.first_name if requester else None
        response.receiver_name = receiver.first_name if receiver else None
        return response

    async def create_meeting(self, requester: User, data: MeetingCreate) -> MeetingResponse:
        if requester.id == data.receiver_id:
            raise ValueError("Vous ne pouvez pas vous inviter vous-même")

        receiver = await self.db.get(User, data.receiver_id)
        if receiver is None or not receiver.is_active:
            raise ValueError("Utilisateur introuvable")

        meeting = Meeting(
            requester_id=requester.id,
            receiver_id=data.receiver_id,
            proposed_at=data.proposed_at,
            location=data.location,
            message=data.message,
            status=MeetingStatus.PENDING,
        )
        self.db.add(meeting)

        notification = Notification(
            user_id=data.receiver_id,
            type="meeting",
            title="Invitation à une rencontre",
            body=f"{requester.first_name} souhaite vous rencontrer!",
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(meeting)
        return await self._to_response(meeting)

    async def list_meetings(self, user: User) -> list[MeetingResponse]:
        result = await self.db.execute(
            select(Meeting)
            .where(
                or_(Meeting.requester_id == user.id, Meeting.receiver_id == user.id)
            )
            .order_by(Meeting.created_at.desc())
        )
        meetings = result.scalars().all()
        return [await self._to_response(m) for m in meetings]

    async def _get_meeting(self, meeting_id: UUID, user_id: UUID) -> Meeting:
        result = await self.db.execute(
            select(Meeting).where(
                Meeting.id == meeting_id,
                or_(Meeting.requester_id == user_id, Meeting.receiver_id == user_id),
            )
        )
        meeting = result.scalar_one_or_none()
        if meeting is None:
            raise ValueError("Rencontre introuvable")
        return meeting

    async def accept(self, user: User, meeting_id: UUID) -> MeetingResponse:
        meeting = await self._get_meeting(meeting_id, user.id)
        if meeting.receiver_id != user.id:
            raise ValueError("Seul le destinataire peut accepter")
        if meeting.status != MeetingStatus.PENDING:
            raise ValueError("Cette rencontre ne peut plus être acceptée")

        meeting.status = MeetingStatus.ACCEPTED
        notification = Notification(
            user_id=meeting.requester_id,
            type="meeting",
            title="Rencontre acceptée",
            body=f"{user.first_name} a accepté votre invitation!",
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(meeting)
        return await self._to_response(meeting)

    async def reject(self, user: User, meeting_id: UUID) -> MeetingResponse:
        meeting = await self._get_meeting(meeting_id, user.id)
        if meeting.receiver_id != user.id:
            raise ValueError("Seul le destinataire peut refuser")
        if meeting.status != MeetingStatus.PENDING:
            raise ValueError("Cette rencontre ne peut plus être refusée")

        meeting.status = MeetingStatus.REJECTED
        await self.db.commit()
        await self.db.refresh(meeting)
        return await self._to_response(meeting)

    async def cancel(self, user: User, meeting_id: UUID) -> MeetingResponse:
        meeting = await self._get_meeting(meeting_id, user.id)
        if meeting.requester_id != user.id:
            raise ValueError("Seul l'initiateur peut annuler")
        if meeting.status in (MeetingStatus.REJECTED, MeetingStatus.CANCELLED):
            raise ValueError("Cette rencontre est déjà terminée")

        meeting.status = MeetingStatus.CANCELLED
        await self.db.commit()
        await self.db.refresh(meeting)
        return await self._to_response(meeting)
