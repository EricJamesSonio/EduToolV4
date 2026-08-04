import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Responsive grid recipes for card lists.
 *
 * Mobile is 2-up so cards stay wide enough for titles/metadata, then scales
 * up at lg/xl. Stat/indicator counters that should stay 3-up (e.g. dashboards)
 * must NOT use these — keep their explicit `grid-cols-3` base.
 */
export function cardGridClass(count: number): string {
  const gap = "gap-3 sm:gap-4";
  if (count <= 1) return `grid-cols-1 ${gap}`;
  if (count <= 3) return `grid-cols-2 lg:grid-cols-3 ${gap}`;
  return `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${gap}`;
}

export function cardListGridClass(): string {
  return `grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3`;
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
