import { OrgEnrollmentSettingService } from '../org-enrollment-setting.service';

// Perf Phase 6: getByOrg served from cache; upsert invalidates.

describe('OrgEnrollmentSettingService caching', () => {
  const makeService = () => {
    const repo = { upsert: jest.fn().mockResolvedValue({ id: 's-1' }) };
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
    const service = new OrgEnrollmentSettingService(repo as any, cache as any);
    return { service, repo, cache };
  };

  it('reads settings once for repeated getByOrg', async () => {
    const { service, repo } = makeService();
    await service.getByOrg('org-1');
    await service.getByOrg('org-1');
    expect(repo.upsert).toHaveBeenCalledTimes(1);
  });

  it('upsert invalidates so the next read re-loads', async () => {
    const { service, repo, cache } = makeService();
    await service.getByOrg('org-1');
    await service.upsert('org-1', {} as any);
    expect(cache.del).toHaveBeenCalledWith('org:org-1:enrollment-setting');
    await service.getByOrg('org-1');
    expect(repo.upsert).toHaveBeenCalledTimes(3);
  });
});
