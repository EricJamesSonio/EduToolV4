import { GradeRepository } from '../grade.repository';

// TICK-GRADE-004 (business-logic change, NOT perf): bulk compute with
// { skipLocked: true } must NEVER write a locked grade row. These tests pin
// the locked-row cases specifically: locked untouched, unlocked written,
// mixed batch, all-locked batch, and the surfaced skippedLocked count.
// Default path (no option) keeps pure-overwrite semantics — see
// grade-compute-batching.spec.ts.

describe('GradeRepository.saveComputedGrades with skipLocked', () => {
  const makeRepo = (
    existing: Array<{ student_id: string; is_locked: boolean }>,
  ) => {
    const txOps: unknown[][] = [];
    const db = {
      grade: {
        findMany: jest.fn().mockResolvedValue(existing),
        upsert: jest.fn((args: unknown) => ({ __op: args })),
      },
      $transaction: jest.fn(async (ops: unknown[]) => {
        txOps.push(ops);
        return ops;
      }),
    };
    const repo = new GradeRepository(db as never);
    return { repo, db, txOps };
  };

  const rows = [
    { studentId: 's-locked', finalScore: 10, finalGrade: 'Fail' },
    { studentId: 's-open', finalScore: 90, finalGrade: 'Pass' },
  ];

  it('leaves the locked row untouched and writes the unlocked one', async () => {
    const { repo, db, txOps } = makeRepo([
      { student_id: 's-locked', is_locked: true },
      { student_id: 's-open', is_locked: false },
    ]);

    const res = await repo.saveComputedGrades(
      { orgId: 'o', classId: 'c', termId: 't', rows },
      { skipLocked: true },
    );

    expect(res).toEqual({ computed: 1, skippedLocked: 1 });
    expect(db.grade.findMany).toHaveBeenCalledTimes(1);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(txOps[0]).toHaveLength(1);
    const upsertArg = db.grade.upsert.mock.calls[0][0] as {
      where: { org_id_student_id_class_id_term_id: { student_id: string } };
    };
    expect(
      upsertArg.where.org_id_student_id_class_id_term_id.student_id,
    ).toBe('s-open');
  });

  it('all-locked batch writes nothing but still reports the skip', async () => {
    const { repo, db } = makeRepo([
      { student_id: 's-locked', is_locked: true },
    ]);

    const res = await repo.saveComputedGrades(
      {
        orgId: 'o',
        classId: 'c',
        termId: 't',
        rows: [rows[0]],
      },
      { skipLocked: true },
    );

    expect(res).toEqual({ computed: 0, skippedLocked: 1 });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('default path still overwrites locked rows (no silent change)', async () => {
    const { repo, db } = makeRepo([
      { student_id: 's-locked', is_locked: true },
    ]);

    const res = await repo.saveComputedGrades({
      orgId: 'o',
      classId: 'c',
      termId: 't',
      rows,
    });

    expect(res).toEqual({ computed: 2, skippedLocked: 0 });
    expect(db.grade.findMany).not.toHaveBeenCalled();
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });
});
