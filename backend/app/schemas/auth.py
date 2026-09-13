from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import Gender, UserRole
from app.schemas.common import ORMModel


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    date_of_birth: date
    gender: Gender
    city: str = Field(min_length=2, max_length=100)
    country: str = Field(default="CA", min_length=2, max_length=2)
    timezone: str | None = Field(default=None, max_length=64)
    terms_accepted: bool
    is_adult: bool

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Vous devez accepter les conditions d'utilisation")
        return value

    @field_validator("is_adult")
    @classmethod
    def validate_adult(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Vous devez avoir 18 ans ou plus")
        return value

    @field_validator("date_of_birth")
    @classmethod
    def validate_age(cls, value: date) -> date:
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise ValueError("Vous devez avoir au moins 18 ans")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserResponse(ORMModel):
    id: UUID
    email: EmailStr
    first_name: str
    display_name: str | None = None
    date_of_birth: date
    gender: Gender
    city: str
    country: str
    timezone: str
    role: UserRole
    is_active: bool
    onboarding_completed: bool = False
    terms_accepted_at: datetime
    created_at: datetime
