import { BadRequestException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * TICK-INFRA-017 — single time layer for the backend.
 *
 * The school timezone is ONE CONSTANT: Asia/Manila. No org column, no env
 * override, no per-user zone. The frontend mirrors this file
 * (`frontend/src/utils/datetime.util.ts`); a spec asserts both
 * ORG_TIMEZONE constants stay equal.
 *
 * Three kinds of time, never mixed:
 *  A. INSTANT — a real moment (assessment release/end, reopenedUntil,
 *     grade-lock deadlines). Stored as UTC. API format: ISO-8601 WITH "Z"
 *     or an explicit offset. Zone-less values are REJECTED, never guessed.
 *  B. CALENDAR DATE — a day with no time and no zone ("YYYY-MM-DD").
 *  C. FLOATING TIME — "07:00" class schedules. NOT handled here; see
 *     commons/utils/schedule-time.util.ts (do not touch).
 *
 * Rules enforced by this module:
 *  - parseInstant is ONLY for incoming client strings. Reads of values that
 *    are already Date objects (from Prisma) or ISO strings from our own API
 *    are already true instants — compare them to new Date() directly, do NOT
 *    wrap those reads in parseInstant.
 *  - The backend never converts instants. Conversion picker -> UTC happens
 *    once on the frontend (localInputToIso, in ORG_TIMEZONE). Here we only
 *    validate and store.
 *  - Anything displayed uses formatInZone with an explicit timeZone.
 */
export const ORG_TIMEZONE = 'Asia/Manila';

/** Matches a trailing "Z" or explicit numeric offset (+08:00, +0800). */
const INSTANT_SUFFIX_RE = /(Z|[+-]\d{2}:?\d{2})$/;

/** Strict "YYYY-MM-DD". */
const CALENDAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Strict picker value "YYYY-MM-DDTHH:mm" (optional ":ss"). */
const LOCAL_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

const INSTANT_REJECTION_MESSAGE =
  'Datetime must be ISO-8601 with "Z" or an explicit offset ' +
  '(e.g. 2026-10-06T17:00:00+08:00). Zone-less values like ' +
  '"2026-10-06T17:00" are rejected: the server must not guess a timezone.';

function isRealDate(ms: number): boolean {
  return !Number.isNaN(ms);
}

/**
 * Parse an incoming client instant. The string MUST carry "Z" or an explicit
 * offset; zone-less or invalid input throws BadRequestException (HTTP 400).
 * Date instances pass through (defensively copied).
 */
export function parseInstant(input: string | Date): Date {
  if (input instanceof Date) {
    if (!isRealDate(input.getTime())) {
      throw new BadRequestException('Invalid datetime value.');
    }
    return new Date(input.getTime());
  }
  if (typeof input !== 'string' || !INSTANT_SUFFIX_RE.test(input.trim())) {
    throw new BadRequestException(INSTANT_REJECTION_MESSAGE);
  }
  const parsed = new Date(input);
  if (!isRealDate(parsed.getTime())) {
    throw new BadRequestException(INSTANT_REJECTION_MESSAGE);
  }
  return parsed;
}

/**
 * DTO validator for kind-A instants. Rejects zone-less datetimes and
 * calendar dates. Pair with @IsOptional() when the field is optional —
 * @IsOptional() skips null/undefined, which is exactly the clearing
 * contract: undefined = untouched, null = clear.
 */
export function IsInstant(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'isInstant',
      target: (target as object).constructor,
      propertyName: propertyKey as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          if (!INSTANT_SUFFIX_RE.test(value.trim())) return false;
          return isRealDate(new Date(value).getTime());
        },
        defaultMessage(args: ValidationArguments): string {
          return `${String(args.property)}: ${INSTANT_REJECTION_MESSAGE}`;
        },
      },
    });
  };
}

/**
 * DTO validator for kind-B calendar dates. Accepts ONLY "YYYY-MM-DD" that
 * is a real calendar day. Never accepts a full datetime for a
 * calendar-date field or vice versa.
 */
export function IsCalendarDate(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    registerDecorator({
      name: 'isCalendarDate',
      target: (target as object).constructor,
      propertyName: propertyKey as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          const match = CALENDAR_DATE_RE.exec(value);
          if (!match) return false;
          const year = Number(match[1]);
          const month = Number(match[2]);
          const day = Number(match[3]);
          if (month < 1 || month > 12 || day < 1 || day > 31) return false;
          const probe = new Date(Date.UTC(year, month - 1, day));
          return (
            probe.getUTCFullYear() === year &&
            probe.getUTCMonth() === month - 1 &&
            probe.getUTCDate() === day
          );
        },
        defaultMessage(args: ValidationArguments): string {
          return (
            `${String(args.property)} must be a calendar date "YYYY-MM-DD" ` +
            '(a day with no time and no zone). Full datetimes are rejected.'
          );
        },
      },
    });
  };
}

/**
 * Today's date in the zone as "YYYY-MM-DD". String comparison against
 * calendarDateOf() output — never Date vs Date.
 */
export function todayInZone(
  timeZone: string = ORG_TIMEZONE,
  now: Date = new Date(),
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();

function zonedPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = zonedFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    zonedFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: string,
): number {
  return Number(parts.find((p) => p.type === type)?.value);
}

/** Offset of `timeZone` at `utcMs`, in milliseconds (wall-clock − UTC). */
function zoneOffsetMs(timeZone: string, utcMs: number): number {
  const parts = zonedPartsFormatter(timeZone).formatToParts(new Date(utcMs));
  const asUtc = Date.UTC(
    partValue(parts, 'year'),
    partValue(parts, 'month') - 1,
    partValue(parts, 'day'),
    partValue(parts, 'hour'),
    partValue(parts, 'minute'),
    partValue(parts, 'second'),
  );
  return asUtc - utcMs;
}

