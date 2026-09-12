export interface CountryOption {
  code: string;
  name: string;
  nameFr: string;
  flag: string;
  defaultTimezone: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "CA", name: "Canada", nameFr: "Canada", flag: "🇨🇦", defaultTimezone: "America/Toronto" },
  { code: "FR", name: "France", nameFr: "France", flag: "🇫🇷", defaultTimezone: "Europe/Paris" },
  { code: "US", name: "United States", nameFr: "États-Unis", flag: "🇺🇸", defaultTimezone: "America/New_York" },
  { code: "GB", name: "United Kingdom", nameFr: "Royaume-Uni", flag: "🇬🇧", defaultTimezone: "Europe/London" },
  { code: "BE", name: "Belgium", nameFr: "Belgique", flag: "🇧🇪", defaultTimezone: "Europe/Brussels" },
  { code: "CM", name: "Cameroon", nameFr: "Cameroun", flag: "🇨🇲", defaultTimezone: "Africa/Douala" },
];

export function getCountry(code: string): CountryOption {
  return (
    COUNTRIES.find((c) => c.code === code.toUpperCase()) ?? {
      code: code.toUpperCase(),
      name: code.toUpperCase(),
      nameFr: code.toUpperCase(),
      flag: "🌍",
      defaultTimezone: "UTC",
    }
  );
}

export function locationLabel(city: string, countryCode: string): string {
  const c = getCountry(countryCode);
  return `${city}, ${c.nameFr} ${c.flag}`;
}

export const WORLD_FLAGS = COUNTRIES.map((c) => c.flag).join(" ");

export function defaultTimezoneForCountry(countryCode: string): string {
  return getCountry(countryCode).defaultTimezone;
}
