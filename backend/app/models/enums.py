import enum

from sqlalchemy import Enum as SAEnum


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    OTHER = "other"


class RelationshipIntention(str, enum.Enum):
    RELATIONSHIP = "relationship"
    CASUAL = "casual"
    FRIENDSHIP = "friendship"
    UNSURE = "unsure"


class MeetingStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"
    VIP = "vip"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class PaymentStatus(str, enum.Enum):
    SIMULATED = "simulated"
    COMPLETED = "completed"
    FAILED = "failed"


def pg_enum(enum_class: type[enum.Enum], name: str, *, create_type: bool = True) -> SAEnum:
    return SAEnum(
        enum_class,
        name=name,
        values_callable=lambda members: [member.value for member in members],
        create_type=create_type,
    )
