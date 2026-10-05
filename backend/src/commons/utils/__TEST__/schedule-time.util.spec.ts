import {
  hhmmToScheduleDate,
  scheduleDateToMinutes,
  scheduleDateToHHmm,
  minutesToHHmm,
  hhmmToMinutes,
} from '../schedule-time.util';

/**
 * These tests are MEANT to run under different server timezones
 * (`npm run test:tz` loops TZ=UTC, TZ=Asia/Manila, TZ=America/Los_Angeles).
 *
 * They deliberately avoid constructing fixtures with `new Date(y, m, d, h)`,
 * which resolves differently per TZ and would let a local-getter bug pass on
 * the author's own machine — the exact failure mode of the production bug.
 */
describe('schedule-time.util (timezone-invariant)', () => {
  it('writes HH:mm as UTC wall-clock, readable back as the same HH:mm', () => {
    const d = hhmmToScheduleDate('07:00', new Date('2026-10-05T00:00:00.000Z'));
    expect(d.toISOString()).toBe('2026-10-05T07:00:00.000Z');
    expect(scheduleDateToMinutes(d)).toBe(420);
    expect(scheduleDateToHHmm(d)).toBe('07:00');
  });

  it('keeps the reference date instead of canonicalising to an epoch', () => {
    const d = hhmmToScheduleDate('19:30', new Date('2026-02-14T12:00:00.000Z'));
    expect(d.toISOString().slice(0, 10)).toBe('2026-02-14');
    expect(scheduleDateToHHmm(d)).toBe('19:30');
  });

  it('the reported production case: a 07:00 row reads as 420, not 900', () => {
    // Stored row for a class the admin created as 7:00-11:00.
    const stored = new Date('2026-10-05T07:00:00.000Z');
    expect(scheduleDateToMinutes(stored)).toBe(420);
    expect(scheduleDateToMinutes(stored)).not.toBe(900);
  });

  it('an 11pm UTC row is still the 11pm row everywhere, not morning', () => {
    const stored = new Date('2026-10-05T23:00:00.000Z');
    expect(scheduleDateToMinutes(stored)).toBe(1380);
    expect(scheduleDateToHHmm(stored)).toBe('23:00');
  });

  it('UTC-marking survives even when the anchor is a legacy shifted value', () => {
    // A row a UTC+8 backend wrote as 23:00Z for local 07:00: re-tagging it
    // with the same wall-clock must not move it to morning.
    const shifted = new Date('2026-10-04T23:00:00.000Z');
    expect(scheduleDateToMinutes(shifted)).toBe(1380);
  });

  it('minutes helpers round-trip', () => {
    for (const hhmm of ['00:00', '07:00', '12:30', '23:59']) {
      expect(minutesToHHmm(hhmmToMinutes(hhmm))).toBe(hhmm);
    }
  });
});