import { GradeLockValidator } from '../grade-lock.validator';

// Perf Phase 3: validateReadiness loads class-wide assessments + submissions
// once and groups by term in memory (was 2 sequential queries per term).

describe('GradeLockValidator.validateReadiness — batched terms', () => {
  const makeService = () => {
    const gradeRepo = {
      findClassWithSubject: jest.fn().mockResolvedValue({
        id: 'class-1',
        enrollments: [{ student_id: 's-1' }, { student_id: 's-2' }],
      }),
      findStudentProfiles: jest.fn().mockResolvedValue(
        new Map([
          ['s-1', { name: 'Alice', code: 'STU1' }],
          ['s-2', { name: 'Bob', code: 'STU2' }],
        ]),
      ),
      findGradingSchemeForClass: jest.fn().mockResolvedValue({
        components: [
          { type: 'quiz', is_optional: false },
          { type: 'exam', is_optional: false },
        ],
      }),
      findTemplateTermsByClass: jest.fn().mockResolvedValue([
        { id: 't-1', name: 'Term 1' },
        { id: 't-2', name: 'Term 2' },
      ]),
      findClassAssessments: jest.fn().mockResolvedValue([
        { id: 'a-1', type: 'quiz', title: 'Q1', term_id: 't-1' },
        { id: 'a-2', type: 'exam', title: 'E1', term_id: 't-2' },
      ]),
      findSubmissionsForClass: jest.fn().mockResolvedValue([
        { student_id: 's-1', assessment_id: 'a-1', status: 'submitted' },
        { student_id: 's-1', assessment_id: 'a-2', status: 'submitted' },
        { student_id: 's-2', assessment_id: 'a-1', status: 'draft' },
      ]),
      // Old per-term methods must NOT be used anymore.
      findAssessmentsForTerm: jest.fn(),
      findSubmissionsForTerm: jest.fn(),
    };
    const service = new GradeLockValidator({} as any, gradeRepo as any);
    return { service, gradeRepo };
  };

  it('reports missing submissions with one batched load', async () => {
    const { service, gradeRepo } = makeService();
    const res = await service.validateReadiness('class-1', 'org-1');

    // s-2 draft on a-1 → missing; s-2 no sub on a-2 → missing; s-1 complete.
    expect(res.ready).toBe(false);
    expect(res.issues).toHaveLength(2);
    expect(res.issues[0]).toMatchObject({
      type: 'missing_submission',
      termId: 't-1',
      studentId: 's-2',
      studentName: 'Bob',
      assessmentId: 'a-1',
    });
    expect(res.issues[1]).toMatchObject({
      type: 'missing_submission',
      termId: 't-2',
      studentId: 's-2',
      assessmentId: 'a-2',
    });

    expect(gradeRepo.findClassAssessments).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findSubmissionsForClass).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findAssessmentsForTerm).not.toHaveBeenCalled();
    expect(gradeRepo.findSubmissionsForTerm).not.toHaveBeenCalled();
  });

  it('is ready when every student has non-draft submissions everywhere', async () => {
    const { service, gradeRepo } = makeService();
    gradeRepo.findSubmissionsForClass.mockResolvedValue([
      { student_id: 's-1', assessment_id: 'a-1', status: 'submitted' },
      { student_id: 's-1', assessment_id: 'a-2', status: 'submitted' },
      { student_id: 's-2', assessment_id: 'a-1', status: 'submitted' },
      { student_id: 's-2', assessment_id: 'a-2', status: 'submitted' },
    ]);

    const res = await service.validateReadiness('class-1', 'org-1');
    expect(res).toEqual({ ready: true, issues: [] });
  });
});
