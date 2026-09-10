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
