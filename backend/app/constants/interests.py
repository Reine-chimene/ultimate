from app.models.enums import InterestCategory

INTEREST_CATALOG: dict[str, list[str]] = {
    InterestCategory.OUTINGS.value: ["Restaurants", "Bars", "Soirées", "Sorties en ville"],
    InterestCategory.TRAVEL.value: ["Voyage", "Escapades", "Découverte", "Road trip"],
    InterestCategory.FOOD.value: ["Gastronomie", "Cuisine", "Vin", "Cafés"],
    InterestCategory.SPORT.value: ["Fitness", "Randonnée", "Yoga", "Sports d'équipe"],
    InterestCategory.MUSIC.value: ["Concerts", "Festivals", "DJ", "Musique live"],
    InterestCategory.CULTURE.value: ["Art", "Cinéma", "Théâtre", "Musées"],
    InterestCategory.LIFESTYLE.value: ["Mode", "Bien-être", "Design", "Lifestyle"],
    InterestCategory.DATING.value: ["Rencontres", "Flirt", "Connexion", "Chemistry"],
    InterestCategory.RELATIONSHIP.value: ["Relation", "Couple", "Engagement", "Sérieux"],
    InterestCategory.FRIENDSHIP.value: ["Amitié", "Social", "Networking", "Groupe"],
    InterestCategory.AFFINITIES.value: ["Affinités", "Compatibilité", "Valeurs", "Humour"],
    InterestCategory.PREFERENCES.value: ["Préférences", "Ouvert d'esprit", "Discrétion", "Authenticité"],
}

ALL_INTEREST_LABELS: set[str] = {label for labels in INTEREST_CATALOG.values() for label in labels}
