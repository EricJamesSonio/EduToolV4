import {
  format,
  formatDistanceToNow,
  parseISO,
  isValid,
} from "date-fns";

type DateInput = Date | string | number;

/**
 * Normalizes various date inputs into a Date object.
 * Returns null for invalid inputs.
 */
function toDate(input: DateInput): Date | null {
  if (input instanceof Date) return isValid(input) ? input : null;
  if (typeof input === "number") {
    const d = new Date(input);
    return isValid(d) ? d : null;
  }
  if (typeof input === "string") {
    // Try ISO parse first, then native Date
    const iso = parseISO(input);
    if (isValid(iso)) return iso;
    const d = new Date(input);
    return isValid(d) ? d : null;
  }
  return null;
}

/**
 * Formats a date as "Mar 26, 2026"
 */
export function formatDate(input: DateInput): string {
  const d = toDate(input);
  if (!d) return "—";
  return format(d, "MMM d, yyyy");
}

/**
 * Formats a date as "Mar 26, 2026 2:00 PM"
 */
export function formatDateTime(input: DateInput): string {
  const d = toDate(input);
  if (!d) return "—";
  return format(d, "MMM d, yyyy h:mm a");
}

/**
 * Returns a relative time string, e.g. "2 hours ago", "in 3 days"
 */
export function relativeTime(input: DateInput): string {
  const d = toDate(input);
  if (!d) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Formats a date as "2:00 PM"
 */
export function formatTime(input: DateInput): string {
  const d = toDate(input);
  if (!d) return "—";
  return format(d, "h:mm a");
}