"""Phase 3: Ultimate Live rooms

Revision ID: 012
Revises: 011
Create Date: 2026-09-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

live_room_status = sa.Enum("live", "ended", name="live_room_status", create_type=False)


def _create_enum_if_missing(name: str, values: tuple[str, ...]) -> None:
    labels = ", ".join(f"'{value}'" for value in values)
    op.execute(
        f"""
        DO $$ BEGIN
            CREATE TYPE {name} AS ENUM ({labels});
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    _create_enum_if_missing("live_room_status", ("live", "ended"))

    if "live_rooms" not in existing_tables:
        op.create_table(
            "live_rooms",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("host_id", sa.UUID(), nullable=False),
            sa.Column("title", sa.String(120), nullable=False),
            sa.Column("description", sa.String(500), nullable=True),
            sa.Column("status", live_room_status, nullable=False, server_default="live"),
            sa.Column("viewer_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("is_vip_only", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column(
                "started_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
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
            sa.ForeignKeyConstraint(["host_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_live_rooms_host_id", "live_rooms", ["host_id"])
        op.create_index("ix_live_rooms_status", "live_rooms", ["status"])

    if "live_room_viewers" not in existing_tables:
        op.create_table(
            "live_room_viewers",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("room_id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
            sa.Column(
                "joined_at",
                sa.DateTime(timezone=True),
                server_default=sa.text("now()"),
                nullable=False,
            ),
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
            sa.ForeignKeyConstraint(["room_id"], ["live_rooms.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("room_id", "user_id", name="uq_live_room_viewer"),
        )
        op.create_index("ix_live_room_viewers_room_id", "live_room_viewers", ["room_id"])


def downgrade() -> None:
    op.drop_table("live_room_viewers")
    op.drop_table("live_rooms")
    op.execute("DROP TYPE IF EXISTS live_room_status")
