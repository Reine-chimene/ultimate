import type { DiscoveryMode, Gender, RelationshipIntention } from "@/types";

export const TAGLINE = "MEET. TONIGHT. CONNECT.";
export const TAGLINE_SECONDARY =
  "La plateforme adulte où le plaisir n'a pas de frontières — rencontrez, connectez-vous, vivez.";
export const TAGLINE_TERTIARY = "Sans tabou. Sans jugement. Partout dans le monde.";

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Homme",
  female: "Femme",
  non_binary: "Non-binaire",
  other: "Autre",
};

export const INTENTION_LABELS: Record<RelationshipIntention, string> = {
  relationship: "Relation sérieuse",
  casual: "Rencontre sans engagement",
  friendship: "Faire connaissance",
  unsure: "Ouvert·e aux possibilités",
  tonight: "Disponible ce soir",
  travel: "Rencontre pendant un voyage",
};

export const DISCOVERY_MODE_LABELS: Record<DiscoveryMode, string> = {
  near_me: "Près de moi",
  worldwide: "Monde entier",
  travel: "Voyage",
};

export const DISCOVERY_MODE_DESCRIPTIONS: Record<DiscoveryMode, string> = {
  near_me: "Profils dans votre pays",
  worldwide: "Explorez le monde — gratuit pour tous",
  travel: "Rencontres à votre destination",
};

export const PREMIUM_PLANS = [
  { id: "1m", durationMonths: 1, price: 19.99, label: "1 mois", popular: false },
  { id: "3m", durationMonths: 3, price: 44.99, label: "3 mois", popular: true },
  { id: "6m", durationMonths: 6, price: 69.99, label: "6 mois", popular: false },
] as const;

export const FREE_FEATURES = [
  "Parcourir les profils",
  "Monde entier gratuit",
  "Clic-Match (5 interactions/jour)",
  "Messagerie limitée",
  "Albums privés (demander l'accès)",
];

export const PREMIUM_FEATURES = [
  "25 interactions par jour",
  "Messagerie illimitée",
  "Recherche avancée (photo, en ligne, distance)",
  "Mode Voyage",
  "Voir qui vous a visité",
  "Mode Incognito",
  "Accès complet aux albums privés",
];

export const VIP_GOLD_FEATURES = [
  "Tout Premium inclus",
  "Visibilité maximale dans les recherches",
  "Recevoir des messages de tous les membres",
  "Interactions illimitées",
  "Salons live (Phase 3)",
];

export const MEMBERSHIP_TIERS = [
  { id: "free", name: "Gratuit", price: "0 $", highlight: false, features: FREE_FEATURES },
  { id: "premium", name: "Premium", price: "19,99 $/mois", highlight: true, features: PREMIUM_FEATURES },
  { id: "vip", name: "VIP Gold", price: "Sur demande", highlight: false, features: VIP_GOLD_FEATURES },
] as const;

export const INTEREST_CATEGORY_LABELS: Record<string, string> = {
  outings: "Sorties",
  travel: "Voyages",
  food: "Gastronomie",
  sport: "Sport",
  music: "Musique",
  culture: "Culture",
  lifestyle: "Lifestyle",
  dating: "Rencontres",
  relationship: "Relation",
  friendship: "Amitié",
  affinities: "Affinités",
  preferences: "Préférences personnelles",
};

/** @deprecated Use GET /profiles/interests/catalog via InterestSelector */
export const INTEREST_CATALOG: Record<string, string[]> = {
  outings: ["Restaurants", "Bars", "Soirées", "Sorties en ville"],
  travel: ["Voyage", "Escapades", "Découverte", "Road trip"],
  food: ["Gastronomie", "Cuisine", "Vin", "Cafés"],
  sport: ["Fitness", "Randonnée", "Yoga", "Sports d'équipe"],
  music: ["Concerts", "Festivals", "DJ", "Musique live"],
  culture: ["Art", "Cinéma", "Théâtre", "Musées"],
  lifestyle: ["Mode", "Bien-être", "Design", "Lifestyle"],
  dating: ["Rencontres", "Flirt", "Connexion", "Chemistry"],
  relationship: ["Relation", "Couple", "Engagement", "Sérieux"],
  friendship: ["Amitié", "Social", "Networking", "Groupe"],
  affinities: ["Affinités", "Compatibilité", "Valeurs", "Humour"],
  preferences: ["Préférences", "Ouvert d'esprit", "Discrétion", "Authenticité"],
};

export const INTEREST_SUGGESTIONS = [
  "Voyage",
  "Gastronomie",
  "Art",
  "Musique",
  "Sport",
  "Cinéma",
  "Lecture",
  "Danse",
  "Nature",
  "Photographie",
  "Mode",
  "Yoga",
];

export const LANDING_DEMO_PROFILES = [
  {
    name: "Sarah",
    age: 29,
    city: "Paris",
    country: "FR",
    flag: "🇫🇷",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
    intention: "Faire connaissance",
  },
  {
    name: "James",
    age: 34,
    city: "New York",
    country: "US",
    flag: "🇺🇸",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600",
    intention: "Relation sérieuse",
  },
  {
    name: "Sophie",
    age: 32,
    city: "Montréal",
    country: "CA",
    flag: "🇨🇦",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600",
    intention: "Relation sérieuse",
  },
  {
    name: "Amina",
    age: 30,
    city: "Yaoundé",
    country: "CM",
    flag: "🇨🇲",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600",
    intention: "Disponible ce soir",
  },
];

export const MEETING_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Accepté",
  rejected: "Refusé",
  cancelled: "Annulé",
};
