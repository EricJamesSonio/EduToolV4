import { GradingScaleRepository } from '../grading-scale.repository';

// Perf Phase 6: class→scale resolution cached 5m at the repository seam
// (covers all consumers: controller path, eligibility checks).

describe('GradingScaleRepository.findByClassId caching', () => {
  const scale = { id: 'scale-1', ranges: [] };

  const makeRepo = () => {
    const db = {
      class: {
        findMany: jest.fn(),
        findFirst: jest.fn().mockResolvedValue({
          school_year_id: 'sy-1',
          subject: { program_id: 'p-1' },
        }),
      },
      gradingScaleAssignment: {
        findFirst: jest.fn().mockResolvedValue({ grading_scale: scale }),
        findMany: jest.fn(),
      },
      gradingScale: {},
    };
    const store = new Map<string, unknown>();
    const cache = {
      key: jest.fn((...parts: Array<string | number>) => parts.join(':')),
      cached: jest.fn(
        async (key: string, _ttl: number, loader: () => Promise<unknown>) => {
          if (!store.has(key)) {
            const value = await loader();
            if (value !== undefined && value !== null) store.set(key, value);
          }
          return store.get(key) ?? null;
        },
      ),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      delByPrefix: jest.fn(async (prefix: string) => {
        for (const k of [...store.keys()]) {
          if (k.startsWith(prefix)) store.delete(k);
        }
      }),
    };
    const repo = new GradingScaleRepository(db as never, cache as never);
    return { repo, db, cache };
  };

  it('resolves once for repeated lookups of the same class', async () => {
    const { repo, db } = makeRepo();
    await repo.findByClassId('c-1', 'org-1');
    await repo.findByClassId('c-1', 'org-1');
    expect(db.class.findFirst).toHaveBeenCalledTimes(1);
    expect(db.gradingScaleAssignment.findFirst).toHaveBeenCalledTimes(1);
  });

  it('invalidateScaleCache drops the org prefix so the next read re-loads', async () => {
    const { repo, db, cache } = makeRepo();
    await repo.findByClassId('c-1', 'org-1');
    await repo.invalidateScaleCache('org-1');
    expect(cache.delByPrefix).toHaveBeenCalledWith('org:org-1:scale');
    await repo.findByClassId('c-1', 'org-1');
    expect(db.class.findFirst).toHaveBeenCalledTimes(2);
  });
});
