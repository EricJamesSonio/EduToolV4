import { validate } from 'class-validator';
import {
  ORG_TIMEZONE as BACKEND_ORG_TIMEZONE,
  parseInstant,
  IsInstant,
  IsCalendarDate,
  todayInZone,
  calendarDateOf,
  calendarDateToUtc,
  addDaysToCalendarDate,
  startOfDayInZone,
  endOfDayInZone,
  formatInZone,
  localInputToIso,
  isoToLocalInput,
} from '../datetime.util';
import { ORG_TIMEZONE as FRONTEND_ORG_TIMEZONE } from '../../../../../frontend/src/utils/datetime.util';

/**
 * TICK-INFRA-017 — timezone-independence proof for the shared time layer.
 *
 * Run under every process TZ (UTC, Asia/Manila, America/Los_Angeles,
 * Pacific/Kiritimati): every assertion below is on absolute values, so the
 * result must be identical in all four. Fixtures use explicit-offset ISO
 * strings only — never `new Date(y, m, d, h)`, which resolves per process TZ
 * and would let a zone leak pass on the author's own machine.
 */
describe('datetime.util (timezone-invariant)', () => {
  it('both sides share one school timezone constant', () => {
    expect(BACKEND_ORG_TIMEZONE).toBe('Asia/Manila');
    expect(FRONTEND_ORG_TIMEZONE).toBe('Asia/Manila');
    expect(BACKEND_ORG_TIMEZONE).toBe(FRONTEND_ORG_TIMEZONE);
  });

  describe('parseInstant', () => {
    it('rejects zone-less values with BadRequest (HTTP 400 semantics)', () => {
      expect(() => parseInstant('2026-10-06T17:00')).toThrow();
      expect(() => parseInstant('2026-10-06')).toThrow();
      expect(() => parseInstant('not a date')).toThrow();
      expect(() => parseInstant('')).toThrow();
    });

    it('rejects invalid instants even with a zone suffix', () => {
      expect(() => parseInstant('2026-13-40T25:00:00Z')).toThrow();
      expect(() => parseInstant(new Date('bogus'))).toThrow();
    });

    it('accepts Z and offset forms as the same absolute instant', () => {
      const fromZ = parseInstant('2026-10-06T09:00:00.000Z');
      const fromOffset = parseInstant('2026-10-06T17:00:00+08:00');
      expect(fromZ.toISOString()).toBe('2026-10-06T09:00:00.000Z');
      expect(fromOffset.toISOString()).toBe('2026-10-06T09:00:00.000Z');
    });

    it('passes Date instances through as defensive copies', () => {
      const original = new Date('2026-10-06T09:00:00.000Z');
      const parsed = parseInstant(original);
      expect(parsed).not.toBe(original);
      expect(parsed.getTime()).toBe(original.getTime());
    });
  });

  describe('@IsInstant / @IsCalendarDate', () => {
    class InstantDto {
      @IsInstant()
      releaseDate!: string;
    }

    class CalendarDto {
      @IsCalendarDate()
      startDate!: string;
    }

    async function errorsFor(
      dto: object,
    ): Promise<string[]> {
      const errors = await validate(dto);
      return errors.flatMap((e) => Object.values(e.constraints ?? {}));
    }

    it('rejects zone-less instants, accepts Z and offset', async () => {
      const zoneless = new InstantDto();
      zoneless.releaseDate = '2026-10-06T17:00';
      expect(await errorsFor(zoneless)).not.toHaveLength(0);

      const dateOnly = new InstantDto();
      dateOnly.releaseDate = '2026-10-06';
      expect(await errorsFor(dateOnly)).not.toHaveLength(0);

      const withZ = new InstantDto();
      withZ.releaseDate = '2026-10-06T09:00:00.000Z';
      expect(await errorsFor(withZ)).toHaveLength(0);

      const withOffset = new InstantDto();
      withOffset.releaseDate = '2026-10-06T17:00:00+08:00';
      expect(await errorsFor(withOffset)).toHaveLength(0);
    });

    it('accepts only YYYY-MM-DD for calendar dates', async () => {
      const ok = new CalendarDto();
      ok.startDate = '2026-10-06';
      expect(await errorsFor(ok)).toHaveLength(0);

      const datetime = new CalendarDto();
      datetime.startDate = '2026-10-06T09:00:00.000Z';
      expect(await errorsFor(datetime)).not.toHaveLength(0);

      const impossible = new CalendarDto();
      impossible.startDate = '2026-02-30';
      expect(await errorsFor(impossible)).not.toHaveLength(0);
    });
  });

  describe('todayInZone at the Manila day boundary', () => {
    it('23:30 UTC is already tomorrow in Manila', () => {
      expect(todayInZone('Asia/Manila', new Date('2026-10-06T23:30:00.000Z'))).toBe(
        '2026-10-07',
      );
    });

    it('00:30 UTC is still the same Manila day', () => {
      expect(todayInZone('Asia/Manila', new Date('2026-10-06T00:30:00.000Z'))).toBe(
        '2026-10-06',
      );
    });
  });

  describe('calendarDateOf tolerance (R5)', () => {
    it('reads a UTC-midnight row as its own day', () => {
      expect(calendarDateOf(new Date('2026-10-06T00:00:00.000Z'))).toBe(
        '2026-10-06',
      );
    });

    it('reads a legacy 16:00Z (Manila-midnight) row as the intended day', () => {
      expect(calendarDateOf(new Date('2026-10-05T16:00:00.000Z'))).toBe(
        '2026-10-06',
      );
    });
  });

  describe('calendarDateToUtc / addDaysToCalendarDate', () => {
    it('stores a calendar date as UTC midnight', () => {
      expect(calendarDateToUtc('2026-10-06').toISOString()).toBe(
        '2026-10-06T00:00:00.000Z',
      );
    });

    it('does pure calendar arithmetic across month ends', () => {
      expect(addDaysToCalendarDate('2026-10-06', 1)).toBe('2026-10-07');
      expect(addDaysToCalendarDate('2026-10-06', -6)).toBe('2026-09-30');
    });
  });

  describe('startOfDayInZone / endOfDayInZone', () => {
    it('bounds the Manila day as UTC instants', () => {
      expect(
        startOfDayInZone(new Date('2026-10-06T09:00:00.000Z')).toISOString(),
      ).toBe('2026-10-05T16:00:00.000Z');
      expect(
        endOfDayInZone(new Date('2026-10-06T09:00:00.000Z')).toISOString(),
      ).toBe('2026-10-06T15:59:59.999Z');
    });
  });

  describe('localInputToIso / isoToLocalInput (ORG_TIMEZONE edge)', () => {
    it('interprets picker values as Manila wall-clock, any process TZ', () => {
      expect(localInputToIso('2026-10-06T17:00')).toBe(
        '2026-10-06T09:00:00.000Z',
      );
      expect(localInputToIso('2026-10-06T00:00')).toBe(
        '2026-10-05T16:00:00.000Z',
      );
    });

    it('pre-fills edit forms back in Manila wall-clock', () => {
      expect(isoToLocalInput('2026-10-06T09:00:00.000Z')).toBe(
        '2026-10-06T17:00',
      );
      expect(isoToLocalInput('2026-10-06T17:00:00+08:00')).toBe(
        '2026-10-06T17:00',
      );
    });

    it('round-trips picker -> ISO -> picker', () => {
      const picker = '2026-10-06T17:00';
      expect(isoToLocalInput(localInputToIso(picker))).toBe(picker);
    });
  });

  describe('formatInZone (explicit zone display)', () => {
    it('renders 09:00Z as 5:00 PM Manila regardless of process TZ', () => {
      const rendered = formatInZone('2026-10-06T09:00:00.000Z');
      expect(rendered).toContain('5:00 PM');
      expect(rendered).toContain('Oct 6, 2026');
      expect(formatInZone(new Date('2026-10-06T09:00:00.000Z'))).toBe(rendered);
    });
  });
});
