export type PreferredLanguage = "fr" | "en" | "es" | "pt";

export const SUPPORTED_LANGUAGES: { code: PreferredLanguage; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export function normalizeDiscoveryMode(mode: string | null | undefined): "near_me" | "worldwide" | "travel" {
  if (mode === "international" || mode === "worldwide") return "worldwide";
  if (mode === "travel") return "travel";
  return "near_me";
}
