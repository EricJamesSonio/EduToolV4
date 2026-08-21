import { TranscriptStudentService } from '../transcript-student.service';

describe('TranscriptStudentService', () => {
  let service: TranscriptStudentService;
  let db: any;
  let gradeRepo: any;
  let classRepo: any;
  let enrollmentRepo: any;

  beforeEach(() => {
    db = {
      subject: { findFirst: jest.fn() },
      profile: { findFirst: jest.fn() },
      schoolYear: { findFirst: jest.fn() },
    };
    gradeRepo = { findByClass: jest.fn(), findTemplateTermsByClass: jest.fn() };
    classRepo = {};
    enrollmentRepo = { findByStudentAcrossOrg: jest.fn() };
    service = new TranscriptStudentService(db, gradeRepo, classRepo, enrollmentRepo);
    jest.clearAllMocks();
  });

  it('returns [] when no enrollments', async () => {
    enrollmentRepo.findByStudentAcrossOrg.mockResolvedValue([]);
    expect(await service.getMyTranscript('stu-1', 'org-1')).toEqual([]);
    expect(enrollmentRepo.findByStudentAcrossOrg).toHaveBeenCalledWith('stu-1', 'org-1');
  });

  it('groups by school year and semester', async () => {
    enrollmentRepo.findByStudentAcrossOrg.mockResolvedValue([
      { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
      { class: { id: 'class-2', subject_id: 'subj-2', educator_id: 'edu-1', school_year_id: 'sy-1' } },
    ]);
    db.subject.findFirst
      .mockResolvedValueOnce({ id: 'subj-1', name: 'Math' })
      .mockResolvedValueOnce({ id: 'subj-2', name: 'Science' });
    db.profile.findFirst.mockResolvedValue({ full_name: 'John Doe' });
    db.schoolYear.findFirst.mockResolvedValue({ id: 'sy-1', name: '2024-2025', status: 'active' });
    gradeRepo.findByClass.mockResolvedValue([]);
    gradeRepo.findTemplateTermsByClass
      .mockResolvedValueOnce([{ id: 'term-1', name: 'Term 1', semesterName: '1st Semester' }])
      .mockResolvedValueOnce([{ id: 'term-2', name: 'Term 2', semesterName: '1st Semester' }]);

    const res = await service.getMyTranscript('stu-1', 'org-1');
    expect(res).toHaveLength(1);
    expect(res[0].schoolYearName).toBe('2024-2025');
    expect(res[0].semesters[0].semesterName).toBe('1st Semester');
    expect(res[0].semesters[0].classes).toHaveLength(2);
  });

  it('handles unknown subject/schoolYear fallback', async () => {
    enrollmentRepo.findByStudentAcrossOrg.mockResolvedValue([
      { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
    ]);
    db.subject.findFirst.mockResolvedValue(null);
    db.profile.findFirst.mockResolvedValue(null);
    db.schoolYear.findFirst.mockResolvedValue(null);
    gradeRepo.findByClass.mockResolvedValue([]);
    gradeRepo.findTemplateTermsByClass.mockResolvedValue([{ id: 'term-1', name: 'Term 1', semesterName: '1st Semester' }]);

    const res = await service.getMyTranscript('stu-1', 'org-1');
    expect(res[0].semesters[0].classes[0].subject.name).toBe('Unknown Subject');
    expect(res[0].semesters[0].classes[0].educator).toBe('Unknown Educator');
    expect(res[0].schoolYearName).toBe('Unknown');
  });

  it('marks term grades as released only when locked', async () => {
    enrollmentRepo.findByStudentAcrossOrg.mockResolvedValue([
      { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
    ]);
    db.subject.findFirst.mockResolvedValue({ id: 'subj-1', name: 'Math' });
    db.profile.findFirst.mockResolvedValue({ full_name: 'John' });
    db.schoolYear.findFirst.mockResolvedValue({ id: 'sy-1', name: '2024-2025', status: 'active' });
    gradeRepo.findByClass.mockResolvedValue([
      { term_id: 'term-1', student_id: 'stu-1', final_score: 90, final_grade: 'A', is_locked: true },
      { term_id: 'term-2', student_id: 'stu-1', final_score: 80, final_grade: 'B', is_locked: false },
    ]);
    gradeRepo.findTemplateTermsByClass.mockResolvedValue([
      { id: 'term-1', name: 'Term 1', semesterName: '1st Semester' },
      { id: 'term-2', name: 'Term 2', semesterName: '1st Semester' },
    ]);

    const res = await service.getMyTranscript('stu-1', 'org-1');
    const terms = res[0].semesters[0].classes[0].termGrades;
    expect(terms.find(t => t.termId === 'term-1')?.isReleased).toBe(true);
    expect(terms.find(t => t.termId === 'term-1')?.finalGrade).toBe('A');
    expect(terms.find(t => t.termId === 'term-2')?.isReleased).toBe(false);
    expect(terms.find(t => t.termId === 'term-2')?.finalGrade).toBeNull();
  });

  it('groups multiple school years separately', async () => {
    enrollmentRepo.findByStudentAcrossOrg.mockResolvedValue([
      { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
      { class: { id: 'class-2', subject_id: 'subj-2', educator_id: 'edu-1', school_year_id: 'sy-2' } },
    ]);
    db.subject.findFirst.mockResolvedValue({ id: 'subj-1', name: 'Math' });
    db.profile.findFirst.mockResolvedValue({ full_name: 'John' });
    db.schoolYear.findFirst
      .mockResolvedValueOnce({ id: 'sy-1', name: '2023-2024', status: 'ended' })
      .mockResolvedValueOnce({ id: 'sy-2', name: '2024-2025', status: 'active' });
    gradeRepo.findByClass.mockResolvedValue([]);
    gradeRepo.findTemplateTermsByClass.mockResolvedValue([{ id: 'term-1', name: 'Term 1', semesterName: '1st Semester' }]);

    const res = await service.getMyTranscript('stu-1', 'org-1');
    expect(res).toHaveLength(2);
    expect(res.map(r => r.schoolYearName).sort()).toEqual(['2023-2024', '2024-2025'].sort());
  });
});
