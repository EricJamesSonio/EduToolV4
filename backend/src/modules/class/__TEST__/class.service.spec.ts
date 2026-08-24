import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ClassService } from '../class.service';

describe('ClassService', () => {
  let service: ClassService;
  let repo: any;
  let enrollmentService: any;
  let attendanceService: any;
  let auditLogService: any;
  let gradingTemplateService: any;
  let db: any;

  const orgId = 'org-1';
  const actorId = 'actor-1';
  const subjectId = 'subj-1';
  const educatorId = 'edu-1';
  const programId = 'prog-1';
  const schoolYearId = 'sy-1';
  const classId = 'class-1';

  function makeSlot(weekday: number, start: string, end: string) {
    return { weekday, startTime: start, endTime: end };
  }
  function todayISO(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setMilliseconds(0);
    return d.toISOString();
  }

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findDistinctEducators: jest.fn(),
      update: jest.fn(),
      findSchedulesByClass: jest.fn(),
      findEducatorSchedules: jest.fn(),
      findSectionSchedules: jest.fn(),
      replaceSchedules: jest.fn().mockResolvedValue([]),
      softDelete: jest.fn(),
      lockGradingSchemeForClass: jest.fn().mockResolvedValue({}),
      findEnrolledStudents: jest.fn(),
      findEligibleStudents: jest.fn(),
      findOwnershipHistory: jest.fn(),
      findActiveClassesByEducator: jest.fn(),
      countAssignedClasses: jest.fn(),
      createOwnershipLog: jest.fn().mockResolvedValue({}),
      findSubjectWithEducator: jest.fn(),
    };
    enrollmentService = {
      enroll: jest.fn(),
      countActive: jest.fn(),
      findByClass: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
      getStudentEnrollments: jest.fn(),
      getStudentEnrollmentForClass: jest.fn(),
    };
    attendanceService = { generateSessionsForClass: jest.fn().mockResolvedValue(undefined) };
    auditLogService = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    gradingTemplateService = { autoApplyForNewClass: jest.fn().mockResolvedValue(undefined) };
    db = {
      subject: { findFirst: jest.fn() },
      course: { findFirst: jest.fn() },
      strand: { findFirst: jest.fn() },
      level: { findFirst: jest.fn() },
      subjectSharing: { findFirst: jest.fn() },
      program: { findFirst: jest.fn() },
      programSemesterAssignment: { findFirst: jest.fn() },
      semester: { findFirst: jest.fn() },
      classSchedule: { findMany: jest.fn() },
    };
    service = new ClassService(repo, enrollmentService, attendanceService, auditLogService, gradingTemplateService, db);
    jest.clearAllMocks();
  });

  // Helper to mock resolveProgramIdFromSubject -> programId
  function mockResolveProgramIdSuccess() {
    db.subject.findFirst.mockResolvedValue({ program_id: programId });
  }
  function mockResolveSemesterSuccess(semesterId = 'sem-1') {
    db.programSemesterAssignment.findFirst.mockResolvedValue({
      template: { semesters: [{ name: '1st Semester' }] },
    });
    db.semester.findFirst
      .mockResolvedValueOnce({ id: semesterId, name: '1st Semester' }) // by name
      .mockResolvedValue({ id: semesterId });
  }

  describe('create', () => {
    it('throws BadRequest when programId cannot be resolved', async () => {
      db.subject.findFirst.mockResolvedValue(null);
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when no semester assignment', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      db.programSemesterAssignment.findFirst.mockResolvedValue(null);
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId)).rejects.toBeInstanceOf(BadRequestException);
      expect(db.programSemesterAssignment.findFirst).toHaveBeenCalled();
    });

    it('throws BadRequest when template has no semesters', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      db.programSemesterAssignment.findFirst.mockResolvedValue({ template: { semesters: [] } });
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('uses provided semesterId directly without resolving', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.create.mockResolvedValue({ id: classId });
      repo.findById.mockResolvedValue({ id: classId });
      const res = await service.create(orgId, { subjectId, educatorId, schoolYearId, semesterId: 'sem-direct', capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId);
      expect(db.programSemesterAssignment.findFirst).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ semesterId: 'sem-direct' }));
      if (!res) throw new Error('expected res to be defined');
      expect(res.id).toBe(classId);
    });

    it('resolves semester via template name match', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      db.programSemesterAssignment.findFirst.mockResolvedValue({ template: { semesters: [{ name: '1st Semester' }] } });
      db.semester.findFirst.mockResolvedValueOnce({ id: 'sem-matched', name: '1st Semester' });
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.create.mockResolvedValue({ id: classId });
      repo.findById.mockResolvedValue({ id: classId });
      await service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ semesterId: 'sem-matched' }));
    });

    it('fallback to any semester when name not found', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      db.programSemesterAssignment.findFirst.mockResolvedValue({ template: { semesters: [{ name: '1st Semester' }] } });
      db.semester.findFirst
        .mockResolvedValueOnce(null) // name lookup fails
        .mockResolvedValueOnce({ id: 'sem-fallback' }); // fallback succeeds
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.create.mockResolvedValue({ id: classId });
      repo.findById.mockResolvedValue({ id: classId });
      await service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ semesterId: 'sem-fallback' }));
    });

    it('throws BadRequest when no semesters for school year', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      db.programSemesterAssignment.findFirst.mockResolvedValue({ template: { semesters: [{ name: '1st Semester' }] } });
      db.semester.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when schedule start >= end', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      mockResolveSemesterSuccess();
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '09:00', '08:00')] } as any, actorId)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '08:00')] } as any, actorId)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws Conflict when educator has overlapping slot', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      mockResolveSemesterSuccess();
      repo.findEducatorSchedules.mockResolvedValue([{ weekday: 1, start_time: todayISO('08:30'), end_time: todayISO('09:30'), class_id: 'other-class' }]);
      db.classSchedule.findMany.mockResolvedValue([]);
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId)).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws Conflict when section has overlapping slot', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      mockResolveSemesterSuccess();
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.findSectionSchedules.mockResolvedValue([{ weekday: 2, start_time: todayISO('10:00'), end_time: todayISO('11:00'), class_id: 'other' }]);
      await expect(service.create(orgId, { subjectId, educatorId, sectionId: 'sec-1', schoolYearId, capacity: 30, schedules: [makeSlot(2, '10:30', '11:30')] } as any, actorId)).rejects.toBeInstanceOf(ConflictException);
    });

    it('succeeds and calls grading autoApply, attendance, audit (non-blocking)', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      mockResolveSemesterSuccess('sem-1');
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.create.mockResolvedValue({ id: classId });
      repo.findById.mockResolvedValue({ id: classId, subject_id: subjectId });
      gradingTemplateService.autoApplyForNewClass.mockResolvedValue(undefined);
      attendanceService.generateSessionsForClass.mockResolvedValue(undefined);
      const res = await service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.replaceSchedules).toHaveBeenCalled();
      expect(gradingTemplateService.autoApplyForNewClass).toHaveBeenCalledWith(orgId, classId, programId, schoolYearId, 'college');
      expect(attendanceService.generateSessionsForClass).toHaveBeenCalledWith(classId, orgId);
      expect(auditLogService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'class_created', entityId: classId }));
      if (!res) throw new Error('expected res to be defined');
      expect(res.id).toBe(classId);
    });

    it('does not throw if autoApply fails (catch)', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      mockResolveSemesterSuccess();
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.create.mockResolvedValue({ id: classId });
      repo.findById.mockResolvedValue({ id: classId });
      gradingTemplateService.autoApplyForNewClass.mockRejectedValue(new Error('fail'));
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '08:00', '09:00')] } as any, actorId)).resolves.toBeDefined();
    });
  });

  describe('findAll', () => {
    it('maps pagination and educatorName correctly', async () => {
      repo.findAll.mockResolvedValue({
        data: [
          {
            id: classId,
            subject: { program_id: programId, program: { name: 'College' }, course: null, strand: null, level: { name: '1st Year' }, name: 'Math' },
            educator: { profile: { full_name: 'John Doe' } },
            gradingSchemes: [{ template_id: 'tmpl-1' }],
          },
        ],
        total: 1,
      });
      const res = await service.findAll(orgId, { page: 1, limit: 10 } as any);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
      expect(res.data[0].educatorName).toBe('John Doe');
      expect(res.data[0].program_id).toBe(programId);
      expect(res.data[0].template_id).toBe('tmpl-1');
    });
    it('handles missing subject/educator gracefully', async () => {
      repo.findAll.mockResolvedValue({ data: [{ id: classId, subject: null, educator: null, gradingSchemes: [] }], total: 1 });
      const res = await service.findAll(orgId, {} as any);
      expect(res.data[0].program_id).toBeNull();
      expect(res.data[0].educatorName).toBeNull();
    });
    it('defaults page/limit', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });
      const res = await service.findAll(orgId, {} as any);
      expect(res.meta.page).toBe(1);
      expect(res.meta.limit).toBe(20);
    });
  });

  describe('findById / getDistinctEducators', () => {
    it('findById throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findById returns class', async () => {
      repo.findById.mockResolvedValue({ id: classId });
      expect(await service.findById(classId, orgId)).toEqual({ id: classId });
    });
    it('getDistinctEducators delegates', async () => {
      repo.findDistinctEducators.mockResolvedValue([{ id: 'e1', fullName: 'A' }]);
      expect(await service.getDistinctEducators(orgId, { schoolYearId })).toEqual([{ id: 'e1', fullName: 'A' }]);
    });
  });

  describe('update', () => {
    it('throws NotFound when class missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('validates educator conflict on schedule change', async () => {
      repo.findById.mockResolvedValue({ id: classId, educator_id: educatorId, section_id: null, school_year_id: schoolYearId });
      repo.findEducatorSchedules.mockResolvedValue([{ weekday: 1, start_time: todayISO('08:00'), end_time: todayISO('09:00'), class_id: 'other' }]);
      repo.update.mockResolvedValue({ id: classId });
      await expect(service.update(classId, orgId, { educatorId: 'new-edu', schedules: [makeSlot(1, '08:30', '09:30')] } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('validates section conflict', async () => {
      repo.findById.mockResolvedValue({ id: classId, educator_id: educatorId, section_id: 'sec-1', school_year_id: schoolYearId });
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.findSectionSchedules.mockResolvedValue([{ weekday: 1, start_time: todayISO('08:00'), end_time: todayISO('09:00'), class_id: 'other' }]);
      await expect(service.update(classId, orgId, { schedules: [makeSlot(1, '08:30', '09:30')] } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('updates capacity without schedule change', async () => {
      repo.findById.mockResolvedValue({ id: classId, educator_id: educatorId, school_year_id: schoolYearId });
      repo.update.mockResolvedValue({ id: classId, capacity: 50 });
      const res = await service.update(classId, orgId, { capacity: 50 } as any);
      expect(repo.update).toHaveBeenCalledWith(classId, expect.objectContaining({ capacity: 50 }));
      expect(res.capacity).toBe(50);
    });
    it('validates educator change without schedule change via existing schedules', async () => {
      repo.findById.mockResolvedValue({ id: classId, educator_id: educatorId, school_year_id: schoolYearId });
      repo.findSchedulesByClass.mockResolvedValue([{ weekday: 1, start_time: todayISO('08:00'), end_time: todayISO('09:00') }]);
      repo.findEducatorSchedules.mockResolvedValue([{ weekday: 1, start_time: todayISO('08:30'), end_time: todayISO('09:30'), class_id: 'other' }]);
      await expect(service.update(classId, orgId, { educatorId: 'new-edu' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('archive', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.archive('nope', orgId, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('soft deletes and logs', async () => {
      repo.findById.mockResolvedValue({ id: classId });
      await service.archive(classId, orgId, actorId);
      expect(repo.softDelete).toHaveBeenCalledWith(classId);
      expect(auditLogService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'class_archived', entityId: classId }));
    });
  });

  describe('enrollStudent', () => {
    it('throws NotFound when class missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.enrollStudent('nope', orgId, { studentId: 's1' } as any, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('enrolls and locks grading scheme on first active enrollment', async () => {
      repo.findById.mockResolvedValue({ id: classId, subject_id: subjectId, semester_id: 'sem-1', capacity: 30 });
      enrollmentService.enroll.mockResolvedValue({ id: 'enr-1' }); // no overflow
      enrollmentService.countActive.mockResolvedValue(1);
      const res = await service.enrollStudent(classId, orgId, { studentId: 's1' } as any, actorId);
      expect(enrollmentService.enroll).toHaveBeenCalledWith(classId, subjectId, 'sem-1', 30, 's1', orgId);
      expect(repo.lockGradingSchemeForClass).toHaveBeenCalledWith(classId, orgId);
      expect(auditLogService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'enrollment_created' }));
      if (!res || !('id' in res)) throw new Error('expected enrollment result with id');
      expect(res.id).toBe('enr-1');
    });
    it('does not lock when overflow', async () => {
      repo.findById.mockResolvedValue({ id: classId, subject_id: subjectId, semester_id: 'sem-1', capacity: 30 });
      enrollmentService.enroll.mockResolvedValue({ overflow: true });
      await service.enrollStudent(classId, orgId, { studentId: 's1' } as any, actorId);
      expect(repo.lockGradingSchemeForClass).not.toHaveBeenCalled();
    });
    it('does not lock when not first enrollment', async () => {
      repo.findById.mockResolvedValue({ id: classId, subject_id: subjectId, semester_id: 'sem-1', capacity: 30 });
      enrollmentService.enroll.mockResolvedValue({ id: 'enr-2' });
      enrollmentService.countActive.mockResolvedValue(2);
      await service.enrollStudent(classId, orgId, { studentId: 's1' } as any, actorId);
      expect(repo.lockGradingSchemeForClass).not.toHaveBeenCalled();
    });
  });

  describe('reassignEducator', () => {
    it('throws NotFound when class missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.reassignEducator('nope', orgId, { educatorId: 'new' } as any, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws BadRequest when already assigned', async () => {
      repo.findById.mockResolvedValue({ id: classId, educator_id: educatorId, school_year_id: schoolYearId, schedules: [] });
      await expect(service.reassignEducator(classId, orgId, { educatorId } as any, actorId)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws Conflict when new educator has overlap', async () => {
      repo.findById.mockResolvedValue({ id: classId, educator_id: educatorId, school_year_id: schoolYearId, schedules: [{ weekday: 1, start_time: todayISO('08:00'), end_time: todayISO('09:00') }] });
      repo.findEducatorSchedules.mockResolvedValue([{ weekday: 1, start_time: todayISO('08:30'), end_time: todayISO('09:30'), class_id: 'other' }]);
      await expect(service.reassignEducator(classId, orgId, { educatorId: 'new-edu' } as any, actorId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('succeeds, logs ownership and audit', async () => {
      repo.findById.mockResolvedValue({ id: classId, educator_id: educatorId, school_year_id: schoolYearId, schedules: [{ weekday: 1, start_time: todayISO('08:00'), end_time: todayISO('09:00') }] });
      repo.findEducatorSchedules.mockResolvedValue([]);
      repo.update.mockResolvedValue({ id: classId, educator_id: 'new-edu' });
      const res = await service.reassignEducator(classId, orgId, { educatorId: 'new-edu', reason: 'swap' } as any, actorId);
      expect(repo.createOwnershipLog).toHaveBeenCalledWith(expect.objectContaining({ fromEducatorId: educatorId, toEducatorId: 'new-edu' }));
      expect(repo.update).toHaveBeenCalledWith(classId, { educatorId: 'new-edu' });
      expect(auditLogService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'class_reassigned' }));
      expect(res.educator_id).toBe('new-edu');
    });
  });

  describe('other helpers', () => {
    it('getEnrolledStudents throws NotFound when class missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getEnrolledStudents('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('hasActiveClasses returns boolean', async () => {
      repo.findActiveClassesByEducator.mockResolvedValue([]);
      expect(await service.hasActiveClasses('edu-1', orgId)).toBe(false);
      repo.findActiveClassesByEducator.mockResolvedValue([{ id: 'c1' }]);
      expect(await service.hasActiveClasses('edu-1', orgId)).toBe(true);
    });
    it('getEducatorClassCounts delegates', async () => {
      repo.countAssignedClasses.mockResolvedValue(new Map([['edu-1', 3]]));
      const res = await service.getEducatorClassCounts(orgId, ['edu-1']);
      expect(res.get('edu-1')).toBe(3);
    });
    it('slotsOverlap via parseSlots: non-overlapping same weekday', async () => {
      mockResolveProgramIdSuccess();
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      mockResolveSemesterSuccess();
      repo.findEducatorSchedules.mockResolvedValue([{ weekday: 1, start_time: todayISO('08:00'), end_time: todayISO('09:00'), class_id: 'other' }]);
      // New slot 09:00-10:00 should NOT conflict (end == start is not overlap)
      repo.create.mockResolvedValue({ id: classId });
      repo.findById.mockResolvedValue({ id: classId });
      await expect(service.create(orgId, { subjectId, educatorId, schoolYearId, capacity: 30, schedules: [makeSlot(1, '09:00', '10:00')] } as any, actorId)).resolves.toBeDefined();
    });
  });
});
