import { intersectWeekdays } from '../educator-schedule-profile.repository';
import {
  EducatorScheduleProfileService,
  getScarcityRank,
} from '../educator-schedule-profile.service';
import type { DatabaseService } from '@/core/database/database.provider';

describe('intersectWeekdays', () => {
  it('returns every org day when availability is not configured', () => {
    expect(intersectWeekdays([], [1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    expect(intersectWeekdays(undefined, [1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns the declared days when the org week is unknown', () => {
    expect(intersectWeekdays([2, 4], [])).toEqual([2, 4]);
    expect(intersectWeekdays([2, 4], undefined)).toEqual([2, 4]);
  });

  it('keeps only days that are BOTH available and school days', () => {
    // Saturday/Sunday are not school days here, so they drop out even though
    // the educator said they were available.
    expect(intersectWeekdays([0, 2, 6], [1, 2, 3, 4, 5])).toEqual([2]);
  });

  it('sorts the result so the response is stable', () => {
    expect(intersectWeekdays([5, 1, 3], [1, 2, 3, 4, 5])).toEqual([1, 3, 5]);
  });

  it('yields empty when the intersection is empty (no placeable day)', () => {
    expect(intersectWeekdays([0, 6], [1, 2, 3, 4, 5])).toEqual([]);
  });
});

describe('getScarcityRank', () => {
  it('ranks fewer available days as scarcer', () => {
    expect(getScarcityRank([2, 4])).toBeLessThan(getScarcityRank([1, 2, 3, 4, 5]));
  });
});

describe('EducatorScheduleProfileService', () => {
  const makeService = (stored: any = null) => {
    const repo = {
      assertEducator: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(stored),
      upsert: jest.fn().mockImplementation(async (_o: string, _e: string, data: any) => ({
        use_custom_availability: data.useCustomAvailability,
        available_weekdays: data.availableWeekdays,
        max_minutes_per_day: data.maxMinutesPerDay,
        max_minutes_per_week: data.maxMinutesPerWeek,
      })),
      countClassesOutsideWeekdays: jest.fn().mockResolvedValue(0),
    };
    const cfg = {
      getByOrg: jest.fn().mockResolvedValue({
        slotDuration: 30,
        activeWeekdays: [1, 2, 3, 4, 5],
      }),
    };
    const service = new EducatorScheduleProfileService(
      repo as any,
      {} as unknown as DatabaseService,
      cfg,
    );
    return { service, repo, cfg };
  };

  describe('defaults', () => {
    it('reports every school day when no row exists', async () => {
      const { service } = makeService(null);
      const out = await service.get('org-1', 'ed-1');
      expect(out.useCustomAvailability).toBe(false);
      expect(out.effectiveWeekdays).toEqual([1, 2, 3, 4, 5]);
    });

    it('reports every school day when a row exists but never opted in', async () => {
      const { service } = makeService({
        use_custom_availability: false,
        available_weekdays: [2, 4],
        max_minutes_per_day: null,
        max_minutes_per_week: null,
      });
      const out = await service.get('org-1', 'ed-1');
      expect(out.effectiveWeekdays).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('intersection at read time', () => {
    it('intersects a custom set with the org school days', async () => {
      const { service } = makeService({
        use_custom_availability: true,
        available_weekdays: [2, 4, 0],
        max_minutes_per_day: null,
        max_minutes_per_week: null,
      });
      const out = await service.get('org-1', 'ed-1');
      // Sunday is not a school day, so it drops out with no data migration.
      expect(out.effectiveWeekdays).toEqual([2, 4]);
    });
  });

  describe('validation', () => {
    it('rejects a custom set with no days (would be unschedulable)', async () => {
      const { service } = makeService();
      await expect(
        service.set('org-1', 'ed-1', {
          useCustomAvailability: true,
          availableWeekdays: [],
        }),
      ).rejects.toThrow(/at least one available day/);
    });

    it('rejects a weekday outside 0-6', async () => {
      const { service } = makeService();
      await expect(
        service.set('org-1', 'ed-1', {
          useCustomAvailability: true,
          availableWeekdays: [9],
        }),
      ).rejects.toThrow(/must be 0-6/);
    });

    it('rejects a non-positive daily limit', async () => {
      const { service } = makeService();
      await expect(
        service.set('org-1', 'ed-1', {
          useCustomAvailability: false,
          availableWeekdays: [],
          maxMinutesPerDay: 0,
        }),
      ).rejects.toThrow(/per day must be positive/);
    });

    it('rejects perDay > perWeek', async () => {
      const { service } = makeService();
      await expect(
        service.set('org-1', 'ed-1', {
          useCustomAvailability: false,
          availableWeekdays: [],
          maxMinutesPerDay: 400,
          maxMinutesPerWeek: 300,
        }),
      ).rejects.toThrow(/cannot exceed/);
    });

    it('accepts a valid custom set', async () => {
      const { service } = makeService();
      const out = await service.set('org-1', 'ed-1', {
        useCustomAvailability: true,
        availableWeekdays: [2, 4],
      });
      expect(out.effectiveWeekdays).toEqual([2, 4]);
    });

    it('clears stored weekdays when switching back to "all school days"', async () => {
      const { service, repo } = makeService();
      await service.set('org-1', 'ed-1', {
        useCustomAvailability: false,
        availableWeekdays: [2, 4],
      });
      // Stale days must not linger and reappear if the flag is flipped later.
      expect(repo.upsert.mock.calls[0][2].availableWeekdays).toEqual([]);
    });

    it('surfaces how many existing classes fall outside, as a warning not a block', async () => {
      const { service, repo } = makeService();
      repo.countClassesOutsideWeekdays.mockResolvedValue(3);
      const out = await service.set('org-1', 'ed-1', {
        useCustomAvailability: true,
        availableWeekdays: [2, 4],
      });
      expect(out.outsideAvailabilityClassCount).toBe(3);
    });
  });
});