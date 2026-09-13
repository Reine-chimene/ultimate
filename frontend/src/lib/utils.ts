import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateStr: string) {
  return `${formatDate(dateStr)} à ${formatTime(dateStr)}`;
}

export function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return formatDate(dateStr);
}

export function profileDisplayName(profile: { display_name?: string | null; first_name?: string | null }) {
  return profile.display_name || profile.first_name || "Membre";
}

export function getPrimaryPhoto(photos: { url: string; is_primary: boolean }[]) {
  if (!photos.length) return "https://i.pravatar.cc/400?img=12";
  return photos.find((p) => p.is_primary)?.url ?? photos[0].url;
}

export function calculateAge(dateOfBirth: string) {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
