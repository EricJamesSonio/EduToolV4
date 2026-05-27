import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cardGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count <= 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
}

const CARD_COLORS = [
  "icon-structure",
  "icon-utility",
  "icon-educator",
  "icon-analytics",
  "icon-share",
  "icon-danger",
  "icon-warning",
  "icon-credential",
  "icon-security",
  "icon-people",
] as const;

export function pickCardColor(id: string): string {
  const hash = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CARD_COLORS[hash % CARD_COLORS.length];
}
