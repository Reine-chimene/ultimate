"""P1-B.1: private albums

Revision ID: 009
Revises: 008
Create Date: 2026-09-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

private_album_access_status = postgresql.ENUM(
    "pending",
    "approved",
    "rejected",
    "revoked",
    name="private_album_access_status",
    create_type=False,
)
private_album_photo_moderation_status = postgresql.ENUM(
    "pending",
    "approved",
    "rejected",
    name="private_album_photo_moderation_status",
    create_type=False,
)


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


def _create_index_if_missing(
    inspector: sa.Inspector,
    name: str,
    table: str,
    columns: list[str],
    **kwargs,
) -> None:
    existing = {idx["name"] for idx in inspector.get_indexes(table)}
    if name not in existing:
        op.create_index(name, table, columns, **kwargs)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    _create_enum_if_missing(
        "private_album_access_status",
        ("pending", "approved", "rejected", "revoked"),
    )
    _create_enum_if_missing(
        "private_album_photo_moderation_status",
        ("pending", "approved", "rejected"),
    )

    if "private_albums" not in existing_tables:
        op.create_table(
            "private_albums",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("owner_id", sa.UUID(), nullable=False),
            sa.Column("title", sa.String(length=120), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column(
                "is_visible_on_profile",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
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
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        inspector = sa.inspect(bind)

    _create_index_if_missing(
        inspector,
        "ix_private_albums_owner_id",
        "private_albums",
        ["owner_id"],
    )

    if "private_album_photos" not in existing_tables:
        op.create_table(
            "private_album_photos",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("album_id", sa.UUID(), nullable=False),
            sa.Column("owner_id", sa.UUID(), nullable=False),
            sa.Column("storage_key", sa.String(length=500), nullable=False),
            sa.Column(
                "mime_type",
                sa.String(length=100),
                nullable=False,
                server_default="image/jpeg",
            ),
            sa.Column("file_size", sa.Integer(), nullable=False),
            sa.Column("width", sa.Integer(), nullable=True),
            sa.Column("height", sa.Integer(), nullable=True),
            sa.Column(
                "moderation_status",
                private_album_photo_moderation_status,
                nullable=False,
                server_default="approved",
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
            sa.ForeignKeyConstraint(["album_id"], ["private_albums.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        inspector = sa.inspect(bind)

    _create_index_if_missing(
        inspector,
        "ix_private_album_photos_album_id",
        "private_album_photos",
        ["album_id"],
    )
    _create_index_if_missing(
        inspector,
        "ix_private_album_photos_owner_id",
        "private_album_photos",
        ["owner_id"],
    )

    if "private_album_access_requests" not in existing_tables:
        op.create_table(
            "private_album_access_requests",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("album_id", sa.UUID(), nullable=False),
            sa.Column("requester_id", sa.UUID(), nullable=False),
            sa.Column("owner_id", sa.UUID(), nullable=False),
            sa.Column(
                "status",
                private_album_access_status,
                nullable=False,
                server_default="pending",
            ),
            sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
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
            sa.CheckConstraint("requester_id != owner_id", name="ck_private_album_access_no_self"),
            sa.ForeignKeyConstraint(["album_id"], ["private_albums.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["requester_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "album_id",
                "requester_id",
                name="uq_private_album_access_album_requester",
            ),
        )
        inspector = sa.inspect(bind)

    _create_index_if_missing(
        inspector,
        "ix_private_album_access_album_id",
        "private_album_access_requests",
        ["album_id"],
    )
    _create_index_if_missing(
        inspector,
        "ix_private_album_access_requester_id",
        "private_album_access_requests",
        ["requester_id"],
    )
    _create_index_if_missing(
        inspector,
        "ix_private_album_access_owner_id",
        "private_album_access_requests",
        ["owner_id"],
    )
    _create_index_if_missing(
        inspector,
        "ix_private_album_access_status",
        "private_album_access_requests",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index("ix_private_album_access_status", table_name="private_album_access_requests")
    op.drop_index("ix_private_album_access_owner_id", table_name="private_album_access_requests")
    op.drop_index("ix_private_album_access_requester_id", table_name="private_album_access_requests")
    op.drop_index("ix_private_album_access_album_id", table_name="private_album_access_requests")
    op.drop_table("private_album_access_requests")
    op.drop_index("ix_private_album_photos_owner_id", table_name="private_album_photos")
    op.drop_index("ix_private_album_photos_album_id", table_name="private_album_photos")
    op.drop_table("private_album_photos")
    op.drop_index("ix_private_albums_owner_id", table_name="private_albums")
    op.drop_table("private_albums")
    op.execute("DROP TYPE IF EXISTS private_album_photo_moderation_status")
    op.execute("DROP TYPE IF EXISTS private_album_access_status")
