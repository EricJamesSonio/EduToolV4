// frontend/src/lib/school-year-dates.ts
// Single source of truth for school-year date-picker constraints shared by the
// Create dialog (calendar DatePicker) and the Data Seeder (native <input>).

/** Convert "YYYY-MM-DD" to a local Date (midnight). */
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
 * Predicate for the calendar DatePicker `disabled` prop on the **start** date:
 * blocks every date strictly before today (today and future stay selectable).
 */
export function startDatePickerDisabled(date: Date): boolean {
  return date < todayLocal();
}

/**
 * `min` value for a native start-date input: cannot select from the past.
 */
export function startDateMin(): string {
  return toDateInput(todayLocal());
}

/**
 * Predicate for the calendar DatePicker `disabled` prop on the **end** date:
 * blocks dates before the chosen start date, and any past date.
 */
export function endDatePickerDisabled(date: Date, startDate?: string): boolean {
  if (date < todayLocal()) return true;
  if (startDate) return date < parseLocalDate(startDate);
  return false;
}

/**
 * `min` value for a native end-date input: at least the start date (or today
 * when no start is chosen yet), so it can never fall in the past.
 */
export function endDateMin(startDate?: string): string {
  return startDate || startDateMin();
}