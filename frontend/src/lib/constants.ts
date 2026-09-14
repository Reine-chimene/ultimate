import type { DiscoveryMode, Gender, RelationshipIntention } from "@/types";

export const TAGLINE = "MEET. TONIGHT. FUCK THE TABOOS.";
export const TAGLINE_SECONDARY =
  "Rencontres crues, fantasmes assumés, corps à corps — sans filtre, sans jugement, sans limite (18+).";
export const TAGLINE_TERTIARY = "Filles, garçons, couples — chaud·e·s et disponibles. Monde entier gratuit.";

/** Illustrations marketing générées — /public/marketing/ (PNG). */
export const MARKETING_MEDIA = {
  hero: "/marketing/hero.png",
  profiles: [
    "/marketing/profile-1.png",
    "/marketing/profile-2.png",
    "/marketing/profile-3.png",
    "/marketing/profile-4.png",
  ],
  pillars: {
    tonight: "/marketing/pillar-tonight.png",
    feed: "/marketing/pillar-feed.png",
    messages: "/marketing/pillar-messages.png",
    private: "/marketing/pillar-private.png",
    couples: "/marketing/pillar-couples.png",
    live: "/marketing/pillar-live.png",
  },
} as const;

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

/** Repli temporaire — remplacé dès que vous déposez les JPG dans /public/marketing/ */
export const MARKETING_FALLBACKS = {
  hero: "https://images.unsplash.com/photo-1518199266791-5375a57590ae?w=1600&q=80",
  profiles: [
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953b06a399?w=600&q=80",
  ],
  pillars: {
    tonight: "https://images.unsplash.com/photo-1547036967-7833c4055eba?w=800&q=80",
    feed: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80",
    messages: "https://images.unsplash.com/photo-1511396060206-85a2afad1672?w=800&q=80",
    private: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80",
    couples: "https://images.unsplash.com/photo-1516589178581-6d783895a9e2?w=800&q=80",
    live: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
  },
} as const;

export const LANDING_HERO_IMAGE = MARKETING_MEDIA.hero;
export const LANDING_HERO_FALLBACK = MARKETING_FALLBACKS.hero;

export const LANDING_PILLARS = [
  {
    id: "tonight",
    title: "Baise ce soir",
    subtitle: "Dispo · maintenant",
    desc: "Qui veut baiser ce soir ? Statut activé, intention claire — hôtel, chez toi, verre puis action. Pas de blabla.",
    href: "/ce-soir",
    image: MARKETING_MEDIA.pillars.tonight,
    fallback: MARKETING_FALLBACKS.pillars.tonight,
    live: true,
  },
  {
    id: "feed",
    title: "Fil sans filtre",
    subtitle: "Kinks & fantasmes",
    desc: "Posts crus, photos suggestives, fantasmes assumés. La communauté montre ce qui l'excite — pas de censure.",
    href: "/fil",
    image: MARKETING_MEDIA.pillars.feed,
    fallback: MARKETING_FALLBACKS.pillars.feed,
    live: true,
  },
  {
    id: "messages",
    title: "DM sales",
    subtitle: "Nudes & vidéos",
    desc: "Messages privés, nudes, clips. Du dirty talk au rendez-vous en quelques minutes.",
    href: "/messages",
    image: MARKETING_MEDIA.pillars.messages,
    fallback: MARKETING_FALLBACKS.pillars.messages,
    live: true,
  },
  {
    id: "private",
    title: "Albums privés",
    subtitle: "Contenu X",
    desc: "Tes photos et vidéos les plus hard — tu choisis qui a accès. Exhibition, lingerie, scènes complètes.",
    href: "/mon-profil/albums-prives",
    image: MARKETING_MEDIA.pillars.private,
    fallback: MARKETING_FALLBACKS.pillars.private,
    live: true,
  },
  {
    id: "couples",
    title: "Couples & trios",
    subtitle: "Duo · swing · +1",
    desc: "Profil couple, fantasmes cochés, recherche duo ou solo. Swing, candaulisme, plans à trois — tout est permis entre consentants.",
    href: "/inscription",
    image: MARKETING_MEDIA.pillars.couples,
    fallback: MARKETING_FALLBACKS.pillars.couples,
    live: true,
  },
  {
    id: "live",
    title: "Ultimate Live",
    subtitle: "Webcam · direct",
    desc: "Salons live, show en cam. VIP Gold diffuse en exclusif — vidéo temps réel en cours d'ajout.",
    href: "/live",
    image: MARKETING_MEDIA.pillars.live,
    fallback: MARKETING_FALLBACKS.pillars.live,
    live: true,
  },
] as const;

/** Intentions rapides pour « Ce soir » — une touche et c'est publié. */
export const TONIGHT_INTENT_CHIPS = [
  "Baise ce soir",
  "Hôtel maintenant",
  "Chez moi · dispo",
  "Couple cherche +1",
  "Oral / préliminaires",
  "Plan cul discret",
  "Show cam avant",
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
    quote: "Connectée à 22h, chez lui à minuit. Pas de jeu de séduction — ici on dit ce qu'on veut et on le fait.",
    author: "Luna_Sale",
    age: 27,
  },
  {
    quote: "Profil couple, fantasmes cochés, trio le week-end suivant. Enfin une app où on peut être vraiment pervers.",
    author: "DuoLibre",
    age: 34,
  },
  {
    quote: "Albums privés + nudes en DM. Monde entier gratuit — j'ai trouvé des partenaires à Abidjan et à Lyon.",
    author: "Voyageur_91",
    age: 35,
  },
  {
    quote: "Ce soir, fil, live — tout est là. JALF vibes mais plus moderne. Les mecs envoient pas que des bonjour.",
    author: "MrHard",
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
    photo: MARKETING_MEDIA.profiles[0],
    fallback: MARKETING_FALLBACKS.profiles[0],
    intention: "Dispo ce soir · lingerie",
  },
  {
    name: "Marcus",
    age: 34,
    city: "New York",
    country: "US",
    flag: "🇺🇸",
    photo: MARKETING_MEDIA.profiles[1],
    fallback: MARKETING_FALLBACKS.profiles[1],
    intention: "Boxer · chaud maintenant",
  },
  {
    name: "DuoLibre",
    age: 32,
    city: "Montréal",
    country: "CA",
    flag: "🇨🇦",
    photo: MARKETING_MEDIA.profiles[2],
    fallback: MARKETING_FALLBACKS.profiles[2],
    intention: "Couple · cherche trio",
  },
  {
    name: "Amina",
    age: 30,
    city: "Yaoundé",
    country: "CM",
    flag: "🇨🇲",
    photo: MARKETING_MEDIA.profiles[3],
    fallback: MARKETING_FALLBACKS.profiles[3],
    intention: "Nude privé · ce soir",
  },
];

export const MEETING_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  accepted: "Accepté",
  rejected: "Refusé",
  cancelled: "Annulé",
};
