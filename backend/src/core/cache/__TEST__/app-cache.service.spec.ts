import { AppCacheService, APP_CACHE_TTL } from '../app-cache.service';

describe('AppCacheService', () => {
  const makeService = () => {
    const store = new Map<string, { value: unknown; expiresAt: number }>();
    const cache = {
      get: jest.fn(async (key: string) => {
        const entry = store.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
          store.delete(key);
          return undefined;
        }
        return entry.value;
      }),
      set: jest.fn(async (key: string, value: unknown, ttlMs?: number) => {
        store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? 0) });
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
    };
    const service = new AppCacheService(cache as never);
    return { service, cache, store };
  };

  it('loads once then serves hits without calling the loader', async () => {
    const { service, cache } = makeService();
    const loader = jest.fn().mockResolvedValue({ name: 'org' });

    const first = await service.cached('org:x', APP_CACHE_TTL.orgSettings, loader);
    const second = await service.cached('org:x', APP_CACHE_TTL.orgSettings, loader);

    expect(first).toEqual({ name: 'org' });
    expect(second).toEqual({ name: 'org' });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledWith(
      'org:x',
      { name: 'org' },
      APP_CACHE_TTL.orgSettings,
    );
  });

  it('never caches nullish reads', async () => {
    const { service, cache } = makeService();
    const loader = jest.fn().mockResolvedValue(null);

    expect(await service.cached('org:missing', 1000, loader)).toBeNull();
    expect(await service.cached('org:missing', 1000, loader)).toBeNull();
    expect(loader).toHaveBeenCalledTimes(2);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('del and delByPrefix invalidate tracked keys', async () => {
    const { service } = makeService();
    const loader = jest.fn().mockResolvedValue('v');
    await service.cached('org:a:scale', 60000, loader);
    await service.cached('org:a:settings', 60000, loader);
    await service.cached('org:b:scale', 60000, loader);

    await service.delByPrefix('org:a:');
    expect(loader).toHaveBeenCalledTimes(3);
    await service.cached('org:a:scale', 60000, loader);
    await service.cached('org:a:settings', 60000, loader);
    await service.cached('org:b:scale', 60000, loader);
    // Only the org:a:* keys reloaded; org:b:* still cached.
    expect(loader).toHaveBeenCalledTimes(5);

    await service.del('org:b:scale');
    await service.cached('org:b:scale', 60000, loader);
    expect(loader).toHaveBeenCalledTimes(6);
  });

  it('builds colon-joined keys', () => {
    const { service } = makeService();
    expect(service.key('org', 'o-1', 'scale', 'c-1')).toBe('org:o-1:scale:c-1');
  });
});
