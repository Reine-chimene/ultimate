"""P1-A.1: user privacy settings

Revision ID: 006
Revises: 005
Create Date: 2026-09-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_privacy_settings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("show_online", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("show_last_seen", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("incognito_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_privacy_settings_user_id"),
    )
    op.create_index("ix_user_privacy_settings_user_id", "user_privacy_settings", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_privacy_settings_user_id", table_name="user_privacy_settings")
    op.drop_table("user_privacy_settings")
