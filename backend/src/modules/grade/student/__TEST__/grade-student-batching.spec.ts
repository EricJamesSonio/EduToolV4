import { GradeStudentService } from '../grade-student.service';
import { GradeCoreService } from '../../core/grade-core.service';

// Perf Phase 3: getMyGrades loads the whole class-term picture in 5 queries
// (was 5 per term) and assembles per-term rows in memory.

describe('GradeStudentService.getMyGrades — batched terms', () => {
  const terms = [
    { id: 't-1', name: 'Term 1', semesterName: 'Sem 1', semesterIndex: 1 },
    { id: 't-2', name: 'Term 2', semesterName: 'Sem 1', semesterIndex: 1 },
  ];
  const scheme = {
    components: [{ name: 'Quiz', type: 'quiz', weight: 100, max_score: 20 }],
  };

  const makeService = () => {
    const gradeRepo = {
      findClassWithSubject: jest.fn().mockResolvedValue({ id: 'class-1' }),
      findTemplateTermsByClass: jest.fn().mockResolvedValue(terms),
      findByClass: jest.fn().mockResolvedValue([
        {
          student_id: 'stu-1',
          term_id: 't-1',
          final_score: 85,
          final_grade: 'Pass',
          is_locked: true,
        },
      ]),
      findSubmissionsByStudentInClass: jest.fn().mockResolvedValue([
        {
          student_id: 'stu-1',
          assessment_id: 'a-1',
          status: 'graded',
          score: 16,
          manual_score: null,
          system_section_score: null,
          manual_section_score: null,
          is_missed: false,
          is_exempted: false,
          assessment: { id: 'a-1', term_id: 't-1', grading_mode: 'system' },
        },
      ]),
      findManualScores: jest.fn().mockResolvedValue([]),
      findClassAssessments: jest.fn().mockResolvedValue([
        { id: 'a-1', type: 'quiz', title: 'Q1', term_id: 't-1', total_items: 20 },
        { id: 'a-2', type: 'quiz', title: 'Q2', term_id: 't-2', total_items: 20 },
      ]),
      findGradingSchemeForClass: jest.fn().mockResolvedValue(scheme),
      // Old per-term methods must NOT be used anymore.
      findByStudent: jest.fn(),
      findSubmissionsForTerm: jest.fn(),
      findAssessmentsForTerm: jest.fn(),
    };
    const enrollmentRepo = {
      findOneByStudentAndClass: jest.fn().mockResolvedValue({ id: 'enr-1' }),
    };
    const service = new GradeStudentService(
      gradeRepo as any,
      enrollmentRepo as any,
      new GradeCoreService(),
    );
    return { service, gradeRepo };
  };

  it('returns per-term rows with identical values using 5 queries total', async () => {
    const { service, gradeRepo } = makeService();
    const res = await service.getMyGrades('class-1', 'stu-1', 'org-1');

    expect(res.map((r: any) => r.termId)).toEqual(['t-1', 't-2']);
    // t-1: locked grade row surfaces score + grade; quiz 16/20 → 80
    expect(res[0].finalScore).toBe(85);
    expect(res[0].finalGrade).toBe('Pass');
    expect(res[0].isReleased).toBe(true);
    expect(res[0].categoryBreakdown[0].rawAverage).toBe(80);
    // t-2: no grade row, no submissions → nulls, empty-active breakdown
    expect(res[1].finalScore).toBeNull();
    expect(res[1].finalGrade).toBeNull();
    expect(res[1].isReleased).toBe(false);

    expect(gradeRepo.findByClass).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findSubmissionsByStudentInClass).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findManualScores).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findClassAssessments).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findGradingSchemeForClass).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findByStudent).not.toHaveBeenCalled();
    expect(gradeRepo.findSubmissionsForTerm).not.toHaveBeenCalled();
    expect(gradeRepo.findAssessmentsForTerm).not.toHaveBeenCalled();
  });

  it('keeps the legacy empty-terms fallback', async () => {
    const { service, gradeRepo } = makeService();
    gradeRepo.findTemplateTermsByClass.mockResolvedValue([]);
    gradeRepo.findByClass.mockResolvedValue([
      {
        student_id: 'stu-1',
        term_id: 'legacy-t',
        final_score: 70,
        final_grade: 'Pass',
        is_locked: false,
      },
    ]);

    const res = await service.getMyGrades('class-1', 'stu-1', 'org-1');
    expect(res).toEqual([
      {
        termId: 'legacy-t',
        termName: '',
        finalScore: 70,
        finalGrade: null,
        isReleased: false,
        categoryBreakdown: [],
      },
    ]);
  });
});
