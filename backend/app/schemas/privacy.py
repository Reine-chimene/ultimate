from pydantic import BaseModel, Field


class PrivacySettingsResponse(BaseModel):
    show_online: bool = True
    show_last_seen: bool = True
    incognito_enabled: bool = False
    can_use_incognito: bool = False


class PrivacySettingsUpdate(BaseModel):
    show_online: bool | None = None
    show_last_seen: bool | None = None
    incognito_enabled: bool | None = None

    def has_updates(self) -> bool:
        return (
            self.show_online is not None
            or self.show_last_seen is not None
            or self.incognito_enabled is not None
        )
