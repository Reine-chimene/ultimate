FANTASY_CATALOG: dict[str, list[str]] = {
    "ambiance": ["Romantique", "Sensuel", "Coquin", "Intense", "Doux"],
    "experience": ["Roleplay", "Voyeurisme", "Exhibition", "Domination", "Soumission"],
    "contexte": ["Hôtel", "Nature", "Soirée privée", "Voyage", "Surprise"],
    "relation": ["Couple", "Trio", "Groupe", "Rencontre discrète", "Connexion profonde"],
    "style": ["Lent & sensuel", "Passionné", "Explorateur", "Complice", "Aventureux"],
}

ALL_FANTASY_TAGS: set[str] = {tag for tags in FANTASY_CATALOG.values() for tag in tags}
