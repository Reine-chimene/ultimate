from datetime import date

from app.models.enums import Gender, RelationshipIntention
from app.models.profile import Profile
from app.models.user import User

GENDER_LABELS_FR = {
    Gender.MALE: "Homme",
    Gender.FEMALE: "Femme",
    Gender.NON_BINARY: "Non-binaire",
    Gender.OTHER: "Autre",
}

INTENTION_LABELS_FR = {
    RelationshipIntention.RELATIONSHIP: "Relation sérieuse",
    RelationshipIntention.CASUAL: "Rencontre sans engagement",
    RelationshipIntention.FRIENDSHIP: "Faire connaissance",
    RelationshipIntention.UNSURE: "Ouvert·e aux possibilités",
    RelationshipIntention.TONIGHT: "Disponible ce soir",
    RelationshipIntention.TRAVEL: "Rencontre pendant un voyage",
}


def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


COMPATIBLE_INTENTIONS: dict[RelationshipIntention, set[RelationshipIntention]] = {
    RelationshipIntention.RELATIONSHIP: {
        RelationshipIntention.RELATIONSHIP,
        RelationshipIntention.FRIENDSHIP,
        RelationshipIntention.UNSURE,
    },
    RelationshipIntention.CASUAL: {
        RelationshipIntention.CASUAL,
        RelationshipIntention.TONIGHT,
        RelationshipIntention.UNSURE,
    },
    RelationshipIntention.FRIENDSHIP: {
        RelationshipIntention.FRIENDSHIP,
        RelationshipIntention.RELATIONSHIP,
        RelationshipIntention.TRAVEL,
        RelationshipIntention.UNSURE,
    },
    RelationshipIntention.UNSURE: {
        RelationshipIntention.RELATIONSHIP,
        RelationshipIntention.CASUAL,
        RelationshipIntention.FRIENDSHIP,
        RelationshipIntention.UNSURE,
        RelationshipIntention.TONIGHT,
        RelationshipIntention.TRAVEL,
    },
    RelationshipIntention.TONIGHT: {
        RelationshipIntention.TONIGHT,
        RelationshipIntention.CASUAL,
        RelationshipIntention.UNSURE,
    },
    RelationshipIntention.TRAVEL: {
        RelationshipIntention.TRAVEL,
        RelationshipIntention.FRIENDSHIP,
        RelationshipIntention.CASUAL,
        RelationshipIntention.UNSURE,
    },
}


def _intention_matches_preference(
    candidate_intention: RelationshipIntention,
    seeker_preferences: list[RelationshipIntention],
) -> bool:
    if not seeker_preferences:
        return True
    if candidate_intention in seeker_preferences:
        return True
    for pref in seeker_preferences:
        if candidate_intention in COMPATIBLE_INTENTIONS.get(pref, set()):
            return True
    return False


def _one_direction_compatible(
    seeker_user: User,
    seeker_profile: Profile,
    candidate_user: User,
    candidate_profile: Profile,
) -> bool:
    candidate_age = calculate_age(candidate_user.date_of_birth)

    if not seeker_profile.looking_for_genders:
        return False
    if candidate_user.gender not in seeker_profile.looking_for_genders:
        return False

    if not (seeker_profile.min_age <= candidate_age <= seeker_profile.max_age):
        return False

    if seeker_profile.preferred_countries:
        if candidate_user.country.upper() not in {c.upper() for c in seeker_profile.preferred_countries}:
            return False

    if not _intention_matches_preference(
        candidate_profile.relationship_intention,
        seeker_profile.preferred_intentions or [],
    ):
        return False

    return True


def is_compatible(
    user_a: User,
    profile_a: Profile,
    user_b: User,
    profile_b: Profile,
) -> bool:
    return _one_direction_compatible(user_a, profile_a, user_b, profile_b) and _one_direction_compatible(
        user_b, profile_b, user_a, profile_a
    )


def get_compatibility_indicators(
    current_user: User,
    current_profile: Profile,
    candidate_user: User,
    candidate_profile: Profile,
) -> list[str]:
    indicators: list[str] = []

    if candidate_user.gender in current_profile.looking_for_genders:
        indicators.append(GENDER_LABELS_FR.get(candidate_user.gender, candidate_user.gender.value))

    age = calculate_age(candidate_user.date_of_birth)
    if current_profile.min_age <= age <= current_profile.max_age:
        indicators.append(f"{age} ans")

    intention_label = INTENTION_LABELS_FR.get(
        candidate_profile.relationship_intention,
        candidate_profile.relationship_intention.value,
    )
    if _intention_matches_preference(
        candidate_profile.relationship_intention,
        current_profile.preferred_intentions or [],
    ):
        indicators.append(intention_label)

    if current_user.country == candidate_user.country:
        indicators.append(candidate_user.city)

    return indicators[:4]


def calculate_compatibility(
    current_user: User,
    current_profile: Profile,
    candidate_user: User,
    candidate_profile: Profile,
) -> float:
    if not is_compatible(current_user, current_profile, candidate_user, candidate_profile):
        return 0.0

    score = 40.0
    max_score = 100.0

    current_age = calculate_age(current_user.date_of_birth)
    candidate_age = calculate_age(candidate_user.date_of_birth)

    if current_user.country == candidate_user.country:
        score += 8
        if current_user.city.lower() == candidate_user.city.lower():
            score += 10
    else:
        score += 5

    if current_profile.relationship_intention == candidate_profile.relationship_intention:
        score += 12
    elif candidate_profile.relationship_intention in COMPATIBLE_INTENTIONS.get(
        current_profile.relationship_intention, set()
    ):
        score += 8

    current_interests = {i.name.lower() for i in current_profile.interests}
    candidate_interests = {i.name.lower() for i in candidate_profile.interests}
    if current_interests and candidate_interests:
        shared = current_interests & candidate_interests
        union = current_interests | candidate_interests
        score += (len(shared) / len(union)) * 15

    if candidate_age and current_profile.min_age <= candidate_age <= current_profile.max_age:
        score += 5
    if current_age and candidate_profile.min_age <= current_age <= candidate_profile.max_age:
        score += 5

    return round(min(score, max_score), 1)
