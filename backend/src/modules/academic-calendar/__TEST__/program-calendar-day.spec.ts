import { validate } from 'class-validator';
import {
  buildHolidayDates,
  PHILIPPINE_HOLIDAYS,
} from '../data/holidays.data';
import {
  BreakDto,
  CreateProgramCalendarDto,
  CustomHolidayDto,
} from '../dto/program-calendar.dto';

/**
 * TICK-INFRA-017 (Step 4.4) — program calendars are kind-B days.
 * Deterministic under every process TZ.
 */
describe('program-calendar days (TICK-INFRA-017)', () => {
  async function errorsFor(dto: object): Promise<string[]> {
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('accepts YYYY-MM-DD breaks/dates, rejects datetimes', async () => {
    const cal = new CreateProgramCalendarDto();
    cal.schoolYearId = '11111111-1111-4111-8111-111111111111';
    cal.programId = '22222222-2222-4222-8222-222222222222';
    cal.startDate = '2026-08-01';
    cal.endDate = '2027-06-30';
    expect(await errorsFor(cal)).toHaveLength(0);

    const brk = new BreakDto();
    brk.label = 'Christmas';
    brk.startDate = '2026-12-25T00:00:00.000Z';
    brk.endDate = '2027-01-05';
    expect(await errorsFor(brk)).not.toHaveLength(0);

    const custom = new CustomHolidayDto();
    custom.title = 'Foundation Day';
    custom.date = '2026-09-01';
    expect(await errorsFor(custom)).toHaveLength(0);
  });

  it('buildHolidayDates emits UTC-midnight Dates in every zone', () => {
    const rows = buildHolidayDates(
      PHILIPPINE_HOLIDAYS.filter((h) => h.isDefault).map((h) => h.key),
      2026,
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const iso = row.date.toISOString();
      expect(iso.endsWith('T00:00:00.000Z')).toBe(true);
      expect(iso.startsWith('2026-')).toBe(true);
    }
    const newYear = rows.find((r) => r.key === 'new_year');
    expect(newYear?.date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
