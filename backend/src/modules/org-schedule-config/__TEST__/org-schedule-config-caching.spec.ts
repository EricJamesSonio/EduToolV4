import { OrgScheduleConfigService } from '../org-schedule-config.service';

// Perf Phase 6: getByOrg served from cache; upsert invalidates.

describe('OrgScheduleConfigService caching', () => {
  const row = {
    id: 'cfg-1',
    org_id: 'org-1',
    start_time: '08:00',
    end_time: '17:00',
    slot_duration: 60,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const makeService = () => {
    const repo = {
      upsertDefaults: jest.fn().mockResolvedValue(row),
      upsert: jest.fn().mockResolvedValue(row),
    };
    const store = new Map<string, unknown>();
    const cache = {
      key: jest.fn((...parts: Array<string | number>) => parts.join(':')),
      cached: jest.fn(
        async (key: string, _ttl: number, loader: () => Promise<unknown>) => {
          if (!store.has(key)) store.set(key, await loader());
          return store.get(key);
        },
      ),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      delByPrefix: jest.fn(),
    };
    const service = new OrgScheduleConfigService(
      repo as any,
      { classSchedule: { findMany: jest.fn().mockResolvedValue([]) } } as any,
      cache as any,
    );
    return { service, repo, cache };
  };

  it('reads config once for repeated getByOrg', async () => {
    const { service, repo } = makeService();
    await service.getByOrg('org-1');
    await service.getByOrg('org-1');
    expect(repo.upsertDefaults).toHaveBeenCalledTimes(1);
  });

  it('upsert invalidates so the next read re-loads', async () => {
    const { service, repo, cache } = makeService();
    await service.getByOrg('org-1');
    await service.upsert('org-1', {
      startTime: '07:00',
      endTime: '17:00',
      slotDuration: 60,
    } as any);
    expect(cache.del).toHaveBeenCalledWith('org:org-1:schedule-config');
    await service.getByOrg('org-1');
    expect(repo.upsertDefaults).toHaveBeenCalledTimes(2);
  });
});
