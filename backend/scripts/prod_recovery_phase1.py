"""One-shot production schema recovery — additive only. Run via fly ssh console."""

import asyncio

from sqlalchemy import text

from app.database import engine

STATEMENTS: list[tuple[str, str]] = [
    (
        "007 ck_profile_views_not_self",
        """
        DO $$ BEGIN
            ALTER TABLE profile_views
                ADD CONSTRAINT ck_profile_views_not_self
                CHECK (viewer_id <> viewed_user_id);
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        """,
    ),
    (
        "007 ix_profile_views_viewed",
        """
        CREATE INDEX IF NOT EXISTS ix_profile_views_viewed_user_id_created_at
            ON profile_views (viewed_user_id, created_at);
        """,
    ),
    (
        "007 ix_profile_views_viewer",
        """
        CREATE INDEX IF NOT EXISTS ix_profile_views_viewer_id_created_at
            ON profile_views (viewer_id, created_at);
        """,
    ),
    (
        "008 notifications.actor_user_id",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_user_id UUID",
    ),
    (
        "008 notifications.reference_type",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50)",
    ),
    (
        "008 notifications.reference_id",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id UUID",
    ),
    (
        "008 fk_notifications_actor_user_id",
        """
        DO $$ BEGIN
            ALTER TABLE notifications
                ADD CONSTRAINT fk_notifications_actor_user_id
                FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
        """,
    ),
    (
        "008 ix_notifications_user_id_created_at",
        """
        CREATE INDEX IF NOT EXISTS ix_notifications_user_id_created_at
            ON notifications (user_id, created_at);
        """,
    ),
    (
        "008 ix_notifications_user_id_read_at_created_at",
        """
        CREATE INDEX IF NOT EXISTS ix_notifications_user_id_read_at_created_at
            ON notifications (user_id, read_at, created_at);
        """,
    ),
    (
        "008 ix_notifications_actor_user_id",
        """
        CREATE INDEX IF NOT EXISTS ix_notifications_actor_user_id
            ON notifications (actor_user_id);
        """,
    ),
    (
        "008 uq_notifications_dedupe_match",
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedupe_match
            ON notifications (user_id, type, reference_id)
            WHERE type = 'match_created' AND reference_id IS NOT NULL;
        """,
    ),
    (
        "009 ix_private_albums_owner_id",
        """
        CREATE INDEX IF NOT EXISTS ix_private_albums_owner_id
            ON private_albums (owner_id);
        """,
    ),
    (
        "009 ix_private_album_photos_album_id",
        """
        CREATE INDEX IF NOT EXISTS ix_private_album_photos_album_id
            ON private_album_photos (album_id);
        """,
    ),
    (
        "009 ix_private_album_photos_owner_id",
        """
        CREATE INDEX IF NOT EXISTS ix_private_album_photos_owner_id
            ON private_album_photos (owner_id);
        """,
    ),
    (
        "010 users.preferred_language",
        """
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) NOT NULL DEFAULT 'fr';
        """,
    ),
    (
        "010 ix_users_preferred_language",
        """
        CREATE INDEX IF NOT EXISTS ix_users_preferred_language
            ON users (preferred_language);
        """,
    ),
]


async def main() -> None:
    async with engine.begin() as conn:
        for label, stmt in STATEMENTS:
            await conn.execute(text(stmt))
            print(f"OK {label}")
    print("RECOVERY_SQL_DONE")


if __name__ == "__main__":
    asyncio.run(main())
