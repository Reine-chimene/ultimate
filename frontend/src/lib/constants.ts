import type { Gender, RelationshipIntention } from "@/types";

export const TAGLINE = "MEET • TONIGHT • NO LIMITS";
export const TAGLINE_SECONDARY = "REAL PEOPLE • REAL DESIRES";

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
  unsure: "Rendez-vous",
};

export const PREMIUM_PLANS = [
  {
    id: "1m",
    durationMonths: 1,
    price: 19.99,
    label: "1 mois",
    popular: false,
  },
  {
    id: "3m",
    durationMonths: 3,
    price: 44.99,
    label: "3 mois",
    popular: true,
  },
  {
    id: "6m",
    durationMonths: 6,
    price: 69.99,
    label: "6 mois",
    popular: false,
  },
] as const;

export const PREMIUM_FEATURES = [
  "Plus de profils à découvrir",
  "Filtres avancés",
  "Voir qui vous a aimé",
  "Likes illimités",
  "Visibilité prioritaire",
  "Filtres Ce soir avancés",
];

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
