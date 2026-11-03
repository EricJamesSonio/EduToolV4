import { BadRequestException } from '@nestjs/common';
import { StudentService } from '../student.service';
import { StudentController } from '../student.controller';
import { EnrollmentService } from '../../enrollment/enrollment.service';
import { SubjectPrerequisiteService } from '../../subject-prerequisite/subject-prerequisite.service';

jest.mock('../../enrollment/enrollment-eligibility.util', () => ({
  resolveSubjectAcademicStructure: jest.fn(),
  isEligibleForClassStructure: jest.fn(),
}));

import { isEligibleForClassStructure } from '../../enrollment/enrollment-eligibility.util';

// Part 1b: the student-detail "Enroll in class" surface used to duplicate the
// enrollment gates inline and SKIPPED the prerequisite gate entirely — a direct
// API call (POST /students/:id/enrollments) could enroll a student who never
// satisfied prerequisites. addEnrollment now routes through the shared
// EnrollmentService.enroll(), so these specs wire a REAL EnrollmentService +
// REAL SubjectPrerequisiteService (with only the DB/repo boundary mocked) and
// prove the three required behaviors on that exact path.
describe('StudentService.addEnrollment — prerequisite gate via shared decision', () => {
  const orgId = 'org-1';
  const studentId = 'stu-1';
  const classId = 'class-1';
  const subjectId = 'subj-current';
  const prereqId = 'subj-prereq';
  const semesterId = 'sem-1';
  const actorId = 'admin-1';

  let repo: Record<string, jest.Mock>;
  let studentRepository: Record<string, jest.Mock>;
  let classRepository: Record<string, jest.Mock>;
  let auditLogService: Record<string, jest.Mock>;
  let prereqRepo: Record<string, jest.Mock>;
  let realDb: { subjectCompletionOverride: { findMany: jest.Mock } };

  const makeService = (): StudentService => {
    const realPrereqService = new SubjectPrerequisiteService(
      prereqRepo as never,
      { findByClassId: jest.fn() } as never,
      realDb as never,
    );
    const realEnrollmentService = new EnrollmentService(
      repo as never,
      realPrereqService as never,
      realDb as never,
    );
    return new StudentService(
      studentRepository as never,
      {} as never,
      classRepository as never,
      repo as never,
      realEnrollmentService as never,
      auditLogService as never,
      {} as never,
      realDb as never,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();

    studentRepository = {
      findById: jest.fn().mockResolvedValue({ id: studentId, status: 'active' }),
    };
    classRepository = {
      findById: jest.fn().mockResolvedValue({
        id: classId,
        subject_id: subjectId,
        semester_id: semesterId,
        school_year_id: 'sy-1',
        section_id: 'sec-1',
        capacity: 30,
      }),
    };
    auditLogService = {
      logAdminAction: jest.fn().mockResolvedValue({}),
    };
    repo = {
      findClassEnrollmentContext: jest.fn().mockResolvedValue({
        subject_id: subjectId,
        school_year_id: 'sy-1',
        section_id: 'sec-1',
      }),
      findStudentAcademicStructure: jest.fn().mockResolvedValue({
        programId: 'prog-1',
        levelId: 'lvl-2',
        courseId: null,
        strandId: null,
        sectionId: 'sec-1',
      }),
      findDuplicate: jest.fn().mockResolvedValue(null),
      findByStudent: jest.fn().mockResolvedValue(null),
      countActive: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'enr-new', status: 'active' }),
    };
    // The current subject HAS a prerequisite link whose grade is missing —
    // the "no credit" baseline.
    prereqRepo = {
      getPrerequisitesWithGradesForSubjects: jest.fn().mockResolvedValue(
        new Map([
          [subjectId, [{ subject_id: prereqId, subject_name: 'Prereq 101', grade: null }]],
        ]),
      ),
    };
    realDb = {
      subjectCompletionOverride: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    (isEligibleForClassStructure as jest.Mock).mockReturnValue(true);
  });

  it('rejects when the prerequisite is unmet and no completion credit exists', async () => {
    const service = makeService();

    await expect(
      service.addEnrollment(studentId, orgId, classId, actorId),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repo.create).not.toHaveBeenCalled();
    expect(auditLogService.logAdminAction).not.toHaveBeenCalled();
  });

  it('allows enrollment when a completed override credit satisfies the prerequisite', async () => {
    realDb.subjectCompletionOverride.findMany.mockResolvedValue([
      { subject_id: prereqId, status: 'completed' },
    ]);
    const service = makeService();

    const res = (await service.addEnrollment(studentId, orgId, classId, actorId)) as any;

    expect(res.id).toBe('enr-new');
    expect(repo.create).toHaveBeenCalledWith({
      orgId,
      classId,
      studentId,
      status: 'active',
    });
    expect(auditLogService.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'enrollment_created' }),
    );
  });

  it('allows a completed override via the direct API call (controller path)', async () => {
    realDb.subjectCompletionOverride.findMany.mockResolvedValue([
      { subject_id: prereqId, status: 'completed' },
    ]);
    const controller = new StudentController(makeService());

    const res = (await controller.addEnrollment(
      studentId,
      orgId,
      actorId,
      { classId },
    )) as any;

    expect(res.id).toBe('enr-new');
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('still rejects the direct API call when no credit exists (UI pre-filter bypassed)', async () => {
    const controller = new StudentController(makeService());

    await expect(
      controller.addEnrollment(studentId, orgId, actorId, { classId }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('passes overflow through with the capacity audit (behavior preserved)', async () => {
    // Prereq gate must pass to REACH the capacity check — grant the credit.
    realDb.subjectCompletionOverride.findMany.mockResolvedValue([
      { subject_id: prereqId, status: 'completed' },
    ]);
    repo.countActive.mockResolvedValue(30);
    const service = makeService();

    const res = (await service.addEnrollment(studentId, orgId, classId, actorId)) as any;

    expect(res.overflow).toBe(true);
    expect(res.classId).toBe(classId);
    expect(res.studentId).toBe(studentId);
    expect(res.message).toContain('full capacity');
    expect(auditLogService.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'class_capacity_overflow' }),
    );
    expect(repo.create).not.toHaveBeenCalled();
  });
});
