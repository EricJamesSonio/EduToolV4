/**
 * TICK-INFRA-017 — single time layer for the frontend.
 *
 * Mirrors `backend/src/commons/utils/datetime.util.ts` (same ORG_TIMEZONE,
 * same semantics). This file is intentionally dependency-free so its output
 * is identical during Vercel SSR (UTC) and in any browser zone.
 *
 * The school timezone is ONE CONSTANT: Asia/Manila. Conversions use
 * ORG_TIMEZONE explicitly — never the browser's zone — so a teacher on a
 * VPN or abroad still means school time.
 *
 * Edge rule (R2): picker value -> UTC ISO happens here, once, via
 * localInputToIso. The backend never converts instants; it only validates
 * and stores.
 *
 * Date-only inputs (type="date") keep sending "YYYY-MM-DD" strings untouched
 * and must never be passed through new Date(...) for display — use
 * formatCalendarDate instead.
 */

export const ORG_TIMEZONE = "Asia/Manila";

/** Matches a trailing "Z" or explicit numeric offset (+08:00, +0800). */
const INSTANT_SUFFIX_RE = /(Z|[+-]\d{2}:?\d{2})$/;

/** Strict "YYYY-MM-DD". */
const CALENDAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Strict picker value "YYYY-MM-DDTHH:mm" (optional ":ss"). */
const LOCAL_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function fail(message: string): never {
  throw new Error(message);
}

function toMs(input: Date | string): number {
  const ms = input instanceof Date ? input.getTime() : new Date(input).getTime();
  if (Number.isNaN(ms)) fail("Invalid date value.");
  return ms;
}

function assertRealDay(year: number, month: number, day: number): void {
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    fail(`Invalid calendar date "${year}-${month}-${day}".`);
  }
}

/**
 * Today's date in the zone as "YYYY-MM-DD". Compare with calendarDateOf()
 * output — never Date vs Date.
 */
export function todayInZone(timeZone: string = ORG_TIMEZONE, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();

function zonedPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = zonedFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    zonedFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): number {
  return Number(parts.find((p) => p.type === type)?.value);
}

/** Offset of `timeZone` at `utcMs`, in milliseconds (wall-clock − UTC). */
function zoneOffsetMs(timeZone: string, utcMs: number): number {
  const parts = zonedPartsFormatter(timeZone).formatToParts(new Date(utcMs));
  const asUtc = Date.UTC(
    partValue(parts, "year"),
    partValue(parts, "month") - 1,
    partValue(parts, "day"),
    partValue(parts, "hour"),
    partValue(parts, "minute"),
    partValue(parts, "second")
  );
  return asUtc - utcMs;
}

/**
 * Resolve a wall-clock time in `timeZone` to its UTC instant. Only the
 * explicit zone and Intl data are consulted — never the process/browser
 * zone — so the result is identical under any TZ.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string = ORG_TIMEZONE): Date {
  if (!CALENDAR_DATE_RE.test(date)) {
    fail(`Invalid calendar date "${date}". Expected "YYYY-MM-DD".`);
  }
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(normalizedTime)) {
    fail(`Invalid wall-clock time "${time}". Expected "HH:mm".`);
  }
  const guess = Date.parse(`${date}T${normalizedTime}Z`);
  if (Number.isNaN(guess)) fail(`Invalid datetime "${date}T${time}".`);
  const firstPass = zoneOffsetMs(timeZone, guess);
  const secondPass = zoneOffsetMs(timeZone, guess - firstPass);
  return new Date(guess - secondPass);
}

/**
 * Interpret a zone-less picker value ("YYYY-MM-DDTHH:mm") in ORG_TIMEZONE
 * and return the UTC ISO string (ends in Z). Send THIS to the API.
 */
