import { WORLD_COUNTRIES, WORLD_FLAGS, type WorldCountry } from "./world-countries";

export type CountryOption = WorldCountry;

export const COUNTRIES: CountryOption[] = WORLD_COUNTRIES;

export function getCountry(code: string): CountryOption {
  return (
    COUNTRIES.find((c) => c.code === code.toUpperCase()) ?? {
      code: code.toUpperCase(),
      name: code.toUpperCase(),
      nameFr: code.toUpperCase(),
      flag: "🌍",
      defaultTimezone: "UTC",
      region: "europe",
    }
  );
}

export function locationLabel(city: string, countryCode: string): string {
  const c = getCountry(countryCode);
  return `${city}, ${c.nameFr} ${c.flag}`;
}

export { WORLD_FLAGS };

export function defaultTimezoneForCountry(countryCode: string): string {
  return getCountry(countryCode).defaultTimezone;
}
