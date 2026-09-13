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

/** Illustrations stock — style JALF, identité Ultimate (Unsplash). */
export const LANDING_HERO_IMAGE =
  "https://images.unsplash.com/photo-1516589178581-6d783895a9e2?w=1600&q=80";

export const LANDING_PILLARS = [
  {
    id: "tonight",
    title: "Rencontres immédiates",
    subtitle: "Ce soir",
    desc: "Changez votre statut à « Disponible » et voyez qui est prêt·e à vous rencontrer maintenant, près de chez vous ou en voyage.",
    href: "/ce-soir",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    live: true,
  },
  {
    id: "feed",
    title: "Fil communautaire",
    subtitle: "Partage & connexion",
    desc: "Publiez, commentez, aimez — une communauté adulte ouverte d'esprit qui partage ses envies sans filtre.",
    href: "/fil",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    live: true,
  },
  {
    id: "messages",
    title: "Messagerie privée",
    subtitle: "DM sans tabou",
    desc: "Chats privés, albums photos et vidéos. Amenez votre chimie au niveau supérieur en toute discrétion.",
    href: "/messages",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    live: true,
  },
  {
    id: "private",
    title: "Contenu privé",
    subtitle: "Photos & vidéos",
    desc: "Albums privés avec contrôle d'accès. Partagez vos moments les plus intimes avec qui vous choisissez.",
    href: "/mon-profil/albums-prives",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80",
    live: true,
  },
  {
    id: "couples",
    title: "Profils couples",
    subtitle: "Duo & fantaisies",
    desc: "Un compte, deux personnes. Sélectionnez vos fantaisies et préférences adultes dès l'inscription.",
    href: "/inscription",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80",
    live: true,
  },
  {
    id: "live",
    title: "Ultimate Live",
    subtitle: "Webcams · Phase 3",
    desc: "Salons live et appels vidéo — bientôt disponible pour les membres Premium et VIP Gold.",
    href: "/premium",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
    live: false,
  },
] as const;

export const LANDING_TRUST = [
  { title: "Navigation discrète", desc: "Contrôlez qui voit votre activité sur la plateforme." },
  { title: "Contenu privé", desc: "Vous décidez qui accède à vos photos et vidéos." },
  { title: "Expérience anonyme", desc: "Votre vie privée reste séparée de votre vie ULTIMATE." },
  { title: "Identité protégée", desc: "Pseudonyme public — votre vrai nom reste privé." },
  { title: "Compte indépendant", desc: "Aucun lien avec vos réseaux sociaux personnels." },
  { title: "Paramètres de confidentialité", desc: "Visibilité en ligne, incognito et visiteurs à votre guise." },
] as const;

export const LANDING_TESTIMONIALS = [
  {
    quote: "Inscrite en revenant du travail, j'avais une connexion le soir même. Ici, les gens savent ce qu'ils veulent.",
    author: "Luna_MTL",
    age: 27,
  },
  {
    quote: "Ma copine et moi cherchions à pimenter nos soirées. Profil couple en 24h, communauté respectueuse et ouverte.",
    author: "DuoLibre",
    age: 34,
  },
  {
    quote: "Le Monde entier gratuit, c'est réel. J'ai exploré des profils à Paris, Montréal et Dakar sans payer.",
    author: "Voyageur_91",
    age: 35,
  },
  {
    quote: "Le fil communautaire et les albums privés — enfin une app adulte complète, pas juste du swipe.",
    author: "MrSmooth",
    age: 38,
  },
] as const;

export const LANDING_STEPS = [
  {
    step: "1",
    title: "Inscrivez-vous gratuitement",
    desc: "Quelques clics, sans carte de crédit. Célibataire ou couple — choisissez votre type de profil.",
  },
  {
    step: "2",
    title: "Complétez votre profil",
    desc: "Photos, bio, fantaisies et préférences. Votre pseudonyme, votre rythme.",
  },
  {
    step: "3",
    title: "Explorez le monde",
    desc: "Découvrir, Fil, Ce soir, Monde entier — connectez-vous avec des personnes qui partagent vos envies.",
  },
] as const;

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
