// frontend/src/lib/school-year-dates.ts
// Single source of truth for school-year date-picker constraints shared by the
// Create dialog (calendar DatePicker) and the Data Seeder (native <input>).
//
// TICK-INFRA-017: "today" is the SCHOOL day (todayInZone, Asia/Manila), not
// the browser's local day, so a teacher on VPN still gets school-time
// constraints and SSR renders the same minimums as the browser.

import { todayInZone } from "@/utils/datetime.util";

/** Convert "YYYY-MM-DD" to a local Date (midnight) for the DatePicker. */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Local Date for "today" (midnight), for date-only comparisons. */
export function todayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format a Date to "YYYY-MM-DD" for a native date input. */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * "YYYY-MM-DD" label of a picker-local Date. The DatePicker hands us
 * wall-clock Dates (local midnight), so reading the wall-clock parts back is
 * the correct interpretation — never toISOString() here (that shifts the day
 * for every zone east of UTC).
 */
function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Predicate for the calendar DatePicker `disabled` prop on the **start** date:
 * blocks every date strictly before today (today and future stay selectable).
 */
export function startDatePickerDisabled(date: Date): boolean {
  return toYmd(date) < todayInZone();
}

/**
 * `min` value for a native start-date input: cannot select from the past.
 */
export function startDateMin(): string {
  return todayInZone();
}

/**
 * Predicate for the calendar DatePicker `disabled` prop on the **end** date:
 * blocks dates before the chosen start date, and any past date.
 */
export function endDatePickerDisabled(date: Date, startDate?: string): boolean {
  const day = toYmd(date);
  if (day < todayInZone()) return true;
  // startDate is a same-shape "YYYY-MM-DD" string, so plain string order is
  // chronological in every TZ.
  if (startDate) return day < startDate;
  return false;
}

/**
 * `min` value for a native end-date input: at least the start date (or today
 * when no start is chosen yet), so it can never fall in the past.
 */
export function endDateMin(startDate?: string): string {
  const today = todayInZone();
  return startDate && startDate > today ? startDate : today;
}
