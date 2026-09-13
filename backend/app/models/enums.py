import enum

from sqlalchemy import Enum as SAEnum


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    OTHER = "other"


class AccountType(str, enum.Enum):
    SINGLE = "single"
    COUPLE = "couple"


class PrivateAlbumMediaType(str, enum.Enum):
    PHOTO = "photo"
    VIDEO = "video"


class RelationshipIntention(str, enum.Enum):
    RELATIONSHIP = "relationship"
    CASUAL = "casual"
    FRIENDSHIP = "friendship"
    UNSURE = "unsure"
    TONIGHT = "tonight"
    TRAVEL = "travel"


class DiscoveryMode(str, enum.Enum):
    NEAR_ME = "near_me"
    WORLDWIDE = "worldwide"
    TRAVEL = "travel"

    @classmethod
    def _missing_(cls, value: object):
        if value == "international":
            return cls.WORLDWIDE
        return None


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


class ConnectionRequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class ConnectionState(str, enum.Enum):
    NONE = "none"
    INTEREST_SENT = "interest_sent"
    INTEREST_RECEIVED = "interest_received"
    PENDING_SENT = "pending_sent"
    PENDING_RECEIVED = "pending_received"
    CONNECTED = "connected"
    DECLINED = "declined"
    BLOCKED = "blocked"


class OnlineStatus(str, enum.Enum):
    ONLINE = "online"
    RECENTLY_ACTIVE = "recently_active"
    OFFLINE = "offline"


class PrivateAlbumAccessStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVOKED = "revoked"


class PrivateAlbumPhotoModerationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InterestCategory(str, enum.Enum):
    OUTINGS = "outings"
    TRAVEL = "travel"
    FOOD = "food"
    SPORT = "sport"
    MUSIC = "music"
    CULTURE = "culture"
    LIFESTYLE = "lifestyle"
    DATING = "dating"
    RELATIONSHIP = "relationship"
    FRIENDSHIP = "friendship"
    AFFINITIES = "affinities"
    PREFERENCES = "preferences"


def pg_enum(enum_class: type[enum.Enum], name: str, *, create_type: bool = True) -> SAEnum:
    return SAEnum(
        enum_class,
        name=name,
        values_callable=lambda members: [member.value for member in members],
        create_type=create_type,
    )
