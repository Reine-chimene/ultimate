import { getCountry } from "@/lib/countries";

export function formatInTimezone(iso: string, timezone: string, city: string): string {
  try {
    const dt = new Date(iso);
    const time = dt.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    });
    return `${time} — heure de ${city}`;
  } catch {
    return new Date(iso).toLocaleString("fr-CA");
  }
}

export function defaultTimezoneForCountry(countryCode: string): string {
  return getCountry(countryCode).defaultTimezone;
}

export function tonightAvailabilityLabel(note: string | null | undefined, timezone: string): string {
  if (note) return note;
  try {
    const now = new Date();
    const formatted = now.toLocaleTimeString("fr-CA", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    });
    return `Disponible jusqu'à 23:30 (${formatted} locale)`;
  } catch {
    return "Disponible ce soir";
  }
}
