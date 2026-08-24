import { AcademicHistoryService } from '../academic-history.service';
import { AcademicHistoryRepository } from '../academic-history.repository';

describe('Phase 4 — AcademicHistory timeline + full history', () => {
  let service: AcademicHistoryService;
  let repo: jest.Mocked<AcademicHistoryRepository>;
  let db: { subject: { findMany: jest.Mock } };

  beforeEach(() => {
    repo = {
      getStudentSchoolYears: jest.fn(),
      getEnrollments: jest.fn(),
      getShiftEvents: jest.fn(),
      getClassAssignmentRequests: jest.fn(),
    } as unknown as jest.Mocked<AcademicHistoryRepository>;
    db = { subject: { findMany: jest.fn().mockResolvedValue([]) } } as unknown as typeof db;
    service = new AcademicHistoryService(repo, db as never);
  });

  it('timeline: milestone events scoped to school year, sorted asc/desc, never from AuditLog', async () => {
    // SSY in sy-1 with one ended program stint and one active
    repo.getStudentSchoolYears.mockResolvedValue([
      {
        id: 'ssy-1',
        school_year_id: 'sy-1',
        student_id: 'stu-1',
        enrolled_at: new Date('2026-06-01T08:00:00Z'),
        notes: null,
        schoolYear: { id: 'sy-1', name: '2026-2027', status: 'active' },
        programEnrollments: [
          {
            id: 'pe-old',
            program_id: 'prog-A',
            enrolled_at: new Date('2026-06-01T09:00:00Z'),
            section_assigned_at: new Date('2026-06-02T10:00:00Z'),
            program: { id: 'prog-A', name: 'BSCS', type: 'college' },
            level: null,
            course: null,
            strand: null,
            section: { id: 'sec-1', name: '1-A' },
          } as never,
          {
            id: 'pe-new',
            program_id: 'prog-B',
            enrolled_at: new Date('2026-07-15T09:00:00Z'),
            section_assigned_at: null,
            program: { id: 'prog-B', name: 'BSIT', type: 'college' },
            level: null,
            course: null,
            strand: null,
            section: null,
          } as never,
        ],
      } as never,
    ]);
    repo.getEnrollments.mockResolvedValue([
      {
        id: 'enr-1',
        class_id: 'class-1',
        status: 'removed',
        outcome: 'withdrawn_due_to_shifting',
        outcome_reason: null,
        created_at: new Date('2026-06-10T09:00:00Z'),
        outcome_set_at: new Date('2026-07-15T12:00:00Z'),
        shift_event_id: 'shift-1',
        class: {
          id: 'class-1',
          school_year_id: 'sy-1',
          subject: { name: 'Mathematics' },
        } as never,
      } as never,
    ]);
    repo.getShiftEvents.mockResolvedValue([
      {
        id: 'shift-1',
        student_school_year_id: 'ssy-1',
        from_program_enrollment_id: 'pe-old',
        to_program_enrollment_id: 'pe-new',
        default_outcome_used: 'dropped',
        created_at: new Date('2026-07-15T12:00:00Z'),
      } as never,
    ]);
    repo.getClassAssignmentRequests.mockResolvedValue([]);

    const asc = await service.getTimeline('stu-1', 'org-1', 'sy-1', 'asc');
    // Check chronological order: academic_enrollment_created (06-01 08:00) < program_enrollment_created 09:00 < section_assigned 06-02 < class_enrolled 06-10 < shift/outcome 07-15
    expect(asc[0].type).toBe('academic_enrollment_created');
    expect(asc[0].data).toHaveProperty('schoolYearName');
    expect(asc[1].type).toBe('program_enrollment_created');
    expect(asc[1].data).toHaveProperty('programName', 'BSCS');
    expect(asc[2].type).toBe('section_assigned');
    expect(asc[2].data).toHaveProperty('sectionName', '1-A');
    expect(asc.find((e) => e.type === 'class_enrolled')?.data).toHaveProperty('subjectName', 'Mathematics');
    expect(asc.find((e) => e.type === 'outcome_set')?.data).toHaveProperty('outcome', 'withdrawn_due_to_shifting');
    expect(asc.find((e) => e.type === 'program_shift')?.data).toHaveProperty('fromProgramName', 'BSCS');

    const desc = await service.getTimeline('stu-1', 'org-1', 'sy-1', 'desc');
    expect(desc[0].timestamp > desc[desc.length - 1].timestamp).toBe(true);
  });

  it('full history: mid-year shift shows two distinct stints under same school year with ended reason', async () => {
    repo.getStudentSchoolYears.mockResolvedValue([
      {
        id: 'ssy-1',
        school_year_id: 'sy-1',
        schoolYear: { id: 'sy-1', name: '2026-2027', status: 'active' },
        student_id: 'stu-1',
        enrolled_at: new Date('2026-06-01'),
        unenrolled_at: null,
        programEnrollments: [
          {
            id: 'pe-old',
            program: { id: 'prog-A', name: 'BSCS', type: 'college' },
            status: 'ended',
            enrolled_at: new Date('2026-06-01'),
            section_assigned_at: new Date('2026-06-02'),
            section: { id: 'sec-A', name: '1-A' },
            end_reason: 'shifted',
            ended_at: new Date('2026-07-15'),
            ended_by: 'admin-1',
            shiftFromEvent: null,
            shiftToEvent: null,
          } as never,
          {
            id: 'pe-new',
            program: { id: 'prog-B', name: 'BSIT', type: 'college' },
            status: 'active',
            enrolled_at: new Date('2026-07-15'),
            section_assigned_at: null,
            section: null,
            end_reason: null,
            ended_at: null,
            ended_by: null,
            shiftFromEvent: null,
            shiftToEvent: null,
          } as never,
        ],
      } as never,
    ]);
    repo.getEnrollments.mockResolvedValue([]);
    repo.getShiftEvents.mockResolvedValue([]);
    repo.getClassAssignmentRequests.mockResolvedValue([]);

    const history = await service.getFullHistory('stu-1', 'org-1');

    expect(history).toHaveLength(1);
    expect(history[0].programEnrollments).toHaveLength(2);
    expect(history[0].programEnrollments[0]).toMatchObject({ status: 'ended', endReason: 'shifted' });
    expect(history[0].programEnrollments[1]).toMatchObject({ status: 'active' });
  });

  it('never-enrolled class does not appear (no Enrollment row → no timeline/full-history entry)', async () => {
    repo.getStudentSchoolYears.mockResolvedValue([
      {
        id: 'ssy-1',
        school_year_id: 'sy-1',
        schoolYear: { id: 'sy-1', name: '2026-2027', status: 'active' },
        student_id: 'stu-1',
        enrolled_at: new Date('2026-06-01'),
        unenrolled_at: null,
        programEnrollments: [],
      } as never,
    ]);
    // Only enrollments that exist appear; a class with no enrollment is not returned
    repo.getEnrollments.mockResolvedValue([]);
    repo.getShiftEvents.mockResolvedValue([]);
    repo.getClassAssignmentRequests.mockResolvedValue([]);

    const timeline = await service.getTimeline('stu-1', 'org-1', 'sy-1', 'asc');
    const full = await service.getFullHistory('stu-1', 'org-1');

    expect(timeline.filter((e) => e.type === 'class_enrolled')).toHaveLength(0);
    expect(full[0].enrollments).toHaveLength(0);
  });
});