export function localInputToIso(value: string): string {
  const match = LOCAL_INPUT_RE.exec(value);
  if (!match) {
    fail(`Invalid datetime-local value "${value}". Expected "YYYY-MM-DDTHH:mm".`);
  }
  const seconds = match[7] ?? "00";
  return zonedTimeToUtc(
    `${match[1]}-${match[2]}-${match[3]}`,
    `${match[4]}:${match[5]}:${seconds}`,
    ORG_TIMEZONE
  ).toISOString();
}

/**
 * Convert a true instant to the ORG_TIMEZONE picker value
 * ("YYYY-MM-DDTHH:mm") for pre-filling edit forms.
 */
export function isoToLocalInput(iso: string | Date): string {
  if (typeof iso === "string" && !INSTANT_SUFFIX_RE.test(iso.trim())) {
    fail(
      `Datetime must be ISO-8601 with "Z" or an explicit offset. Zone-less values like "${iso}" are rejected.`
    );
  }
  const instant = new Date(toMs(iso));
  const parts = zonedPartsFormatter(ORG_TIMEZONE).formatToParts(instant);
  const pad = (type: string): string => String(partValue(parts, type)).padStart(2, "0");
  return `${partValue(parts, "year")}-${pad("month")}-${pad("day")}T${pad("hour")}:${pad("minute")}`;
}

/**
 * Format a true instant for display with an explicit timeZone (defaults to
 * ORG_TIMEZONE) — identical string on SSR and in the browser.
 */
export function formatInZone(
  input: Date | string,
  options?: Intl.DateTimeFormatOptions,
  timeZone: string = ORG_TIMEZONE
): string {
  if (typeof input === "string" && !INSTANT_SUFFIX_RE.test(input.trim())) {
    fail(
      `formatInZone needs a true instant with "Z" or offset; got "${input}". Date-only values use formatCalendarDate.`
    );
  }
  const instant = new Date(toMs(input));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
    timeZone,
  }).format(instant);
}

/**
 * Read a stored kind-B value as its intended "YYYY-MM-DD". Tolerant: adds
 * 12h before taking the UTC date, so both UTC-midnight rows and legacy
 * Manila-midnight rows (16:00Z the previous day) read as the intended day.
 */
export function calendarDateOf(input: Date | string): string {
  return new Date(toMs(input) + 12 * 3_600_000).toISOString().slice(0, 10);
}

/**
 * Store a kind-B "YYYY-MM-DD" as UTC midnight of that date. Pure calendar
 * arithmetic — no zone involved.
 */
export function calendarDateToUtc(ymd: string): Date {
  const match = CALENDAR_DATE_RE.exec(ymd);
  if (!match) fail(`Invalid calendar date "${ymd}". Expected "YYYY-MM-DD".`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  assertRealDay(year, month, day);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Pure calendar arithmetic on "YYYY-MM-DD" (no Date getters, no zone). */
export function addDaysToCalendarDate(ymd: string, days: number): string {
  return new Date(calendarDateToUtc(ymd).getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Start of the zone-calendar day containing `input`, as a UTC instant. */
export function startOfDayInZone(input: Date | string, timeZone: string = ORG_TIMEZONE): Date {
  const instant = new Date(toMs(input));
  return zonedTimeToUtc(todayInZone(timeZone, instant), "00:00:00", timeZone);
}

/** End of the zone-calendar day containing `input` (inclusive, ms). */
export function endOfDayInZone(input: Date | string, timeZone: string = ORG_TIMEZONE): Date {
  return new Date(startOfDayInZone(input, timeZone).getTime() + 86_400_000 - 1);
}

/**
 * Render a kind-B "YYYY-MM-DD" with no zone shift at all (pure string math,
 * never passed through new Date for display).
 */
export function formatCalendarDate(ymd: string): string {
  const match = CALENDAR_DATE_RE.exec(ymd);
  if (!match) fail(`Invalid calendar date "${ymd}". Expected "YYYY-MM-DD".`);
  assertRealDay(Number(match[1]), Number(match[2]), Number(match[3]));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}
