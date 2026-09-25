import { GradeRepository } from '../grade.repository';
import { GradeEducatorService } from '../educator/grade-educator.service';
import { GradeCoreService } from '../core/grade-core.service';

// Perf Phase 2 commit 4: computeGrades persists via one batched
// saveComputedGrades() (single lock check + chunked transaction) instead of
// N sequential upserts. Locked rows are skipped, mirroring the
// recomputeStudentGrade locked-skip guard.

describe('GradeRepository.saveComputedGrades', () => {
  const makeRepo = (existing: Array<{ student_id: string; is_locked: boolean }>) => {
    const upsertCalls: unknown[][] = [];
    const txCalls: unknown[][] = [];
    const db = {
      grade: {
        findMany: jest.fn().mockResolvedValue(existing),
        // Emulate Prisma batch-tx input: upsert() returns a "pending op"
        // object synchronously (no promise) until $transaction executes it.
        upsert: jest.fn((args: unknown) => {
          upsertCalls.push([args]);
          return { __op: args };
        }),
      },
      $transaction: jest.fn(async (ops: unknown[]) => {
        txCalls.push([ops]);
        return ops;
      }),
    };
    const repo = new GradeRepository(db as never);
    return { repo, db, upsertCalls, txCalls };
  };

  const rows = [
    { studentId: 's-1', finalScore: 80, finalGrade: 'Pass' },
    { studentId: 's-2', finalScore: 60, finalGrade: 'Fail' },
  ];

  it('fast path: no rows → no queries at all', async () => {
    const { repo, db } = makeRepo([]);
    const res = await repo.saveComputedGrades({
      orgId: 'o',
      classId: 'c',
      termId: 't',
      rows: [],
    });
    expect(res).toEqual({ computed: 0, skippedLocked: 0 });
    expect(db.grade.findMany).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('single lock check + single transaction chunk; locked rows skipped', async () => {
    const { repo, db, txCalls } = makeRepo([
      { student_id: 's-2', is_locked: true },
    ]);
    const res = await repo.saveComputedGrades({
      orgId: 'o',
      classId: 'c',
      termId: 't',
      rows,
    });
    expect(res).toEqual({ computed: 1, skippedLocked: 1 });
    expect(db.grade.findMany).toHaveBeenCalledTimes(1);
    expect(db.grade.findMany).toHaveBeenCalledWith({
      where: { org_id: 'o', class_id: 'c', term_id: 't' },
      select: { student_id: true, is_locked: true },
    });
    // 2 writable rows would fit one chunk; here only s-1 is writable.
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(txCalls[0][0]).toHaveLength(1);
  });

  it('chunks transactions at 50 ops', async () => {
    const { repo, db } = makeRepo([]);
    const big = Array.from({ length: 120 }, (_, i) => ({
      studentId: `s-${i}`,
      finalScore: 75,
      finalGrade: 'Pass',
    }));
    const res = await repo.saveComputedGrades({
      orgId: 'o',
      classId: 'c',
      termId: 't',
      rows: big,
    });
    expect(res).toEqual({ computed: 120, skippedLocked: 0 });
    expect(db.$transaction).toHaveBeenCalledTimes(3);
  });
});

describe('GradeEducatorService.computeGrades — batched persist', () => {
  it('computes in memory and persists once; never calls per-student upsert', async () => {
    const cls = {
      id: 'class-1',
      subject_id: 'subj-1',
      school_year_id: 'sy-1',
      educator_id: 'e-1',
      enrollments: [{ student_id: 's-1' }, { student_id: 's-2' }],
    };
    const repo = {
      db: {
        class: { findFirst: jest.fn().mockResolvedValue({ educator_id: 'e-1' }) },
      },
      findClassWithSubject: jest.fn().mockResolvedValue(cls),
      findGradingSchemeForClass: jest.fn().mockResolvedValue({
        components: [{ name: 'Quiz', type: 'quiz', weight: 100, max_score: 20 }],
      }),
      findSubmissionsForTerm: jest.fn().mockResolvedValue([
        {
          student_id: 's-1',
          assessment_id: 'a-1',
          status: 'graded',
          score: 10,
          manual_score: null,
          system_section_score: null,
          manual_section_score: null,
          is_missed: false,
          is_exempted: false,
          assessment: { grading_mode: 'system' },
        },
      ]),
      findAssessmentsForTerm: jest.fn().mockResolvedValue([
        { id: 'a-1', type: 'quiz', total_items: 20 },
      ]),
      findManualScores: jest.fn().mockResolvedValue([]),
      findEnrollmentDatesByClass: jest.fn().mockResolvedValue([]),
      findGradingOverridesByClass: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
      saveComputedGrades: jest
        .fn()
        .mockResolvedValue({ computed: 2, skippedLocked: 0 }),
    };
    const auditLog = { logActivityEvent: jest.fn().mockResolvedValue(undefined) };
    const service = new GradeEducatorService(
      repo as any,
      new GradeCoreService(),
      auditLog as any,
    );
    jest
      .spyOn(service as any, 'resolveGradingScale')
      .mockResolvedValue({ ranges: [] });

    const res = await service.computeGrades('class-1', 't-1', 'org-1', 'e-1');

    expect(repo.upsert).not.toHaveBeenCalled();
    expect(repo.saveComputedGrades).toHaveBeenCalledTimes(1);
    const payload = repo.saveComputedGrades.mock.calls[0][0];
    expect(payload.orgId).toBe('org-1');
    expect(payload.rows).toHaveLength(2);
    // s-1: single quiz sub 10/20 → 50%; s-2: missing → 0%
    expect(payload.rows[0]).toMatchObject({ studentId: 's-1', finalScore: 50 });
    expect(payload.rows[1]).toMatchObject({ studentId: 's-2', finalScore: 0 });
    expect(res).toMatchObject({ computed: 2, skippedLocked: 0 });
  });
});
