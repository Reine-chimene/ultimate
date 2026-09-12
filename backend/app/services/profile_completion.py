from app.models.profile import Profile
from app.models.user import User
from app.schemas.connections import ProfileCompletionResponse


def compute_profile_completion(user: User, profile: Profile) -> ProfileCompletionResponse:
    items: list[dict] = []
    missing: list[str] = []
    points = 0
    total = 5

    has_photo = len(profile.photos) > 0
    items.append({"key": "photo", "label": "Photo", "done": has_photo})
    if has_photo:
        points += 1
    else:
        missing.append("Ajoutez une photo de profil.")

    has_bio = bool(profile.bio and len(profile.bio.strip()) >= 80)
    items.append({"key": "bio", "label": "Bio (80+ caractères)", "done": has_bio})
    if has_bio:
        points += 1
    else:
        missing.append("Rédigez une bio d'au moins 80 caractères.")

    has_intention = profile.relationship_intention is not None
    items.append({"key": "intention", "label": "Intention", "done": has_intention})
    if has_intention:
        points += 1
    else:
        missing.append("Sélectionnez votre intention.")

    has_interests = len(profile.interests) >= 3
    items.append({"key": "interests", "label": "3 intérêts", "done": has_interests})
    if has_interests:
        points += 1
    else:
        needed = max(0, 3 - len(profile.interests))
        missing.append(f"Ajoutez {needed} intérêt{'s' if needed > 1 else ''} pour compléter votre profil.")

    has_prefs = bool(profile.looking_for_genders)
    items.append({"key": "preferences", "label": "Préférences", "done": has_prefs})
    if has_prefs:
        points += 1
    else:
        missing.append("Définissez vos préférences de recherche.")

    percent = int((points / total) * 100)
    return ProfileCompletionResponse(
        percent=percent,
        is_complete=percent == 100,
        missing=missing,
        items=items,
    )
