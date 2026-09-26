import { TranscriptStudentService } from '../transcript-student.service';

describe('TranscriptStudentService', () => {
  let service: TranscriptStudentService;
  let db: any;
  let gradeRepo: any;
  let classRepo: any;
  let enrollmentRepo: any;

  beforeEach(() => {
    db = {
      subject: { findMany: jest.fn() },
      profile: { findMany: jest.fn() },
      schoolYear: { findMany: jest.fn() },
    };
    gradeRepo = { findByClasses: jest.fn(), findTemplateTermsByClass: jest.fn() };
    classRepo = {};
    enrollmentRepo = { findByStudentAcrossOrg: jest.fn() };
    service = new TranscriptStudentService(db, gradeRepo, classRepo, enrollmentRepo);
    jest.clearAllMocks();
  });

  const setupBatched = (overrides: {
    enrollments?: any[];
    subjects?: any[];
    profiles?: any[];
    schoolYears?: any[];
    grades?: any[];
    terms?: any;
  }) => {
    enrollmentRepo.findByStudentAcrossOrg.mockResolvedValue(
      overrides.enrollments ?? [],
    );
    db.subject.findMany.mockResolvedValue(overrides.subjects ?? []);
    db.profile.findMany.mockResolvedValue(overrides.profiles ?? []);
    db.schoolYear.findMany.mockResolvedValue(overrides.schoolYears ?? []);
    gradeRepo.findByClasses.mockResolvedValue(overrides.grades ?? []);
    if (typeof overrides.terms === 'function') {
      gradeRepo.findTemplateTermsByClass.mockImplementation(overrides.terms);
    } else {
      gradeRepo.findTemplateTermsByClass.mockResolvedValue(overrides.terms ?? []);
    }
  };

  it('returns [] when no enrollments', async () => {
    setupBatched({ enrollments: [] });
    expect(await service.getMyTranscript('stu-1', 'org-1')).toEqual([]);
    expect(enrollmentRepo.findByStudentAcrossOrg).toHaveBeenCalledWith('stu-1', 'org-1');
  });

  it('groups by school year and semester', async () => {
    setupBatched({
      enrollments: [
        { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
        { class: { id: 'class-2', subject_id: 'subj-2', educator_id: 'edu-1', school_year_id: 'sy-1' } },
      ],
      subjects: [
        { id: 'subj-1', name: 'Math' },
        { id: 'subj-2', name: 'Science' },
      ],
      profiles: [{ account_id: 'edu-1', full_name: 'John Doe' }],
      schoolYears: [{ id: 'sy-1', name: '2024-2025', status: 'active' }],
      grades: [],
      terms: (classId: string) =>
        classId === 'class-1'
          ? [{ id: 'term-1', name: 'Term 1', semesterName: '1st Semester' }]
          : [{ id: 'term-2', name: 'Term 2', semesterName: '1st Semester' }],
    });

    const res = await service.getMyTranscript('stu-1', 'org-1');
    expect(res).toHaveLength(1);
    expect(res[0].schoolYearName).toBe('2024-2025');
    expect(res[0].semesters[0].semesterName).toBe('1st Semester');
    expect(res[0].semesters[0].classes).toHaveLength(2);
  });

  it('handles unknown subject/schoolYear fallback', async () => {
    setupBatched({
      enrollments: [
        { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
      ],
      subjects: [],
      profiles: [],
      schoolYears: [],
      grades: [],
      terms: [{ id: 'term-1', name: 'Term 1', semesterName: '1st Semester' }],
    });

    const res = await service.getMyTranscript('stu-1', 'org-1');
    expect(res[0].semesters[0].classes[0].subject.name).toBe('Unknown Subject');
    expect(res[0].semesters[0].classes[0].educator).toBe('Unknown Educator');
    expect(res[0].schoolYearName).toBe('Unknown');
  });

  it('marks term grades as released only when locked', async () => {
    setupBatched({
      enrollments: [
        { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
      ],
      subjects: [{ id: 'subj-1', name: 'Math' }],
      profiles: [{ account_id: 'edu-1', full_name: 'John' }],
      schoolYears: [{ id: 'sy-1', name: '2024-2025', status: 'active' }],
      grades: [
        { class_id: 'class-1', term_id: 'term-1', student_id: 'stu-1', final_score: 90, final_grade: 'A', is_locked: true },
        { class_id: 'class-1', term_id: 'term-2', student_id: 'stu-1', final_score: 80, final_grade: 'B', is_locked: false },
      ],
      terms: [
        { id: 'term-1', name: 'Term 1', semesterName: '1st Semester' },
        { id: 'term-2', name: 'Term 2', semesterName: '1st Semester' },
      ],
    });

    const res = await service.getMyTranscript('stu-1', 'org-1');
    const terms = res[0].semesters[0].classes[0].termGrades;
    expect(terms.find((t: any) => t.termId === 'term-1')?.isReleased).toBe(true);
    expect(terms.find((t: any) => t.termId === 'term-1')?.finalGrade).toBe('A');
    expect(terms.find((t: any) => t.termId === 'term-2')?.isReleased).toBe(false);
    expect(terms.find((t: any) => t.termId === 'term-2')?.finalGrade).toBeNull();
  });

  it('groups multiple school years separately', async () => {
    setupBatched({
      enrollments: [
        { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
        { class: { id: 'class-2', subject_id: 'subj-2', educator_id: 'edu-1', school_year_id: 'sy-2' } },
      ],
      subjects: [
        { id: 'subj-1', name: 'Math' },
        { id: 'subj-2', name: 'Math' },
      ],
      profiles: [{ account_id: 'edu-1', full_name: 'John' }],
      schoolYears: [
        { id: 'sy-1', name: '2023-2024', status: 'ended' },
        { id: 'sy-2', name: '2024-2025', status: 'active' },
      ],
      grades: [],
      terms: [{ id: 'term-1', name: 'Term 1', semesterName: '1st Semester' }],
    });

    const res = await service.getMyTranscript('stu-1', 'org-1');
    expect(res).toHaveLength(2);
    expect(res.map((r: any) => r.schoolYearName).sort()).toEqual(['2023-2024', '2024-2025'].sort());
  });

  it('Perf Phase 3: batches lookups and memoizes template terms per subject', async () => {
    setupBatched({
      enrollments: [
        { class: { id: 'class-1', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
        { class: { id: 'class-2', subject_id: 'subj-1', educator_id: 'edu-1', school_year_id: 'sy-1' } },
        { class: { id: 'class-3', subject_id: 'subj-2', educator_id: 'edu-2', school_year_id: 'sy-1' } },
      ],
      subjects: [
        { id: 'subj-1', name: 'Math' },
        { id: 'subj-2', name: 'Science' },
      ],
      profiles: [
        { account_id: 'edu-1', full_name: 'John' },
        { account_id: 'edu-2', full_name: 'Jane' },
      ],
      schoolYears: [{ id: 'sy-1', name: '2024-2025', status: 'active' }],
      grades: [],
      terms: [{ id: 'term-1', name: 'Term 1', semesterName: '1st Semester' }],
    });

    await service.getMyTranscript('stu-1', 'org-1');

    // 4 batched queries regardless of enrollment count (was 5 per enrollment).
    expect(db.subject.findMany).toHaveBeenCalledTimes(1);
    expect(db.profile.findMany).toHaveBeenCalledTimes(1);
    expect(db.schoolYear.findMany).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findByClasses).toHaveBeenCalledTimes(1);
    expect(gradeRepo.findByClasses).toHaveBeenCalledWith(
      ['class-1', 'class-2', 'class-3'],
      'org-1',
    );
    // 2 unique subjects → 2 template resolutions (was 3, one per enrollment).
    expect(gradeRepo.findTemplateTermsByClass).toHaveBeenCalledTimes(2);
  });
});
