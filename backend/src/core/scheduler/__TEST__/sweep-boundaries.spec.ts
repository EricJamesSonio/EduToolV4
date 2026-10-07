import { CronTime } from 'cron';
import { SchoolYearRepository } from '@/modules/school-year/school-year.repository';
import { EnrollmentRegistrarRepository } from '@/modules/enrollment-portal/registrar/enrollment-registrar.repository';
import {
  ORG_TIMEZONE,
  calendarDateOf,
  startOfDayInZone,
  todayInZone,
} from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 (Step 4.3) — fixed-clock crons run in school time and the
 * year-end / enrollment sweeps apply the R6 calendar rule.
 *
 * Run under every process TZ (UTC, Asia/Manila, America/Los_Angeles,
 * Pacific/Kiritimati): all expectations are absolute, so results must be
 * identical in all four.
 */
describe('scheduler timezone boundaries (TICK-INFRA-017)', () => {
  describe('fixed-clock crons fire in ORG_TIMEZONE', () => {
    // NOTE: CronTime.getNextDateFrom(from) WITHOUT an explicit zone frames
    // the computation in the PROCESS zone (cron/dist/time.js converts the
    // JS Date via DateTime.fromJSDate) — the live scheduler path is pinned
    // by the @Cron timeZone option instead, so the tests below pin the zone
    // explicitly to assert the contract independent of process TZ.
    it('03:00 Manila fires at 19:00Z the previous day', () => {
      // scheduler.tasks.ts handleAutoUnenrollOnYearEnd:
      // @Cron('0 3 * * *', { timeZone: ORG_TIMEZONE })
      const next = new CronTime('0 3 * * *', ORG_TIMEZONE).getNextDateFrom(
        new Date('2026-10-06T12:00:00.000Z'),
        ORG_TIMEZONE,
      );
      expect(next.toJSDate().toISOString()).toBe('2026-10-06T19:00:00.000Z');
    });

    it('02:00 Manila fires at 18:00Z the previous day', () => {
      // scheduler.tasks.ts handleNotificationArchiving:
      // @Cron('0 2 * * *', { timeZone: ORG_TIMEZONE })
      const next = new CronTime('0 2 * * *', ORG_TIMEZONE).getNextDateFrom(
        new Date('2026-10-06T12:00:00.000Z'),
        ORG_TIMEZONE,
      );
      expect(next.toJSDate().toISOString()).toBe('2026-10-06T18:00:00.000Z');
    });
  });

  describe('R6 sweep boundary (year/period ending today stays active)', () => {
    it('SchoolYearRepository.findExpiredActive queries before Manila midnight starting today', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const repo = new SchoolYearRepository({ schoolYear: { findMany } } as any);

      await repo.findExpiredActive();

      const where = findMany.mock.calls[0][0].where as {
        status: string;
        end_date: { lt: Date };
      };
      expect(where.status).toBe('active');
      const boundary = where.end_date.lt;
      // The boundary is Manila midnight starting today, whatever today is.
      expect(boundary.toISOString()).toBe(
        startOfDayInZone(new Date()).toISOString(),
      );
      // ...so a year ending today (either row convention) is NOT expired.
      const today = todayInZone();
      const utcMidnightToday = new Date(`${today}T00:00:00.000Z`);
      const legacyMidnightToday = new Date(
        utcMidnightToday.getTime() - 8 * 3_600_000,
      );
      expect(calendarDateOf(legacyMidnightToday)).toBe(today);
      expect(utcMidnightToday < boundary).toBe(false);
      expect(legacyMidnightToday < boundary).toBe(false);
      // ...but a year that ended yesterday is.
      const yesterdayUtc = new Date(
        utcMidnightToday.getTime() - 24 * 3_600_000,
      );
      expect(yesterdayUtc < boundary).toBe(true);
    });

    it('EnrollmentRegistrarRepository.findExpiredPendingApplications uses the same boundary', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const repo = new EnrollmentRegistrarRepository({
        enrollmentApplication: { findMany },
      } as any);

      await repo.findExpiredPendingApplications();

      const where = findMany.mock.calls[0][0].where as {
        enrollmentPeriod: { lock_date: { lt: Date } };
      };
      const boundary = where.enrollmentPeriod.lock_date.lt;
      expect(boundary.toISOString()).toBe(
        startOfDayInZone(new Date()).toISOString(),
      );
      // A period whose lock day is today still accepts applications.
      const today = todayInZone();
      const lockTodayUtc = new Date(`${today}T00:00:00.000Z`);
      expect(lockTodayUtc < boundary).toBe(false);
    });
  });
});
