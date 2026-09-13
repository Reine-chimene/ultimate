/** Pays supportés — Monde entier (inscription, Ultimate World, landing). */
export interface WorldCountry {
  code: string;
  name: string;
  nameFr: string;
  flag: string;
  defaultTimezone: string;
  region: "americas" | "europe" | "africa" | "asia_pacific" | "caribbean";
}

export const WORLD_COUNTRIES: WorldCountry[] = [
  { code: "CA", name: "Canada", nameFr: "Canada", flag: "🇨🇦", defaultTimezone: "America/Toronto", region: "americas" },
  { code: "US", name: "United States", nameFr: "États-Unis", flag: "🇺🇸", defaultTimezone: "America/New_York", region: "americas" },
  { code: "MX", name: "Mexico", nameFr: "Mexique", flag: "🇲🇽", defaultTimezone: "America/Mexico_City", region: "americas" },
  { code: "BR", name: "Brazil", nameFr: "Brésil", flag: "🇧🇷", defaultTimezone: "America/Sao_Paulo", region: "americas" },
  { code: "FR", name: "France", nameFr: "France", flag: "🇫🇷", defaultTimezone: "Europe/Paris", region: "europe" },
  { code: "BE", name: "Belgium", nameFr: "Belgique", flag: "🇧🇪", defaultTimezone: "Europe/Brussels", region: "europe" },
  { code: "CH", name: "Switzerland", nameFr: "Suisse", flag: "🇨🇭", defaultTimezone: "Europe/Zurich", region: "europe" },
  { code: "LU", name: "Luxembourg", nameFr: "Luxembourg", flag: "🇱🇺", defaultTimezone: "Europe/Luxembourg", region: "europe" },
  { code: "GB", name: "United Kingdom", nameFr: "Royaume-Uni", flag: "🇬🇧", defaultTimezone: "Europe/London", region: "europe" },
  { code: "ES", name: "Spain", nameFr: "Espagne", flag: "🇪🇸", defaultTimezone: "Europe/Madrid", region: "europe" },
  { code: "DE", name: "Germany", nameFr: "Allemagne", flag: "🇩🇪", defaultTimezone: "Europe/Berlin", region: "europe" },
  { code: "IT", name: "Italy", nameFr: "Italie", flag: "🇮🇹", defaultTimezone: "Europe/Rome", region: "europe" },
  { code: "PT", name: "Portugal", nameFr: "Portugal", flag: "🇵🇹", defaultTimezone: "Europe/Lisbon", region: "europe" },
  { code: "NL", name: "Netherlands", nameFr: "Pays-Bas", flag: "🇳🇱", defaultTimezone: "Europe/Amsterdam", region: "europe" },
  { code: "MC", name: "Monaco", nameFr: "Monaco", flag: "🇲🇨", defaultTimezone: "Europe/Monaco", region: "europe" },
  { code: "GP", name: "Guadeloupe", nameFr: "Guadeloupe", flag: "🇬🇵", defaultTimezone: "America/Guadeloupe", region: "caribbean" },
  { code: "MQ", name: "Martinique", nameFr: "Martinique", flag: "🇲🇶", defaultTimezone: "America/Martinique", region: "caribbean" },
  { code: "CM", name: "Cameroon", nameFr: "Cameroun", flag: "🇨🇲", defaultTimezone: "Africa/Douala", region: "africa" },
  { code: "CI", name: "Côte d'Ivoire", nameFr: "Côte d'Ivoire", flag: "🇨🇮", defaultTimezone: "Africa/Abidjan", region: "africa" },
  { code: "SN", name: "Senegal", nameFr: "Sénégal", flag: "🇸🇳", defaultTimezone: "Africa/Dakar", region: "africa" },
  { code: "MA", name: "Morocco", nameFr: "Maroc", flag: "🇲🇦", defaultTimezone: "Africa/Casablanca", region: "africa" },
  { code: "TN", name: "Tunisia", nameFr: "Tunisie", flag: "🇹🇳", defaultTimezone: "Africa/Tunis", region: "africa" },
  { code: "DZ", name: "Algeria", nameFr: "Algérie", flag: "🇩🇿", defaultTimezone: "Africa/Algiers", region: "africa" },
  { code: "AE", name: "UAE", nameFr: "Émirats arabes unis", flag: "🇦🇪", defaultTimezone: "Asia/Dubai", region: "asia_pacific" },
  { code: "AU", name: "Australia", nameFr: "Australie", flag: "🇦🇺", defaultTimezone: "Australia/Sydney", region: "asia_pacific" },
];

export const WORLD_FLAGS = WORLD_COUNTRIES.map((c) => c.flag).join(" ");

export const REGION_LABELS: Record<WorldCountry["region"], string> = {
  americas: "Amériques",
  europe: "Europe",
  africa: "Afrique",
  asia_pacific: "Asie & Océanie",
  caribbean: "Caraïbes",
};
