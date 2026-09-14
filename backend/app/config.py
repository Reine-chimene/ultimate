from functools import lru_cache
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    database_url: str = Field(
        default="postgresql+asyncpg://ultimate:ultimate@localhost:5432/ultimate",
        validation_alias="DATABASE_URL",
    )
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    environment: str = "development"
    cors_origins: str = "http://localhost:3000"
    media_storage_path: str = Field(default="./uploads", validation_alias="MEDIA_STORAGE_PATH")
    media_public_url: str = Field(default="http://localhost:8100", validation_alias="MEDIA_PUBLIC_URL")
    storage_backend: str = Field(default="local", validation_alias="STORAGE_BACKEND")
    s3_bucket: str | None = Field(default=None, validation_alias="S3_BUCKET")
    s3_endpoint: str | None = Field(default=None, validation_alias="S3_ENDPOINT")
    s3_access_key: str | None = Field(default=None, validation_alias="S3_ACCESS_KEY")
    s3_secret_key: str | None = Field(default=None, validation_alias="S3_SECRET_KEY")
    s3_region: str = Field(default="auto", validation_alias="S3_REGION")
    s3_public_base_url: str | None = Field(default=None, validation_alias="S3_PUBLIC_BASE_URL")
    frontend_url: str = Field(default="http://localhost:3100", validation_alias="FRONTEND_URL")
    smtp_host: str | None = Field(default=None, validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, validation_alias="SMTP_PORT")
    smtp_user: str | None = Field(default=None, validation_alias="SMTP_USER")
    smtp_password: str | None = Field(default=None, validation_alias="SMTP_PASSWORD")
    email_from: str = Field(default="noreply@ultimate.app", validation_alias="EMAIL_FROM")
    turn_urls: str = Field(default="", validation_alias="TURN_URLS")
    turn_username: str | None = Field(default=None, validation_alias="TURN_USERNAME")
    turn_credential: str | None = Field(default=None, validation_alias="TURN_CREDENTIAL")
    live_max_viewers: int = Field(default=15, validation_alias="LIVE_MAX_VIEWERS")

    @field_validator("database_url", mode="after")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+asyncpg://", 1)

        parsed = urlparse(value)
        if not parsed.query:
            return value

        params = parse_qs(parsed.query, keep_blank_values=True)
        params.pop("sslmode", None)
        if not params:
            return urlunparse(parsed._replace(query=""))

        flattened = {key: values[-1] for key, values in params.items()}
        return urlunparse(parsed._replace(query=urlencode(flattened)))

    @property
    def database_connect_args(self) -> dict:
        host = urlparse(self.database_url).hostname or ""
        if host.endswith(".neon.tech"):
            return {"ssl": True}
        return {}

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
