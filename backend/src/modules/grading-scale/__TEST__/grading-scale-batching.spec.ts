import { GradingScaleRepository } from '../grading-scale.repository';

// Perf Phase 5: findByClassIds resolves scales for many classes with 2
// queries; unresolvable classes map to null like the single path.

describe('GradingScaleRepository.findByClassIds', () => {
  const makeRepo = () => {
    const db = {
      class: { findMany: jest.fn() },
      gradingScaleAssignment: { findMany: jest.fn() },
    };
    return { repo: new GradingScaleRepository(db as never), db };
  };

  it('returns empty map without querying for empty input', async () => {
    const { repo, db } = makeRepo();
    const res = await repo.findByClassIds([], 'org-1');
    expect(res.size).toBe(0);
    expect(db.class.findMany).not.toHaveBeenCalled();
  });

  it('maps scales by program+year combo; null when unresolvable', async () => {
    const { repo, db } = makeRepo();
    db.class.findMany.mockResolvedValue([
      { id: 'c-1', school_year_id: 'sy-1', subject: { program_id: 'p-1' } },
      { id: 'c-2', school_year_id: 'sy-1', subject: { program_id: 'p-1' } },
      { id: 'c-3', school_year_id: 'sy-1', subject: { program_id: null } },
    ]);
    const scale = { id: 'scale-1', ranges: [] };
    db.gradingScaleAssignment.findMany.mockResolvedValue([
      { program_id: 'p-1', school_year_id: 'sy-1', grading_scale: scale },
    ]);

    const res = await repo.findByClassIds(['c-1', 'c-2', 'c-3', 'c-1'], 'org-1');

    expect(db.class.findMany).toHaveBeenCalledTimes(1);
    expect(db.gradingScaleAssignment.findMany).toHaveBeenCalledTimes(1);
    expect(res.get('c-1')).toBe(scale);
    expect(res.get('c-2')).toBe(scale);
    expect(res.get('c-3')).toBeNull();
  });
});
