/**
 * schedule-time.util.ts — the ONLY place a `Date` and an "HH:mm" schedule time
 * may be converted into one another on the backend.
 *
 * `ClassSchedule.start_time` / `end_time` are stored as UTC wall-clock: the
 * value "07:00" is persisted so that it reads back as `07:00Z`, and the date
 * component is meaningless. Reading or writing them with server-local getters
 * (`getHours()` / `setHours()`) made a 07:00 class conflict-check (and display)
 * as 15:00 whenever the server timezone differed from the writing one.
 *
 * Conventions, enforced by the ESLint guard in eslint.config.mjs:
 *
 *   1. The anchor date is ALWAYS inherited from an explicit reference — which
 *      is the row's creation date in practice — never canonicalised to 1970.
 *      The stored date component is part of the write audit trail, so
 *      homogenising it would destroy provenance information. Only the time
 *      component is rewritten, via `setUTCHours` on a copy.
 *   2. Reads never construct `Date` semantics: `scheduleDateToMinutes` uses
 *      `getUTCHours()` / `getUTCMinutes()`, never `getHours()`.
 *   3. Every other module imports these and touches NO local getters.
 *
 * See the frontend mirror, `src/utils/scheduleTime.utils.ts`, which consumes
 * the serialised ISO and applies the same UTC-wall-clock reading there.
 */

const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * "HH:mm" -> a `Date` carrying it as UTC wall-clock, anchored on the given
 * reference date (defaults to now, mirroring the previous `parseTimeToDate`
 * signature so callers keep working unchanged).
 *
 * Only the time component is UTC-marked; year/month/day come from the
 * reference as-is.
 */
export function hhmmToScheduleDate(
  hhmm: string,
  referenceDate: Date = new Date(),
): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const d = new Date(referenceDate);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Minutes-of-day for a stored/incoming schedule `Date` (UTC wall-clock).
 *
 * This is what EVERY conflict/occupancy/capacity check must reduce to before
 * comparing: full timestamps carry different dates per row and never compare
 * correctly.
 */
export function scheduleDateToMinutes(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** "HH:mm" from a stored/incoming schedule `Date` (UTC wall-clock). */
export function scheduleDateToHHmm(d: Date): string {
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/** Minutes-of-day -> "HH:mm". */
export function minutesToHHmm(min: number): string {
  const total = ((min % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/**
 * "HH:mm" -> minutes-of-day. Pure string split, no `Date` involved, so it is
 * timezone-independent by construction. Use this wherever both endpoints are
 * already known to be "HH:mm" (org window, breaks, generator minutes).
 */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}