"""P1-A.2: profile views tracking

Revision ID: 007
Revises: 006
Create Date: 2026-09-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "profile_views",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("viewer_id", sa.UUID(), nullable=False),
        sa.Column("viewed_user_id", sa.UUID(), nullable=False),
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
        sa.CheckConstraint(
            "viewer_id <> viewed_user_id",
            name="ck_profile_views_not_self",
        ),
        sa.ForeignKeyConstraint(["viewer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["viewed_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_profile_views_viewed_user_id_created_at",
        "profile_views",
        ["viewed_user_id", "created_at"],
    )
    op.create_index(
        "ix_profile_views_viewer_id_created_at",
        "profile_views",
        ["viewer_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_profile_views_viewer_id_created_at", table_name="profile_views")
    op.drop_index("ix_profile_views_viewed_user_id_created_at", table_name="profile_views")
    op.drop_table("profile_views")
