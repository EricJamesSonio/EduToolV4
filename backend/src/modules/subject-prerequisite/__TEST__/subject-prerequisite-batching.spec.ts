import { SubjectPrerequisiteService } from '../subject-prerequisite.service';

// Perf Phase 5: checkEligibilityBatch evaluates many subjects with batched
// row queries and one shared scale cache — decisions identical to the single
// path (not_taken / not_locked / not_passed).

describe('SubjectPrerequisiteService.checkEligibilityBatch', () => {
  const scale = {
    ranges: [
      { minPercent: 75, maxPercent: 100, isPassing: true },
      { minPercent: 0, maxPercent: 74, isPassing: false },
    ],
  };

  const makeService = (rows: Map<string, any[]>, defined: any[] = []) => {
    const prereqRepository = {
      getPrerequisitesWithGradesForSubjects: jest.fn().mockResolvedValue(rows),
      findBySubjects: jest.fn().mockResolvedValue(defined),
      getPrerequisitesWithGrades: jest.fn(),
      findBySubject: jest.fn(),
    };
    const gradingScaleRepository = {
      findByClassId: jest.fn().mockResolvedValue(scale),
      findByClassIds: jest.fn(),
    };
    const service = new SubjectPrerequisiteService(
      prereqRepository as any,
      gradingScaleRepository as any,
      {} as never,
    );
    return { service, prereqRepository, gradingScaleRepository };
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

  it('batches rows and shares one scale lookup per class across subjects', async () => {
    const rows = new Map<string, any[]>([
      [
        's-1',
        [
          { subject_id: 'p-1', subject_name: 'Math', grade: grade(80, true, 'c-1') },
          { subject_id: 'p-2', subject_name: 'Sci', grade: null },
        ],
      ],
      [
        's-2',
        [{ subject_id: 'p-1', subject_name: 'Math', grade: grade(60, true, 'c-1') }],
      ],
    ]);
    const { service, prereqRepository, gradingScaleRepository } = makeService(rows);

    const res = await service.checkEligibilityBatch(['s-1', 's-2'], 'stu-1', 'org-1');

    expect(prereqRepository.getPrerequisitesWithGradesForSubjects).toHaveBeenCalledTimes(1);
    expect(prereqRepository.getPrerequisitesWithGradesForSubjects).toHaveBeenCalledWith(
      ['s-1', 's-2'],
      'stu-1',
      'org-1',
    );
    // Same class c-1 graded twice across subjects → one scale lookup.
    expect(gradingScaleRepository.findByClassId).toHaveBeenCalledTimes(1);

    expect(res.get('s-1')).toEqual({
      eligible: false,
      missing: [{ subject_id: 'p-2', subject_name: 'Sci', reason: 'not_taken' }],
    });
    expect(res.get('s-2')).toEqual({
      eligible: false,
      missing: [{ subject_id: 'p-1', subject_name: 'Math', reason: 'not_passed' }],
    });
  });

  it('falls back to defined links for subjects with zero rows', async () => {
    const { service, prereqRepository } = makeService(new Map(), [
      {
        subject_id: 's-9',
        prerequisite_id: 'p-9',
        prerequisite: { name: 'Art' },
      },
    ]);

    const res = await service.checkEligibilityBatch(['s-9'], 'stu-1', 'org-1');

    expect(prereqRepository.findBySubjects).toHaveBeenCalledTimes(1);
    expect(res.get('s-9')).toEqual({
      eligible: false,
      missing: [{ subject_id: 'p-9', subject_name: 'Art', reason: 'not_taken' }],
    });
  });

  it('single checkEligibility delegates to the batch path', async () => {
    const rows = new Map<string, any[]>([
      [
        's-1',
        [{ subject_id: 'p-1', subject_name: 'Math', grade: grade(90, true, 'c-1') }],
      ],
    ]);
    const { service, prereqRepository } = makeService(rows);

    const res = await service.checkEligibility('s-1', 'stu-1', 'org-1');

    expect(prereqRepository.getPrerequisitesWithGrades).not.toHaveBeenCalled();
    expect(res).toEqual({ eligible: true, missing: [] });
  });
});
