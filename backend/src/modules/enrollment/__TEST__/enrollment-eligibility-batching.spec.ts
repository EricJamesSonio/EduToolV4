import { resolveSubjectAcademicStructures } from '../enrollment-eligibility.util';

// Perf Phase 5: batched structure resolution — one subject query for many
// subjects, identical program precedence and set semantics as the single path.

describe('resolveSubjectAcademicStructures', () => {
  const makeDb = (subjects: any[]) => ({
    subject: { findMany: jest.fn().mockResolvedValue(subjects) },
  });

  it('returns empty map for empty input without querying', async () => {
    const db = makeDb([]);
    const res = await resolveSubjectAcademicStructures(db as never, [], 'org-1');
    expect(res.size).toBe(0);
    expect(db.subject.findMany).not.toHaveBeenCalled();
  });

  it('resolves direct, course/strand/level, and sharing programs with one query', async () => {
    const db = makeDb([
      {
        id: 's-direct',
        program_id: 'p-1',
        course_id: null,
        strand_id: null,
        level_id: null,
        course: null,
        strand: null,
        level: null,
        sharings: [],
      },
      {
        id: 's-course',
        program_id: null,
        course_id: 'c-1',
        strand_id: null,
        level_id: 'l-1',
        course: { program_id: 'p-2' },
        strand: null,
        level: { program_id: 'p-9' },
        sharings: [],
      },
      {
        id: 's-shared',
        program_id: null,
        course_id: null,
        strand_id: null,
        level_id: null,
        course: null,
        strand: null,
        level: null,
        sharings: [
          {
            course_id: 'c-2',
            strand_id: null,
            level_id: 'l-2',
            course: { program_id: null },
            strand: null,
            level: { program_id: 'p-3' },
          },
        ],
      },
    ]);

    const res = await resolveSubjectAcademicStructures(
      db as never,
      ['s-direct', 's-course', 's-shared', 's-direct'],
      'org-1',
    );

    expect(db.subject.findMany).toHaveBeenCalledTimes(1);
    expect(db.subject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['s-direct', 's-course', 's-shared'] }, org_id: 'org-1' },
      }),
    );
    // Direct link wins.
    expect(res.get('s-direct')).toEqual({
      programId: 'p-1',
      courseIds: [],
      strandIds: [],
      levelIds: [],
    });
    // Course beats level; own ids collected.
    expect(res.get('s-course')).toEqual({
      programId: 'p-2',
      courseIds: ['c-1'],
      strandIds: [],
      levelIds: ['l-1'],
    });
    // Sharing program + sharing-bound ids collected.
    expect(res.get('s-shared')).toEqual({
      programId: 'p-3',
      courseIds: ['c-2'],
      strandIds: [],
      levelIds: ['l-2'],
    });
  });

  it('omits unknown subjects so callers treat them as ineligible', async () => {
    const db = makeDb([]);
    const res = await resolveSubjectAcademicStructures(db as never, ['s-gone'], 'org-1');
    expect(res.has('s-gone')).toBe(false);
  });
});
