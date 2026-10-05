import { SubjectPrerequisiteService } from '../subject-prerequisite.service';

// checkEligibilityForStudentsBatch is the transpose of checkEligibilityBatch:
// one class subject, many students. It backs the admin enrollment surfaces
// that gray out students the enroll gate would reject, so its decisions MUST
// match the gate — including manual SubjectCompletionOverride credits, which
// satisfy a prerequisite without a Grade row.

describe('SubjectPrerequisiteService.checkEligibilityForStudentsBatch', () => {
  const scale = {
    ranges: [
      { minPercent: 75, maxPercent: 100, isPassing: true },
      { minPercent: 0, maxPercent: 74, isPassing: false },
    ],
  };

  const makeService = (
    rows: Map<string, any[]>,
    overrides: Array<{ student_id: string; subject_id: string }> = [],
  ) => {
    const prereqRepository = {
      getPrerequisitesWithGradesForStudents: jest.fn().mockResolvedValue(rows),
      getPrerequisitesWithGradesForSubjects: jest.fn(),
      getPrerequisitesWithGrades: jest.fn(),
      findBySubjects: jest.fn(),
      findBySubject: jest.fn(),
    };
    const gradingScaleRepository = {
      findByClassId: jest.fn().mockResolvedValue(scale),
      findByClassIds: jest.fn(),
    };
    // The override delegate is read off `this.db`; supply it so the credit
    // branch is exercised the same way the real DatabaseService provides it.
    const db = {
      subjectCompletionOverride: {
        findMany: jest.fn().mockResolvedValue(overrides),
      },
    };
    const service = new SubjectPrerequisiteService(
      prereqRepository as any,
      gradingScaleRepository as any,
      db as never,
    );
    return { service, prereqRepository, gradingScaleRepository, db };
  };

  const grade = (
    score: number,
    locked: boolean,
    classId: string,
  ): Record<string, unknown> => ({
    final_score: score,
    is_locked: locked,
    class: { id: classId },
  });

  it('resolves a whole section in one batched call and one scale lookup per class', async () => {
    const rows = new Map<string, any[]>([
      [
        'stu-1',
        [{ subject_id: 'p-1', subject_name: 'Math', grade: grade(80, true, 'c-1') }],
      ],
      [
        'stu-2',
        [{ subject_id: 'p-1', subject_name: 'Math', grade: grade(60, true, 'c-1') }],
      ],
      ['stu-3', [{ subject_id: 'p-1', subject_name: 'Math', grade: null }]],
    ]);
    const { service, prereqRepository, gradingScaleRepository } = makeService(rows);

    const res = await service.checkEligibilityForStudentsBatch(
      'sub-1',
      ['stu-1', 'stu-2', 'stu-3'],
      'org-1',
    );

    // One call for the batch, not one per student.
    expect(prereqRepository.getPrerequisitesWithGradesForStudents).toHaveBeenCalledTimes(1);
    expect(prereqRepository.getPrerequisitesWithGradesForStudents).toHaveBeenCalledWith(
      'sub-1',
      ['stu-1', 'stu-2', 'stu-3'],
      'org-1',
    );
    // Both passing/failing rows resolve against the same class -> one lookup.
    expect(gradingScaleRepository.findByClassId).toHaveBeenCalledTimes(1);

    expect(res.get('stu-1')).toEqual({ eligible: true, missing: [] });
    expect(res.get('stu-2')).toEqual({
      eligible: false,
      missing: [{ subject_id: 'p-1', subject_name: 'Math', reason: 'not_passed' }],
    });
    expect(res.get('stu-3')).toEqual({
      eligible: false,
      missing: [{ subject_id: 'p-1', subject_name: 'Math', reason: 'not_taken' }],
    });
  });

  it('treats a SubjectCompletionOverride credit as satisfying the prerequisite', async () => {
    // Transferee: no Grade row at all, but an admin recorded manual completion.
    // Reporting this student as blocked would contradict the enroll gate.
    const rows = new Map<string, any[]>([
      ['stu-1', [{ subject_id: 'p-1', subject_name: 'Math', grade: null }]],
    ]);
    const { service, db } = makeService(rows, [
      { student_id: 'stu-1', subject_id: 'p-1' },
    ]);

    const res = await service.checkEligibilityForStudentsBatch(
      'sub-1',
      ['stu-1'],
      'org-1',
    );

    expect(db.subjectCompletionOverride.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'completed', org_id: 'org-1' }),
      }),
    );
    expect(res.get('stu-1')).toEqual({ eligible: true, missing: [] });
  });

  it('still blocks the other prerequisites a credited student is missing', async () => {
    const rows = new Map<string, any[]>([
      [
        'stu-1',
        [
          { subject_id: 'p-1', subject_name: 'Math', grade: null },
          { subject_id: 'p-2', subject_name: 'Sci', grade: null },
        ],
      ],
    ]);
    const { service } = makeService(rows, [
      { student_id: 'stu-1', subject_id: 'p-1' },
    ]);

    const res = await service.checkEligibilityForStudentsBatch(
      'sub-1',
      ['stu-1'],
      'org-1',
    );

    expect(res.get('stu-1')).toEqual({
      eligible: false,
      missing: [{ subject_id: 'p-2', subject_name: 'Sci', reason: 'not_taken' }],
    });
  });

  it('marks everyone eligible when the subject has no prerequisite links', async () => {
    const { service, prereqRepository, db } = makeService(new Map());

    const res = await service.checkEligibilityForStudentsBatch(
      'sub-1',
      ['stu-1', 'stu-2'],
      'org-1',
    );

    expect(prereqRepository.getPrerequisitesWithGradesForStudents).toHaveBeenCalledTimes(1);
    // No credits lookup needed when nothing is defined.
    expect(db.subjectCompletionOverride.findMany).not.toHaveBeenCalled();
    expect(res.get('stu-1')).toEqual({ eligible: true, missing: [] });
    expect(res.get('stu-2')).toEqual({ eligible: true, missing: [] });
  });

  it('returns an empty map without querying for an empty student list', async () => {
    const { service, prereqRepository } = makeService(new Map());

    const res = await service.checkEligibilityForStudentsBatch('sub-1', [], 'org-1');

    expect(res.size).toBe(0);
    expect(prereqRepository.getPrerequisitesWithGradesForStudents).not.toHaveBeenCalled();
  });

  it('de-duplicates repeated student ids', async () => {
    const rows = new Map<string, any[]>([
      ['stu-1', [{ subject_id: 'p-1', subject_name: 'Math', grade: grade(90, true, 'c-1') }]],
    ]);
    const { service, prereqRepository } = makeService(rows);

    await service.checkEligibilityForStudentsBatch(
      'sub-1',
      ['stu-1', 'stu-1', 'stu-1'],
      'org-1',
    );

    expect(prereqRepository.getPrerequisitesWithGradesForStudents).toHaveBeenCalledWith(
      'sub-1',
      ['stu-1'],
      'org-1',
    );
  });

  it('reports not_locked for a grade that exists but is not locked', async () => {
    const rows = new Map<string, any[]>([
      ['stu-1', [{ subject_id: 'p-1', subject_name: 'Math', grade: grade(95, false, 'c-1') }]],
    ]);
    const { service } = makeService(rows);

    const res = await service.checkEligibilityForStudentsBatch(
      'sub-1',
      ['stu-1'],
      'org-1',
    );

    expect(res.get('stu-1')).toEqual({
      eligible: false,
      missing: [{ subject_id: 'p-1', subject_name: 'Math', reason: 'not_locked' }],
    });
  });
});