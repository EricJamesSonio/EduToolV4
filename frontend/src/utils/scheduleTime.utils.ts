/**
 * Schedule time normalization — the ONLY place a `Date` and an "HH:mm" string
 * are converted into one another on the frontend.
 *
 * `ClassSchedule.start_time` / `end_time` are stored as UTC wall-clock: the
 * backend persists "07:00" as `...T07:00:00.000Z` and the date component is
 * meaningless. Reading them with LOCAL getters (`getHours()`) showed a 07:00
 * class as 15:00 in a UTC+8 browser — the reported production bug.
 *
 * Two rules keep this correct:
 *
 * 1. Prefer parsing the ISO string's OWN components (`T07:00` -> "07:00")
 *    instead of constructing a `Date`. A `Date` carries the browser's timezone
 *    and every conversion through it can drift; a regex cannot. This path is
 *    timezone-independent by construction.
 * 2. Only when the string carries an EXPLICIT non-UTC offset (or is some other
 *    unrecognised format) do we fall back to a `Date` — and then we read it
 *    with `getUTC*`, never `get*`.
 *
 * Do not add another Date<->"HH:mm" conversion elsewhere. Every caller uses
 * these functions so schedule times cannot drift between screens.
 */

/** Matches the time component of an ISO datetime: `...T07:00:00.000Z`. */
const ISO_TIME = /T(\d{1,2}):(\d{2})/;

/** Matches an explicit UTC offset at the end: `+08:00` / `-05:00`. */
const EXPLICIT_OFFSET = /([+-])(\d{2}):?(\d{2})$/;

const pad2 = (n: number): string => String(n).padStart(2, "0");

/**
 * ISO datetime (or an already-"HH:mm" string) -> "HH:mm".
 * Returns "" when the value is unusable.
 *
 * A string carrying an explicit non-UTC offset (`...T07:00:00+08:00`) is
 * converted to its true UTC wall-clock, because that is what the backend
 * stores. `Z` and zone-less strings are taken at face value.
 */
export function toHHmm(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "";

  const trimmed = value.trim();

  // Already "HH:mm" (or "HH:mm:ss") — pass through, zero-padded. The `T` check
  // keeps this from swallowing an ISO datetime that happens to contain a colon.
  const simple = /^(\d{1,2}):(\d{2})/.exec(trimmed);
  if (simple && !trimmed.includes("T")) {
    return `${pad2(Number(simple[1]))}:${simple[2]}`;
  }

  // Zone-less ISO datetime, or one ending in `Z`: the literal time in the
  // string IS the UTC wall-clock. No Date involved, so no timezone can shift it.
  const match = ISO_TIME.exec(trimmed);
  if (match && !EXPLICIT_OFFSET.test(trimmed)) {
    return `${pad2(Number(match[1]))}:${match[2]}`;
  }

  // Explicit offset, or an unrecognised shape: convert properly, reading UTC.
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${pad2(parsed.getUTCHours())}:${pad2(parsed.getUTCMinutes())}`;
}

/** "HH:mm" (or an ISO datetime) -> minutes-of-day, or null when unusable. */
export function hhmmToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const hhmm = toHHmm(value);
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Minutes-of-day -> "HH:mm". */
export function minutesToHHmm(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/**
 * Display-only 12-hour label (e.g. "07:00" -> "7:00 AM").
 *
 * Built from the "HH:mm" STRING, never from a Date — so it cannot drift by the
 * viewer's timezone. Data values always stay 24-hour "HH:mm".
 */
export function formatHhmmForDisplay(hhmm: string): string {
  const minutes = hhmmToMinutes(hhmm);
  if (minutes === null) return "";
  const h24 = Math.floor(minutes / 60);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${pad2(minutes % 60)} ${period}`;
}