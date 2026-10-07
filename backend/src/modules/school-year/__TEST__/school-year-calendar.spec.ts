import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { SchoolYearService } from '../school-year.service';
import {
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
} from '../dto/school-year.dto';
import type { SchoolYearRepository } from '../school-year.repository';
import {
  addDaysToCalendarDate,
  todayInZone,
} from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 (Step 4.4) — school years are kind-B calendar days.
 * Deterministic under every process TZ (UTC, Asia/Manila,
 * America/Los_Angeles, Pacific/Kiritimati).
 */
describe('school-year calendar days (TICK-INFRA-017)', () => {
  describe('DTO boundary', () => {
    async function errorsFor(dto: object): Promise<string[]> {
      const errors = await validate(dto);
      return errors.flatMap((e) => Object.values(e.constraints ?? {}));
    }

    it('accepts YYYY-MM-DD, rejects full datetimes', async () => {
      const ok = new CreateSchoolYearDto();
      ok.start_date = '2026-08-01';
      ok.end_date = '2027-06-30';
      expect(await errorsFor(ok)).toHaveLength(0);

      const datetime = new CreateSchoolYearDto();
      datetime.start_date = '2026-08-01T00:00:00.000Z';
      datetime.end_date = '2027-06-30';
      expect(await errorsFor(datetime)).not.toHaveLength(0);

      const update = new UpdateSchoolYearDto();
      update.end_date = '2027-06-30T16:00:00.000Z';
      expect(await errorsFor(update)).not.toHaveLength(0);
    });
  });

  describe('SchoolYearService date rules', () => {
    function makeService(repoOverrides: Record<string, jest.Mock> = {}) {
      const repo = {
        create: jest.fn().mockResolvedValue({ id: 'sy-new' }),
        findById: jest.fn(),
        findActive: jest.fn().mockResolvedValue(null),
        findOverlapping: jest.fn().mockResolvedValue([]),
        expireAndEndActive: jest.fn().mockResolvedValue(0),
        updateStatus: jest.fn().mockResolvedValue({ id: 'sy-1' }),
        ...repoOverrides,
      };
      const service = new SchoolYearService(
        repo as unknown as SchoolYearRepository,
        { seedFromDefaults: jest.fn() } as any,
        {} as any,
        {} as any,
        { logAdminAction: jest.fn().mockResolvedValue(undefined) } as any,
        { assertReady: jest.fn() } as any,
        {} as any,
        {} as any,
        {} as any,
        {
          organization: { findUnique: jest.fn().mockResolvedValue(null) },
        } as any,
      );
      // subjectService is a real-method dependency only for unlockAllForOrg.
      (service as any).subjectService = {
        unlockAllForOrg: jest.fn(),
      };
      return { service, repo };
    }

    it('allows creating a year starting today (boundary inclusive)', async () => {
      const { service, repo } = makeService();
      const today = todayInZone();
      await service.create(
        'org-1',
        {
          name: 'Starts today',
          start_date: today,
          end_date: addDaysToCalendarDate(today, 300),
        },
        'actor-1',
      );
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('activates a year whose start day is today, from either row convention', async () => {
      // R6: the named day is fully usable. Legacy 16:00Z rows used to read
      // as "not yet started" on some servers.
      for (const start of [
        new Date(`${todayInZone()}T00:00:00.000Z`),
        new Date(
          Date.parse(`${todayInZone()}T00:00:00.000Z`) - 8 * 3_600_000,
        ),
      ]) {
        const { service, repo } = makeService();
        repo.findById.mockResolvedValue({
          id: 'sy-1',
          status: 'pending',
          start_date: start,
        });
        await service.activate('sy-1', 'org-1', 'actor-1');
        expect(repo.updateStatus).toHaveBeenCalledWith('sy-1', 'active');
      }
    });

    it('rejects creating a year that starts in the past', async () => {
      const { service, repo } = makeService();
      await expect(
        service.create(
          'org-1',
          {
            name: 'Past',
            start_date: addDaysToCalendarDate(todayInZone(), -10),
            end_date: addDaysToCalendarDate(todayInZone(), 300),
          },
          'actor-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('derives SY 2025-2026 for a January-start year in every zone', async () => {
      // The old new Date("2026-01-01").getFullYear() returned 2025 west of
      // UTC (Kiritimati is east, LA is west — both covered by the matrix).
      const { service, repo } = makeService();
      const start = addDaysToCalendarDate(todayInZone(), 30);
      const startYear = Number(start.slice(0, 4));
      const end = `${startYear + 1}-06-30`;
      await service.create(
        'org-1',
        {
          start_date: start,
          end_date: end,
          confirm_short_duration: true,
        },
        'actor-1',
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: `SY ${startYear}-${startYear + 1}`,
        }),
      );
    });
  });
});
