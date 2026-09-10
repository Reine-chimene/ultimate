from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.enums import Gender, RelationshipIntention, SubscriptionPlan, SubscriptionStatus
from app.models.profile import Profile
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> tuple[UserResponse, TokenResponse]:
        existing = await self.db.execute(select(User).where(User.email == data.email.lower()))
        if existing.scalar_one_or_none():
            raise ValueError("Cet courriel est déjà utilisé")

        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            first_name=data.first_name.strip(),
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            city=data.city.strip(),
        )
        self.db.add(user)
        await self.db.flush()

        opposite_gender = Gender.FEMALE if data.gender == Gender.MALE else Gender.MALE
        profile = Profile(
            user_id=user.id,
            relationship_intention=RelationshipIntention.UNSURE,
            looking_for_genders=[opposite_gender],
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
