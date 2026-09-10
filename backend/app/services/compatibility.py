from datetime import date

from app.models.enums import Gender, RelationshipIntention
from app.models.profile import Profile
from app.models.user import User


def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def calculate_compatibility(
    current_user: User,
    current_profile: Profile,
    candidate_user: User,
    candidate_profile: Profile,
) -> float:
    score = 0.0
    max_score = 100.0

    current_age = calculate_age(current_user.date_of_birth)
    candidate_age = calculate_age(candidate_user.date_of_birth)

    if candidate_profile.min_age <= current_age <= candidate_profile.max_age:
        score += 20
    if current_profile.min_age <= candidate_age <= current_profile.max_age:
        score += 20

    if candidate_user.gender in current_profile.looking_for_genders:
        score += 15
    if current_user.gender in candidate_profile.looking_for_genders:
        score += 15

    if current_user.city.lower() == candidate_user.city.lower():
        score += 15

    if current_profile.relationship_intention == candidate_profile.relationship_intention:
        score += 10

    current_interests = {i.name.lower() for i in current_profile.interests}
    candidate_interests = {i.name.lower() for i in candidate_profile.interests}
    if current_interests and candidate_interests:
        shared = current_interests & candidate_interests
        union = current_interests | candidate_interests
        score += (len(shared) / len(union)) * 15

    return round(min(score, max_score), 1)
