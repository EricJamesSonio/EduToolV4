import { OrgScheduleConfigService } from '../org-schedule-config.service';

/** Builds a ClassSchedule row whose wall-clock time is `start` on `weekday`. */
function sched(classId: string, weekday: number, start: string, end: string) {
  const at = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };
  return { class_id: classId, weekday, start_time: at(start), end_time: at(end) };
}

describe('OrgScheduleConfigService weekdays + breaks', () => {
  const row = {
    id: 'cfg-1',
    org_id: 'org-1',
    start_time: '07:00',
    end_time: '17:00',
    slot_duration: 30,
    active_weekdays: [1, 2, 3, 4, 5],
    breaks: [],
    created_at: new Date(),
    updated_at: new Date(),
  };

  const makeService = (rows: any[] = []) => {
    const repo = {
      upsertDefaults: jest.fn().mockResolvedValue(row),
      upsert: jest.fn().mockImplementation(async (_org: string, data: unknown) => ({ ...row, ...data })),
    };
    const cache = {
      key: jest.fn((...parts: Array<string | number>) => parts.join(':')),
      cached: jest.fn(async (_k: string, _t: number, loader: () => Promise<unknown>) => loader()),
      del: jest.fn(async () => {}),
      delByPrefix: jest.fn(),
    };
    const db = { classSchedule: { findMany: jest.fn().mockResolvedValue(rows) } };
    const service = new OrgScheduleConfigService(repo as any, db as any, cache as any);
    return { service, repo, cache, db };
  };

  const valid = {
    startTime: '07:00',
    endTime: '17:00',
    slotDuration: 30,
    activeWeekdays: [1, 2, 3, 4, 5],
    breaks: [],
  };

  describe('persisting', () => {
    it('stores and returns activeWeekdays and breaks', async () => {
      const { service } = makeService();
      const out = await service.upsert('org-1', {
        ...valid,
        activeWeekdays: [1, 3, 5],
        breaks: [{ label: 'Lunch', start: '12:00', end: '13:00' }],
      } as any);
      expect(out.activeWeekdays).toEqual([1, 3, 5]);
      expect(out.breaks).toEqual([{ label: 'Lunch', start: '12:00', end: '13:00' }]);
    });

    it('sorts activeWeekdays so the response is stable regardless of input order', async () => {
      const { service } = makeService();
      const out = await service.upsert('org-1', { ...valid, activeWeekdays: [5, 1, 3] } as any);
      expect(out.activeWeekdays).toEqual([1, 3, 5]);
    });

    it('invalidates the cache on write', async () => {
      const { service, cache } = makeService();
      await service.upsert('org-1', valid as any);
      expect(cache.del).toHaveBeenCalledWith('org:org-1:schedule-config');
    });
  });

  describe('strict 409 — existing live schedules', () => {
    it('allows a change that keeps every existing slot valid', async () => {
      const { service } = makeService([sched('c1', 1, '08:00', '09:00')]);
      await expect(service.upsert('org-1', valid as any)).resolves.toBeDefined();
    });

    it('rejects removing a weekday that has a live class, and counts it', async () => {
      const { service } = makeService([sched('c1', 6, '08:00', '09:00')]);
      await expect(service.upsert('org-1', valid as any)).rejects.toThrow(
        /1 on a day you just removed/,
      );
    });

    it('rejects a new break that swallows a live class', async () => {
      const { service } = makeService([sched('c1', 1, '12:00', '13:00')]);
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [{ label: 'Lunch', start: '11:30', end: '13:30' }],
        } as any),
      ).rejects.toThrow(/1 overlapping a new break/);
    });

    it('rejects a narrower time range and counts out-of-bounds', async () => {
      const { service } = makeService([sched('c1', 1, '08:00', '09:00')]);
      await expect(
        service.upsert('org-1', { ...valid, startTime: '09:00' } as any),
      ).rejects.toThrow(/1 outside the new time range/);
    });

    it('reports several reasons together', async () => {
      const { service } = makeService([
        sched('c1', 6, '08:00', '09:00'), // inactive day
        sched('c2', 1, '12:00', '13:00'), // break clash
      ]);
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [{ label: 'Lunch', start: '12:00', end: '13:00' }],
        } as any),
      ).rejects.toThrow(/1 on a day you just removed.*1 overlapping a new break/);
    });

    it('scopes the check to the org and to live classes in non-ended years', async () => {
      const { service, db } = makeService([]);
      await service.upsert('org-1', valid as any);
      const where = db.classSchedule.findMany.mock.calls[0][0].where;
      expect(where.org_id).toBe('org-1');
      expect(where.class.deleted_at).toBeNull();
      expect(where.class.schoolYear.status).toEqual({ not: 'ended' });
    });
  });

  describe('break validation', () => {
    it('rejects a break that starts after it ends', async () => {
      const { service } = makeService();
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [{ label: 'Lunch', start: '13:00', end: '12:00' }],
        } as any),
      ).rejects.toThrow(/must start before it ends/);
    });

    it('rejects a break outside the school day', async () => {
      const { service } = makeService();
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [{ label: 'Early', start: '06:00', end: '07:00' }],
        } as any),
      ).rejects.toThrow(/must be inside the school day/);
    });

    it('rejects a break that is not slot-aligned', async () => {
      const { service } = makeService();
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [{ label: 'Lunch', start: '12:20', end: '13:00' }],
        } as any),
      ).rejects.toThrow(/must start on a 30m slot boundary/);
    });

    it('rejects a break whose length is not a multiple of the slot', async () => {
      const { service } = makeService();
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [{ label: 'Lunch', start: '12:00', end: '12:20' }],
        } as any),
      ).rejects.toThrow(/must last a multiple of 30m/);
    });

    it('rejects two overlapping breaks', async () => {
      const { service } = makeService();
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [
            { label: 'Lunch', start: '12:00', end: '13:00' },
            { label: 'Recess', start: '12:30', end: '13:30' },
          ],
        } as any),
      ).rejects.toThrow(/overlap/);
    });

    it('allows two adjacent breaks that do not overlap', async () => {
      const { service } = makeService();
      await expect(
        service.upsert('org-1', {
          ...valid,
          breaks: [
            { label: 'Recess', start: '10:00', end: '10:30' },
            { label: 'Lunch', start: '12:00', end: '13:00' },
          ],
        } as any),
      ).resolves.toBeDefined();
    });
  });
});