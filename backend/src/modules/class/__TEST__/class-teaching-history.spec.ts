import { ClassRepository } from '../class.repository';
import { ClassService } from '../class.service';

describe('Phase 6 — Educator Teaching History', () => {
  it('repository: findTeachingHistoryByEducator includes archived (deleted_at not filtered) unlike findActive', async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      { id: 'class-active', deleted_at: null, school_year_id: 'sy-2026' },
      { id: 'class-archived', deleted_at: new Date('2026-07-01'), school_year_id: 'sy-2025' },
    ]);
    const db = { class: { findMany: mockFindMany } } as unknown as never;
    const repo = new ClassRepository(db as never);

    const history = await repo.findTeachingHistoryByEducator('edu-1', 'org-1');

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ educator_id: 'edu-1', org_id: 'org-1' }),
      }),
    );
    const whereArg = mockFindMany.mock.calls[0][0].where;
    expect(whereArg).not.toHaveProperty('deleted_at');
    expect(history).toHaveLength(2);
    expect(history.map((c) => c.id)).toEqual(['class-active', 'class-archived']);

    // Contrast: active-only query filters deleted_at: null
    const mockFindActive = jest.fn().mockResolvedValue([{ id: 'class-active' }]);
    const db2 = { class: { findMany: mockFindActive } } as unknown as never;
    const repo2 = new ClassRepository(db2 as never);
    const activeOnly = await repo2.findActiveClassesByEducator('edu-1', 'org-1');
    expect(mockFindActive).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deleted_at: null }) }),
    );
    expect(activeOnly).toHaveLength(1);
  });

  it('service delegates and preserves ordering across school years', async () => {
    const repo = {
      findTeachingHistoryByEducator: jest.fn().mockResolvedValue([
        { id: 'c1', school_year_id: 'sy-2025', deleted_at: new Date(), subject: { name: 'Old Subject' } },
        { id: 'c2', school_year_id: 'sy-2026', deleted_at: null, subject: { name: 'New Subject' } },
      ]),
    } as unknown as ClassRepository;

    const service = new ClassService(
      repo as never,
      { getStudentEnrollments: jest.fn() } as never,
      { generateSessionsForClass: jest.fn() } as never,
      { logAdminAction: jest.fn().mockResolvedValue(undefined) } as never,
      { autoApplyForNewClass: jest.fn() } as never,
      { checkEligibility: jest.fn().mockResolvedValue({ eligible: true, missing: [] }) } as never,
      {} as never,
    );

    const history = await service.getEducatorTeachingHistory('edu-1', 'org-1');
    expect(repo.findTeachingHistoryByEducator).toHaveBeenCalledWith('edu-1', 'org-1');
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe('c1');
    expect(history[1].id).toBe('c2');
  });
});
