import { computeTermDates } from '../date-calculator.util';
import type { SemesterTemplateDef } from '../../data/semester-templates.data';
import { calendarDateToUtc } from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 (Step 4.4) — term splitting is pure day arithmetic.
 * Deterministic under every process TZ.
 */
describe('computeTermDates day split (TICK-INFRA-017)', () => {
  const template = {
    semesters: [{ terms: [{}, {}] }, { terms: [{}, {}] }],
  } as unknown as SemesterTemplateDef;
  const termIds = ['t1', 't2', 't3', 't4'];

  it('splits a range into contiguous UTC-midnight day ranges', () => {
    const terms = computeTermDates(
      calendarDateToUtc('2026-08-01'),
      calendarDateToUtc('2027-06-30'),
      template,
      termIds,
    );
    expect(terms).toHaveLength(4);
    for (const t of terms) {
      expect(t.startDate.toISOString().endsWith('T00:00:00.000Z')).toBe(true);
      expect(t.endDate.toISOString().endsWith('T00:00:00.000Z')).toBe(true);
      expect(t.endDate.getTime()).toBeGreaterThanOrEqual(
        t.startDate.getTime(),
      );
    }
    // Contiguous: each term starts the day after the previous one ends.
    for (let i = 1; i < terms.length; i++) {
      const prevEnd = terms[i - 1].endDate.toISOString().slice(0, 10);
      const start = terms[i].startDate.toISOString().slice(0, 10);
      const expected = new Date(
        Date.parse(`${prevEnd}T00:00:00.000Z`) + 24 * 3_600_000,
      )
        .toISOString()
        .slice(0, 10);
      expect(start).toBe(expected);
    }
    // Covers the whole range exactly.
    expect(terms[0].startDate.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(terms[3].endDate.toISOString()).toBe('2027-06-30T00:00:00.000Z');
  });

  it('reads legacy 16:00Z school-year bounds as their intended days', () => {
    const terms = computeTermDates(
      new Date('2026-07-31T16:00:00.000Z'),
      new Date('2027-06-29T16:00:00.000Z'),
      template,
      termIds,
    );
    expect(terms).toHaveLength(4);
    expect(terms[0].startDate.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(terms[3].endDate.toISOString()).toBe('2027-06-30T00:00:00.000Z');
  });
});
