import { SubjectService } from '../subject.service';

// getHierarchy level scoping.
//
// Two rules this pins down:
//  1. A levelId narrows the PRIMARY subject set to that level.
//  2. `levels` is NOT filtered by levelId — the client renders it as the Level
//     dropdown, so filtering it would collapse the dropdown to a single option
//     with no way to switch back.
//  3. Direct prerequisites from other levels are still returned as nodes so
//     edges never dangle and the client can resolve prerequisite names.

describe('SubjectService.getHierarchy level scoping', () => {
  const orgId = 'org-1';
  const programId = 'prog-1';

  const levelRow = (id: string, name: string, rank: number) => ({
    id,
    name,
    program_id: programId,
    course_id: null,
    strand_id: null,
    rank,
  });

  const subjectRow = (
    id: string,
    name: string,
    levelId: string | null,
    rank: number,
  ) => ({
    id,
    name,
    level_id: levelId,
    course_id: null,
    strand_id: null,
    year_level: null,
    term_label: null,
    level: levelId ? { id: levelId, name: `Level ${levelId}` } : null,
    course: null,
    strand: null,
    __rank: rank,
  });

  const build = (
    subjectRows: any[],
    linkRows: any[] = [],
    extraNodeRows: any[] = [],
  ) => {
    const db = {
      level: { findMany: jest.fn().mockResolvedValue([
        levelRow('lvl-1', 'Year 1', 1),
        levelRow('lvl-2', 'Year 2', 2),
        levelRow('lvl-3', 'Year 3', 3),
      ]) },
      program: { findMany: jest.fn().mockResolvedValue([]) },
      subject: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(subjectRows)
          .mockResolvedValueOnce(extraNodeRows),
      },
      subjectPrerequisite: {
        findMany: jest.fn().mockResolvedValue(linkRows),
      },
    };
    const service = new SubjectService({} as never, db as never);
    return { service, db };
  };

  it('returns every in-scope level in `levels` even when levelId is set', async () => {
    const { service } = build([subjectRow('s3', 'Calculus', 'lvl-3', 3)]);

    const res = await service.getHierarchy(orgId, {
      programId,
      levelId: 'lvl-3',
    });

    // The dropdown must keep all options.
    expect(res.levels.map((l: any) => l.id)).toEqual(['lvl-1', 'lvl-2', 'lvl-3']);
  });

  it('narrows the primary subject set to the selected level', async () => {
    const { service, db } = build([
      subjectRow('s2', 'Math', 'lvl-2', 2),
      subjectRow('s3', 'Calculus', 'lvl-3', 3),
    ]);

    await service.getHierarchy(orgId, { programId, levelId: 'lvl-3' });

    // level_id pushed into the subject query.
    expect(db.subject.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ level_id: 'lvl-3' }),
      }),
    );
  });

  it('does NOT push level_id onto the level query', async () => {
    const { service, db } = build([subjectRow('s3', 'Calculus', 'lvl-3', 3)]);

    await service.getHierarchy(orgId, { programId, levelId: 'lvl-3' });

    expect(db.level.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ id: 'lvl-3' }),
      }),
    );
  });

  it('keeps direct prerequisites from other levels as nodes so edges do not dangle', async () => {
    const { service } = build(
      [subjectRow('s3', 'Calculus', 'lvl-3', 3)],
      [
        {
          subject_id: 's3',
          prerequisite_id: 's2',
          prerequisite: { id: 's2', name: 'Math' },
        },
      ],
      [subjectRow('s2', 'Math', 'lvl-2', 2)],
    );

    const res = await service.getHierarchy(orgId, { programId, levelId: 'lvl-3' });

    const ids = res.nodes.map((n: any) => n.id).sort();
    expect(ids).toContain('s3');
    expect(ids).toContain('s2'); // prerequisite from Year 2 still present
    expect(res.edges).toEqual([{ from: 's2', to: 's3' }]);
  });

  it('leaves the subject query untouched when no levelId is given', async () => {
    const { service, db } = build([
      subjectRow('s1', 'Alg1', 'lvl-1', 1),
      subjectRow('s2', 'Math', 'lvl-2', 2),
    ]);

    const res = await service.getHierarchy(orgId, { programId });

    expect(
      db.subject.findMany.mock.calls[0][0].where,
    ).not.toHaveProperty('level_id');
    expect(res.nodes).toHaveLength(2);
  });
});