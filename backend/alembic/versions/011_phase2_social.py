"""Phase 2: community feed, couples, fantasies, private videos

Revision ID: 011
Revises: 010
Create Date: 2026-09-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

account_type = postgresql.ENUM("single", "couple", name="account_type", create_type=False)
private_album_media_type = postgresql.ENUM(
    "photo", "video", name="private_album_media_type", create_type=False
)
gender = postgresql.ENUM(
    "male", "female", "non_binary", "other", name="gender", create_type=False
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


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    _create_enum_if_missing("account_type", ("single", "couple"))
    _create_enum_if_missing("private_album_media_type", ("photo", "video"))

    user_columns = {c["name"] for c in inspector.get_columns("users")}
    if "account_type" not in user_columns:
        op.add_column(
            "users",
            sa.Column(
                "account_type",
                account_type,
                nullable=False,
                server_default="single",
            ),
        )
        op.create_index("ix_users_account_type", "users", ["account_type"])

    profile_columns = {c["name"] for c in inspector.get_columns("profiles")}
    if "partner_first_name" not in profile_columns:
        op.add_column("profiles", sa.Column("partner_first_name", sa.String(100), nullable=True))
    if "partner_gender" not in profile_columns:
        op.add_column("profiles", sa.Column("partner_gender", gender, nullable=True))
    if "partner_date_of_birth" not in profile_columns:
        op.add_column("profiles", sa.Column("partner_date_of_birth", sa.Date(), nullable=True))

    if "profile_fantasies" not in existing_tables:
        op.create_table(
            "profile_fantasies",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("profile_id", sa.UUID(), nullable=False),
            sa.Column("tag", sa.String(100), nullable=False),
            sa.Column("category", sa.String(50), nullable=True),
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
            sa.ForeignKeyConstraint(["profile_id"], ["profiles.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("profile_id", "tag", name="uq_profile_fantasy_tag"),
        )
        op.create_index("ix_profile_fantasies_profile_id", "profile_fantasies", ["profile_id"])

    if "feed_posts" not in existing_tables:
        op.create_table(
            "feed_posts",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("author_id", sa.UUID(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("image_url", sa.String(500), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
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
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_feed_posts_author_id", "feed_posts", ["author_id"])
        op.create_index("ix_feed_posts_created_at", "feed_posts", ["created_at"])

    if "feed_post_likes" not in existing_tables:
        op.create_table(
            "feed_post_likes",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("post_id", sa.UUID(), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=False),
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
            sa.ForeignKeyConstraint(["post_id"], ["feed_posts.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("post_id", "user_id", name="uq_feed_post_like"),
        )
        op.create_index("ix_feed_post_likes_post_id", "feed_post_likes", ["post_id"])
        op.create_index("ix_feed_post_likes_user_id", "feed_post_likes", ["user_id"])

    if "feed_post_comments" not in existing_tables:
        op.create_table(
            "feed_post_comments",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("post_id", sa.UUID(), nullable=False),
            sa.Column("author_id", sa.UUID(), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
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
            sa.ForeignKeyConstraint(["post_id"], ["feed_posts.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_feed_post_comments_post_id", "feed_post_comments", ["post_id"])
        op.create_index("ix_feed_post_comments_author_id", "feed_post_comments", ["author_id"])

    photo_columns = {c["name"] for c in inspector.get_columns("private_album_photos")}
    if "media_type" not in photo_columns:
        op.add_column(
            "private_album_photos",
            sa.Column(
                "media_type",
                private_album_media_type,
                nullable=False,
                server_default="photo",
            ),
        )


def downgrade() -> None:
    op.drop_column("private_album_photos", "media_type")
    op.drop_table("feed_post_comments")
    op.drop_table("feed_post_likes")
    op.drop_table("feed_posts")
    op.drop_table("profile_fantasies")
    op.drop_column("profiles", "partner_date_of_birth")
    op.drop_column("profiles", "partner_gender")
    op.drop_column("profiles", "partner_first_name")
    op.drop_index("ix_users_account_type", table_name="users")
    op.drop_column("users", "account_type")
