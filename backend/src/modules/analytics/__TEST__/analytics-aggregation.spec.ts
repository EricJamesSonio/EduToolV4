import { AnalyticsRepository } from '../analytics.repository';

// Perf Phase 4: educator load and grade stats are computed with server-side
// groupBy/aggregate — no full-row transfer into Node.

describe('AnalyticsRepository aggregation', () => {
  it('getEducatorLoad groups classes and enrollments server-side', async () => {
    const db = {
      class: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'c-1', educator_id: 'e-1' },
          { id: 'c-2', educator_id: 'e-1' },
          { id: 'c-3', educator_id: 'e-2' },
        ]),
      },
      enrollment: {
        groupBy: jest.fn().mockResolvedValue([
          { class_id: 'c-1', _count: { _all: 30 } },
          { class_id: 'c-2', _count: { _all: 10 } },
        ]),
      },
    };
    const repo = new AnalyticsRepository(db as never);

    const res = await repo.getEducatorLoad('org-1', 'sy-1');

    expect(res).toEqual([
      { educatorId: 'e-1', totalClasses: 2, totalStudents: 40 },
      { educatorId: 'e-2', totalClasses: 1, totalStudents: 0 },
    ]);
    // Lean class list (no enrollments include) + one grouped count.
    expect(db.class.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, educator_id: true },
      }),
    );
    expect(db.enrollment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['class_id'],
        _count: { _all: true },
      }),
    );
  });

  it('getGradeStats uses groupBy + aggregates with the locked-grade filter', async () => {
    const db = {
      grade: {
        groupBy: jest.fn().mockResolvedValue([
          { final_grade: 'A', _count: { _all: 2 } },
          { final_grade: 'B', _count: { _all: 1 } },
        ]),
        aggregate: jest
          .fn()
          .mockResolvedValueOnce({ _count: { _all: 3 }, _avg: { final_score: 80 } })
          .mockResolvedValueOnce({ _count: { _all: 2 } }),
      },
    };
    const repo = new AnalyticsRepository(db as never);

    const res = await repo.getGradeStats('org-1', 'sy-1', {
      classId: 'c-1',
    } as never);

    expect(res).toEqual({
      total: 3,
      averageScore: 80,
      passCount: 2,
      distribution: { A: 2, B: 1 },
    });
    expect(db.grade.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['final_grade'],
        where: expect.objectContaining({
          org_id: 'org-1',
          is_locked: true,
          class_id: 'c-1',
        }),
        _count: { _all: true },
      }),
    );
    // Passing aggregate constrains final_score >= 75 (same threshold as before).
    expect(db.grade.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ final_score: { gte: 75 } }),
        _count: { _all: true },
      }),
    );
  });
});
