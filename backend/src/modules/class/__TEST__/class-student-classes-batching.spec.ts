import { ClassService } from '../class.service';

// Perf Phase 3: getStudentClasses resolves subjects+educators with one
// batched repository call instead of one findSubjectWithEducator per row.

describe('ClassService.getStudentClasses — batched lookup', () => {
  const enrollments = [
    {
      id: 'enr-1',
      status: 'active',
      class: {
        id: 'class-1',
        subject_id: 'subj-1',
        educator_id: 'edu-1',
        section_id: 'sec-1',
        school_year_id: 'sy-1',
        semester_id: 'sem-1',
        capacity: 40,
        schedules: [],
      },
    },
    {
      id: 'enr-2',
      status: 'active',
      class: {
        id: 'class-2',
        subject_id: 'subj-2',
        educator_id: 'edu-2',
        section_id: 'sec-1',
        school_year_id: 'sy-1',
        semester_id: 'sem-1',
        capacity: 40,
        schedules: [],
      },
    },
  ];

  const makeService = () => {
    const repo = {
      findSubjectsWithEducators: jest.fn().mockResolvedValue(
        new Map([
          [
            'class-1',
            {
              subject: { name: 'Math' },
              educatorProfile: { full_name: 'Alice' },
            },
          ],
          [
            'class-2',
            { subject: { name: 'Science' }, educatorProfile: null },
          ],
        ]),
      ),
      findSubjectWithEducator: jest.fn(),
    };
    const enrollmentService = {
      getStudentEnrollments: jest.fn().mockResolvedValue(enrollments),
    };
    const service = new ClassService(
      repo as any,
      enrollmentService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    return { service, repo };
  };

  it('returns identical rows with a single batched lookup', async () => {
    const { service, repo } = makeService();
    const res = await service.getStudentClasses('stu-1', 'org-1');

    expect(repo.findSubjectsWithEducators).toHaveBeenCalledTimes(1);
    expect(repo.findSubjectsWithEducators).toHaveBeenCalledWith([
      'class-1',
      'class-2',
    ]);
    expect(repo.findSubjectWithEducator).not.toHaveBeenCalled();

    expect(res).toEqual([
      {
        enrollmentId: 'enr-1',
        enrollmentStatus: 'active',
        class: {
          id: 'class-1',
          subjectId: 'subj-1',
          subjectName: 'Math',
          educatorId: 'edu-1',
          educatorName: 'Alice',
          sectionId: 'sec-1',
          schoolYearId: 'sy-1',
          semesterId: 'sem-1',
          capacity: 40,
          schedules: [],
        },
      },
      {
        enrollmentId: 'enr-2',
        enrollmentStatus: 'active',
        class: {
          id: 'class-2',
          subjectId: 'subj-2',
          subjectName: 'Science',
          educatorId: 'edu-2',
          educatorName: null,
          sectionId: 'sec-1',
          schoolYearId: 'sy-1',
          semesterId: 'sem-1',
          capacity: 40,
          schedules: [],
        },
      },
    ]);
  });
});
