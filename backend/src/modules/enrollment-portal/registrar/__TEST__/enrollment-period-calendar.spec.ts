import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { EnrollmentRegistrarService } from '../enrollment-registrar.service';
import {
  CreateEnrollmentPeriodDto,
  UpdateEnrollmentPeriodDto,
} from '../dto/enrollment-registrar.dto';
import type { EnrollmentRegistrarRepository } from '../enrollment-registrar.repository';
import {
  addDaysToCalendarDate,
  calendarDateToUtc,
  todayInZone,
} from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 (Step 4.4) — enrollment periods are kind-B calendar days.
 * Deterministic under every process TZ (UTC, Asia/Manila,
 * America/Los_Angeles, Pacific/Kiritimati).
 */
describe('enrollment period calendar days (TICK-INFRA-017)', () => {
  describe('DTO boundary', () => {
    async function errorsFor(dto: object): Promise<string[]> {
      const errors = await validate(dto);
      return errors.flatMap((e) => Object.values(e.constraints ?? {}));
    }

    it('accepts YYYY-MM-DD, rejects full datetimes', async () => {
      const ok = new CreateEnrollmentPeriodDto();
      ok.name = 'P1';
      ok.school_year_id = 'sy-1';
      ok.start_date = '2026-08-01';
      ok.end_date = '2027-06-30';
      ok.lock_date = '2027-06-01';
      expect(await errorsFor(ok)).toHaveLength(0);

      const datetime = new UpdateEnrollmentPeriodDto();
      datetime.lock_date = '2027-06-01T00:00:00.000Z';
      expect(await errorsFor(datetime)).not.toHaveLength(0);
    });
  });

  describe('EnrollmentRegistrarService period rules', () => {
    function utcMidnight(ymd: string): Date {
      return calendarDateToUtc(ymd);
    }

    function periodOn(start: string, end: string, lock: string, id = 'p1') {
      return {
        id,
        name: id,
        token: `tok-${id}`,
        start_date: utcMidnight(start),
        end_date: utcMidnight(end),
        lock_date: utcMidnight(lock),
        created_by: 'u1',
        section_overflow_action: null,
        schoolYear: { id: 'sy-1' },
        school_year_id: 'sy-1',
        created_at: utcMidnight(start),
      };
    }

    function makeService(periods: Array<ReturnType<typeof periodOn>>) {
      const repo = {
        findOrgInfo: jest.fn().mockResolvedValue({ id: 'org-1' }),
        findPeriods: jest.fn().mockResolvedValue(periods),
        countApplicationsByPeriodStatus: jest.fn().mockResolvedValue([]),
        findPeriodApplications: jest.fn().mockResolvedValue([]),
        findDashboardPrograms: jest.fn().mockResolvedValue([]),
        findSchoolYear: jest.fn().mockResolvedValue({ id: 'sy-1' }),
        findPeriodByToken: jest.fn().mockResolvedValue(null),
        createPeriod: jest.fn().mockImplementation((d: unknown) => d),
      };
      const service = new EnrollmentRegistrarService(
        repo as unknown as EnrollmentRegistrarRepository,
        { logAdminAction: jest.fn().mockResolvedValue(undefined) } as any,
        {} as any,
        { assertReady: jest.fn() } as any,
      );
      return { service, repo };
    }

    it('derives upcoming/open/locked/ended from calendar days', async () => {
      const today = todayInZone();
      const add = (n: number) => addDaysToCalendarDate(today, n);
      const { service } = makeService([
        periodOn(add(10), add(40), add(20), 'upcoming'),
        periodOn(add(-10), add(40), add(20), 'open'),
        periodOn(add(-40), add(10), add(-5), 'locked'),
        periodOn(add(-60), add(-10), add(-20), 'ended'),
      ]);

      const result = await service.getDashboard('org-1');
      const statuses = Object.fromEntries(
        result.availablePeriods.map((p: { id: string; status: string }) => [
          p.id,
          p.status,
        ]),
      );
      expect(statuses).toEqual({
        upcoming: 'upcoming',
        open: 'open',
        locked: 'locked',
        ended: 'ended',
      });
    });

    it('keeps the lock day and end day fully usable (R6 for periods)', async () => {
      const today = todayInZone();
      const add = (n: number) => addDaysToCalendarDate(today, n);
      const { service } = makeService([
        periodOn(add(-10), add(10), today, 'lock-today'),
        periodOn(add(-10), today, add(-5), 'end-today'),
      ]);

      const result = await service.getDashboard('org-1');
      const statuses = Object.fromEntries(
        result.availablePeriods.map((p: { id: string; status: string }) => [
          p.id,
          p.status,
        ]),
      );
      expect(statuses['lock-today']).toBe('open');
      expect(statuses['end-today']).toBe('locked');
    });

    it('reads legacy 16:00Z rows as their intended days', async () => {
      const today = todayInZone();
      const legacy = (ymd: string) =>
        new Date(utcMidnight(ymd).getTime() - 8 * 3_600_000);
      const { service } = makeService([
        {
          ...periodOn(today, addDaysToCalendarDate(today, 10), today, 'legacy'),
          start_date: legacy(today),
          end_date: legacy(addDaysToCalendarDate(today, 10)),
          lock_date: legacy(today),
        },
      ]);

      const result = await service.getDashboard('org-1');
      expect(result.availablePeriods[0].status).toBe('open');
    });

    it('stores period bounds as UTC midnight and keeps day ordering', async () => {
      const { service, repo } = makeService([]);
      const today = todayInZone();
      const dto = new CreateEnrollmentPeriodDto();
      dto.name = 'P1';
      dto.school_year_id = 'sy-1';
      dto.start_date = today;
      dto.end_date = addDaysToCalendarDate(today, 300);
      dto.lock_date = addDaysToCalendarDate(today, 290);

      await service.createPeriod('org-1', 'actor-1', dto);
      expect(repo.createPeriod).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: utcMidnight(today),
          endDate: utcMidnight(addDaysToCalendarDate(today, 300)),
          lockDate: utcMidnight(addDaysToCalendarDate(today, 290)),
        }),
      );

      const bad = new CreateEnrollmentPeriodDto();
      bad.name = 'P1';
      bad.school_year_id = 'sy-1';
      bad.start_date = today;
      bad.end_date = today;
      bad.lock_date = today;
      await expect(
        service.createPeriod('org-1', 'actor-1', bad),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
