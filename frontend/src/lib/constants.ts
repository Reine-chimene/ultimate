import type { DiscoveryMode, Gender, RelationshipIntention } from "@/types";

export const TAGLINE = "MEET. TONIGHT. CONNECT.";
export const TAGLINE_SECONDARY =
  "Rencontres adultes sans filtre — désirs assumés, fantaisies partagées, plaisir immédiat.";
export const TAGLINE_TERTIARY = "Coquin·e, pervers·e, curieux·se — bienvenue chez vous. 18+ · Monde entier.";

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
  "Salons live & diffusion VIP",
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

/** Illustrations stock sensuelles — identité Ultimate (Unsplash, 18+ marketing). */
export const LANDING_HERO_IMAGE =
  "https://images.unsplash.com/photo-1518199266791-5375a57590ae?w=1600&q=80";

export const LANDING_PILLARS = [
  {
    id: "tonight",
    title: "Rencontres immédiates",
    subtitle: "Ce soir · maintenant",
    desc: "Qui est chaud·e ce soir ? Activez votre statut, choisissez votre intention — rencontre, verre coquin ou plus — et connectez-vous tout de suite.",
    href: "/ce-soir",
    image: "https://images.unsplash.com/photo-1547036967-7833c4055eba?w=800&q=80",
    live: true,
  },
  {
    id: "feed",
    title: "Fil communautaire",
    subtitle: "Désirs & fantaisies",
    desc: "Publiez sans filtre, commentez, likez — la communauté partage ce qui l'excite vraiment, sans pudibonderie.",
    href: "/fil",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80",
    live: true,
  },
  {
    id: "messages",
    title: "Messagerie privée",
    subtitle: "DM coquins",
    desc: "Chats privés, photos et vidéos intimes. Passez du flirt à l'action en toute discrétion.",
    href: "/messages",
    image: "https://images.unsplash.com/photo-1511396060206-85a2afad1672?w=800&q=80",
    live: true,
  },
  {
    id: "private",
    title: "Contenu privé",
    subtitle: "Albums hot",
    desc: "Photos et vidéos privées — vous décidez qui voit votre côté le plus sensuel.",
    href: "/mon-profil/albums-prives",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80",
    live: true,
  },
  {
    id: "couples",
    title: "Profils couples",
    subtitle: "Duo & fantasmes",
    desc: "Un compte, deux corps. Fantaisies, préférences et envies assumées — swing, trio, exhibition…",
    href: "/inscription",
    image: "https://images.unsplash.com/photo-1516589178581-6d783895a9e2?w=800&q=80",
    live: true,
  },
  {
    id: "live",
    title: "Ultimate Live",
    subtitle: "Salons en direct",
    desc: "Rejoignez ou lancez un salon live. VIP Gold peut diffuser en exclusif — la vidéo arrive très bientôt.",
    href: "/live",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
    live: true,
  },
] as const;

/** Intentions rapides pour « Ce soir » — une touche et c'est publié. */
export const TONIGHT_INTENT_CHIPS = [
  "Rencontre maintenant",
  "Verre coquin",
  "Hôtel / chez moi",
  "Juste discuter d'abord",
  "Couple cherche duo",
  "Fantaisie ce soir",
  "Discret · dispo tard",
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
    name: "Luna",
    age: 29,
    city: "Paris",
    country: "FR",
    flag: "🇫🇷",
    photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
    intention: "Disponible ce soir · coquine",
  },
  {
    name: "Marcus",
    age: 34,
    city: "New York",
    country: "US",
    flag: "🇺🇸",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
    intention: "Sans engagement · maintenant",
  },
  {
    name: "DuoLibre",
    age: 32,
    city: "Montréal",
    country: "CA",
    flag: "🇨🇦",
    photo: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80",
    intention: "Couple · fantasmes",
  },
  {
    name: "Amina",
    age: 30,
    city: "Yaoundé",
    country: "CM",
    flag: "🇨🇲",
    photo: "https://images.unsplash.com/photo-1531746020798-e6953b06a399?w=600&q=80",
    intention: "Verre coquin ce soir",
  },
];

export const MEETING_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Accepté",
  rejected: "Refusé",
  cancelled: "Annulé",
};