/**
 * Resolve a wall-clock time in `timeZone` to its UTC instant. Process-TZ
 * independent: only the explicit zone and Intl data are consulted, so the
 * result is identical under TZ=UTC, Asia/Manila, America/Los_Angeles, or
 * Pacific/Kiritimati. (Manila has no DST; the two-pass correction keeps
 * this correct for zones that do.)
 */
export function zonedTimeToUtc(
  date: string,
  time: string,
  timeZone: string = ORG_TIMEZONE,
): Date {
  if (!CALENDAR_DATE_RE.test(date)) {
    throw new BadRequestException(
      `Invalid calendar date "${date}". Expected "YYYY-MM-DD".`,
    );
  }
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(normalizedTime)) {
    throw new BadRequestException(
      `Invalid wall-clock time "${time}". Expected "HH:mm".`,
    );
  }
  const guess = Date.parse(`${date}T${normalizedTime}Z`);
  if (!isRealDate(guess)) {
    throw new BadRequestException(`Invalid datetime "${date}T${time}".`);
  }
  const firstPass = zoneOffsetMs(timeZone, guess);
  const secondPass = zoneOffsetMs(timeZone, guess - firstPass);
  return new Date(guess - secondPass);
}

/**
 * Interpret a zone-less picker value ("YYYY-MM-DDTHH:mm") in ORG_TIMEZONE
 * and return the UTC ISO string. This is the frontend's edge conversion;
 * the backend exposes it for symmetry but never converts instants itself.
 */
export function localInputToIso(value: string): string {
  const match = LOCAL_INPUT_RE.exec(value);
  if (!match) {
    throw new BadRequestException(
      `Invalid datetime-local value "${value}". Expected "YYYY-MM-DDTHH:mm".`,
    );
  }
  const seconds = match[7] ?? '00';
  return zonedTimeToUtc(
    `${match[1]}-${match[2]}-${match[3]}`,
    `${match[4]}:${match[5]}:${seconds}`,
    ORG_TIMEZONE,
  ).toISOString();
}

/**
 * Convert a true instant to the ORG_TIMEZONE picker value
 * ("YYYY-MM-DDTHH:mm") for pre-filling edit forms.
 */
export function isoToLocalInput(iso: string | Date): string {
  const instant = parseInstant(iso);
  const parts = zonedPartsFormatter(ORG_TIMEZONE).formatToParts(instant);
  const pad = (type: string): string =>
    String(partValue(parts, type)).padStart(2, '0');
  return (
    `${partValue(parts, 'year')}-${pad('month')}-${pad('day')}` +
    `T${pad('hour')}:${pad('minute')}`
  );
}

/**
 * Format a true instant for display with an explicit timeZone (defaults to
 * ORG_TIMEZONE), so SSR and browser renders produce identical strings.
 * Zone-less strings are rejected — display helpers only receive real
 * instants; date-only values go through formatCalendarDate instead.
 */
export function formatInZone(
  input: Date | string,
  options?: Intl.DateTimeFormatOptions,
  timeZone: string = ORG_TIMEZONE,
): string {
  const instant =
    input instanceof Date ? new Date(input.getTime()) : parseInstant(input);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
  const instant = input instanceof Date ? input : new Date(input);
  if (!isRealDate(instant.getTime())) {
    throw new BadRequestException('Invalid date value.');
  }
  return new Date(instant.getTime() + 12 * 3_600_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Store a kind-B "YYYY-MM-DD" as UTC midnight of that date (what
 * new Date("YYYY-MM-DD") already yields, made explicit). No schema change,
 * no data migration.
 */
export function calendarDateToUtc(ymd: string): Date {
  const match = CALENDAR_DATE_RE.exec(ymd);
  if (!match) {
    throw new BadRequestException(
      `Invalid calendar date "${ymd}". Expected "YYYY-MM-DD".`,
    );
  }
  const probe = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  if (
    probe.getUTCFullYear() !== Number(match[1]) ||
    probe.getUTCMonth() !== Number(match[2]) - 1 ||
    probe.getUTCDate() !== Number(match[3])
  ) {
    throw new BadRequestException(`Invalid calendar date "${ymd}".`);
  }
  return probe;
}

/** Pure calendar arithmetic on "YYYY-MM-DD" (no Date getters, no zone). */
export function addDaysToCalendarDate(ymd: string, days: number): string {
  const base = calendarDateToUtc(ymd).getTime();
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Start of the zone-calendar day containing `input`, as a UTC instant.
 * For building "everything today" ranges in ORG_TIMEZONE.
 */
export function startOfDayInZone(
  input: Date | string,
  timeZone: string = ORG_TIMEZONE,
): Date {
  const instant = input instanceof Date ? input : parseInstant(input);
  const ymd = todayInZone(timeZone, instant);
  return zonedTimeToUtc(ymd, '00:00:00', timeZone);
}

/** End of the zone-calendar day containing `input` (inclusive, ms). */
export function endOfDayInZone(
  input: Date | string,
  timeZone: string = ORG_TIMEZONE,
): Date {
  return new Date(startOfDayInZone(input, timeZone).getTime() + 86_400_000 - 1);
}

/**
 * Render a kind-B "YYYY-MM-DD" with no zone shift at all (pure string math,
 * never passed through new Date for display).
 */
export function formatCalendarDate(ymd: string): string {
  const match = CALENDAR_DATE_RE.exec(ymd);
  if (!match) {
    throw new BadRequestException(
      `Invalid calendar date "${ymd}". Expected "YYYY-MM-DD".`,
    );
  }
  calendarDateToUtc(ymd); // validates the day really exists
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}
