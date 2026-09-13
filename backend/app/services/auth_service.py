import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from jose import JWTError

from app.auth import create_access_token, create_refresh_token, hash_password, verify_password
from app.auth.jwt import verify_refresh_token
from app.countries import default_timezone_for_country
from app.languages import DEFAULT_LANGUAGE
from app.models.auth_tokens import PasswordResetToken
from app.models.enums import Gender, RelationshipIntention, SubscriptionPlan, SubscriptionStatus
from app.models.profile import Profile
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.email_service import EmailService

RESET_TOKEN_TTL = timedelta(hours=1)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> tuple[UserResponse, TokenResponse]:
        existing = await self.db.execute(select(User).where(User.email == data.email.lower()))
        if existing.scalar_one_or_none():
            raise ValueError("Cet courriel est déjà utilisé")

        country = data.country.upper()
        timezone = data.timezone or default_timezone_for_country(country)

        first = data.first_name.strip()
        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            first_name=first,
            display_name=first,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            city=data.city.strip(),
            country=country,
            timezone=timezone,
            preferred_language=data.preferred_language or DEFAULT_LANGUAGE,
            onboarding_completed=False,
        )
        self.db.add(user)
        await self.db.flush()

        opposite_gender = Gender.FEMALE if data.gender == Gender.MALE else Gender.MALE
        profile = Profile(
            user_id=user.id,
            relationship_intention=RelationshipIntention.UNSURE,
            looking_for_genders=[opposite_gender],
            preferred_intentions=[RelationshipIntention.UNSURE],
        )
        self.db.add(profile)

        subscription = Subscription(
            user_id=user.id,
            plan=SubscriptionPlan.FREE,
            status=SubscriptionStatus.ACTIVE,
            started_at=datetime.now(UTC),
        )
        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(user)

        tokens = TokenResponse(
            access_token=create_access_token(user.id, {"role": user.role.value}),
            refresh_token=create_refresh_token(user.id),
        )
        return UserResponse.model_validate(user), tokens

    async def login(self, data: LoginRequest) -> tuple[UserResponse, TokenResponse]:
        result = await self.db.execute(select(User).where(User.email == data.email.lower()))
        user = result.scalar_one_or_none()
        if user is None or not verify_password(data.password, user.password_hash):
            raise ValueError("Courriel ou mot de passe incorrect")
        if not user.is_active:
            raise ValueError("Compte désactivé")

        tokens = TokenResponse(
            access_token=create_access_token(user.id, {"role": user.role.value}),
            refresh_token=create_refresh_token(user.id),
        )
        return UserResponse.model_validate(user), tokens

    async def get_me(self, user: User) -> UserResponse:
        return UserResponse.model_validate(user)

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        try:
            user_id = verify_refresh_token(refresh_token)
        except JWTError as exc:
            raise ValueError("Jeton de rafraîchissement invalide ou expiré") from exc

        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None or not user.is_active:
            raise ValueError("Utilisateur introuvable ou inactif")

        return TokenResponse(
            access_token=create_access_token(user.id, {"role": user.role.value}),
            refresh_token=create_refresh_token(user.id),
        )

    async def complete_onboarding(self, user: User) -> UserResponse:
        user.onboarding_completed = True
        await self.db.commit()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    async def forgot_password(self, email: str) -> None:
        """Always succeeds from caller perspective (no email enumeration)."""
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        user = result.scalar_one_or_none()
        if user is None:
            return

        raw_token = secrets.token_urlsafe(32)
        token = PasswordResetToken(
            user_id=user.id,
            token_hash=self._hash_token(raw_token),
            expires_at=datetime.now(UTC) + RESET_TOKEN_TTL,
        )
        self.db.add(token)
        await self.db.commit()
        await EmailService().send_password_reset(user.email, raw_token)

    async def reset_password(self, token: str, new_password: str) -> None:
        token_hash = self._hash_token(token)
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
            )
        )
        reset = result.scalar_one_or_none()
        if reset is None or reset.expires_at < datetime.now(UTC):
            raise ValueError("Lien invalide ou expiré")

        user = await self.db.get(User, reset.user_id)
        if user is None or not user.is_active:
            raise ValueError("Lien invalide ou expiré")

        user.password_hash = hash_password(new_password)
        reset.used_at = datetime.now(UTC)
        await self.db.commit()
