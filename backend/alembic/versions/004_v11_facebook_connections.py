"""V1.1: Facebook-style connections, intro message, onboarding, ce soir slots

Revision ID: 004
Revises: 003
Create Date: 2026-09-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "CREATE TYPE connection_request_status AS ENUM ('pending', 'accepted', 'declined')"
    )

    op.add_column("likes", sa.Column("intro_message", sa.String(150), nullable=True))
    op.add_column(
        "likes",
        sa.Column(
            "request_status",
            sa.Enum("pending", "accepted", "declined", name="connection_request_status"),
            nullable=True,
        ),
    )

    op.execute(
        """
        UPDATE likes SET request_status = 'pending'
        WHERE is_like = true AND request_status IS NULL
        """
    )
    op.execute(
        """
        UPDATE likes l SET request_status = 'accepted'
        FROM matches m
        WHERE l.is_like = true
          AND (
            (m.user1_id = l.sender_id AND m.user2_id = l.receiver_id)
            OR (m.user1_id = l.receiver_id AND m.user2_id = l.sender_id)
          )
        """
    )

    op.add_column(
        "users",
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.add_column("availabilities", sa.Column("start_time", sa.Time(), nullable=True))
    op.add_column("availabilities", sa.Column("end_time", sa.Time(), nullable=True))


def downgrade() -> None:
    op.drop_column("availabilities", "end_time")
    op.drop_column("availabilities", "start_time")
    op.drop_column("users", "onboarding_completed")
    op.drop_column("likes", "request_status")
    op.drop_column("likes", "intro_message")
    op.execute("DROP TYPE connection_request_status")
