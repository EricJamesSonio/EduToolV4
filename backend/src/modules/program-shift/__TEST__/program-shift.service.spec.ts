import { ProgramShiftService } from '../program-shift.service';
import { ProgramShiftRepository } from '../program-shift.repository';

describe('Phase 3 — ProgramShift proof', () => {
  let service: ProgramShiftService;
  let repo: jest.Mocked<ProgramShiftRepository>;
  let db: {
    classAssignmentRequest: { findFirst: jest.Mock };
    program: { findFirst: jest.Mock };
    level: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  } & Record<string, unknown>;
  let readiness: { assertReady: jest.Mock };
  let sectionService: { findById: jest.Mock; countStudentsInSection: jest.Mock };
  let audit: { logAdminAction: jest.Mock };
  let orgSetting: { getByOrg: jest.Mock };
  let mockTx: {
    studentProgramEnrollment: { update: jest.Mock; create: jest.Mock };
    programShiftEvent: { create: jest.Mock };
    enrollment: { update: jest.Mock };
  };

  beforeEach(() => {
    mockTx = {
      studentProgramEnrollment: {
        update: jest.fn().mockResolvedValue({ id: 'old-pe-ended' }),
        create: jest.fn().mockResolvedValue({ id: 'new-pe', program_id: 'prog-B' }),
      },
      programShiftEvent: {
        create: jest.fn().mockResolvedValue({ id: 'shift-1' }),
      },
      enrollment: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    db = {
      classAssignmentRequest: { findFirst: jest.fn().mockResolvedValue(null) },
      program: {
        findFirst: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
          if (where.id === 'prog-A') return Promise.resolve({ id: 'prog-A', school_year_id: 'sy-1', type: 'college' });
          if (where.id === 'prog-B') return Promise.resolve({ id: 'prog-B', school_year_id: 'sy-1', type: 'college' });
          if (where.id === 'prog-X') return Promise.resolve({ id: 'prog-X', school_year_id: 'sy-other', type: 'college' });
          if (where.id === 'prog-shs') return Promise.resolve({ id: 'prog-shs', school_year_id: 'sy-1', type: 'shs' });
          return Promise.resolve({ id: where.id, school_year_id: 'sy-1', type: 'college' });
        }),
      },
      level: {
        findFirst: jest.fn().mockResolvedValue({ id: 'lvl-1', program_id: 'prog-B', course_id: null, strand_id: null }),
      },
      $transaction: jest.fn(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
    } as unknown as typeof db;

    repo = {
      findStudentSchoolYearById: jest.fn().mockResolvedValue({
        id: 'ssy-1',
        student_id: 'stu-1',
        school_year_id: 'sy-1',
      } as never),
      findActiveProgramEnrollment: jest.fn().mockResolvedValue({
        id: 'pe-old',
        program_id: 'prog-A',
        course_id: null,
        strand_id: null,
        level_id: 'lvl-old',
      } as never),
      findEnrollmentsForOldProgramTx: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ProgramShiftRepository>;

    readiness = { assertReady: jest.fn().mockResolvedValue(undefined) };
    sectionService = {
      findById: jest.fn().mockResolvedValue({ id: 'sec-1', level_id: 'lvl-1', course_id: null, strand_id: null, capacity: 30 }),
      countStudentsInSection: jest.fn().mockResolvedValue(0),
    };
    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    orgSetting = { getByOrg: jest.fn().mockResolvedValue({ default_shift_outcome: 'dropped' }) };

    service = new ProgramShiftService(
      db as unknown as never,
      repo,
      readiness as unknown as never,
      sectionService as unknown as never,
      audit as unknown as never,
      orgSetting as unknown as never,
    );
  });

  it('happy path: ends old, creates new, creates shift event, flips enrollments with default outcome', async () => {
    repo.findEnrollmentsForOldProgramTx.mockResolvedValue([
      { id: 'enr-1' } as never,
      { id: 'enr-2' } as never,
    ]);

    const result = await service.shiftProgram('org-1', 'ssy-1', 'actor-1', {
      toProgramId: 'prog-B',
      levelId: 'lvl-1',
    } as never);

    expect(repo.findStudentSchoolYearById).toHaveBeenCalled();
    expect(db.$transaction).toHaveBeenCalled();
    expect(mockTx.studentProgramEnrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pe-old' } }),
    );
    expect(mockTx.studentProgramEnrollment.create).toHaveBeenCalled();
    expect(mockTx.programShiftEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ default_outcome_used: 'dropped' }) }),
    );
    expect(mockTx.enrollment.update).toHaveBeenCalledTimes(2);
    expect(mockTx.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'removed', outcome: 'dropped' }) }),
    );
    expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'program_shift' }));
    expect(result.affectedCount).toBe(2);
  });

  it('blocked by pending class assignment request (no requests during active shift)', async () => {
    (db.classAssignmentRequest.findFirst as jest.Mock).mockResolvedValue({ id: 'req-pending' });

    await expect(
      service.shiftProgram('org-1', 'ssy-1', 'actor-1', { toProgramId: 'prog-B', levelId: 'lvl-1' } as never),
    ).rejects.toThrow('Resolve pending class assignment request');
  });

  it('blocked cross-year (same StudentSchoolYear guard)', async () => {
    await expect(
      service.shiftProgram('org-1', 'ssy-1', 'actor-1', { toProgramId: 'prog-X', levelId: 'lvl-1' } as never),
    ).rejects.toThrow('same school year');
  });

  it('per-class override: one enrollment uses override outcome, other uses default', async () => {
    repo.findEnrollmentsForOldProgramTx.mockResolvedValue([
      { id: 'enr-1' } as never,
      { id: 'enr-2' } as never,
    ]);

    await service.shiftProgram('org-1', 'ssy-1', 'actor-1', {
      toProgramId: 'prog-B',
      levelId: 'lvl-1',
      perClassOutcomeOverrides: [
        { enrollmentId: 'enr-1', outcome: 'withdrawn_due_to_shifting', reason: 'admin override' },
      ],
    } as never);

    expect(mockTx.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'enr-1' }, data: expect.objectContaining({ outcome: 'withdrawn_due_to_shifting', outcome_reason: 'admin override' }) }),
    );
    expect(mockTx.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'enr-2' }, data: expect.objectContaining({ outcome: 'dropped', outcome_reason: null }) }),
    );
  });

  it('allows same SHS program with different strand (HUMSS → ABM) — same department, different strand', async () => {
    // Active is SHS HUMSS
    repo.findActiveProgramEnrollment.mockResolvedValue({
      id: 'pe-old',
      program_id: 'prog-shs',
      course_id: null,
      strand_id: 'strand-humss',
      level_id: 'lvl-11',
    } as never);
    (db.program.findFirst as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === 'prog-shs') return Promise.resolve({ id: 'prog-shs', school_year_id: 'sy-1', type: 'shs' });
      return Promise.resolve({ id: where.id, school_year_id: 'sy-1', type: 'shs' });
    });
    (db.level.findFirst as jest.Mock).mockResolvedValue({ id: 'lvl-12', program_id: 'prog-shs', strand_id: 'strand-abm' });
    repo.findEnrollmentsForOldProgramTx.mockResolvedValue([]);

    const result = await service.shiftProgram('org-1', 'ssy-1', 'actor-1', {
      toProgramId: 'prog-shs',
      strandId: 'strand-abm',
      levelId: 'lvl-12',
    } as never);

    expect(result.created).toBeDefined();
    expect(mockTx.studentProgramEnrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ strand_id: 'strand-abm', level_id: 'lvl-12' }) }),
    );
  });

  it('allows same College program with different course and level (BSCS 3 → BSA 1)', async () => {
    repo.findActiveProgramEnrollment.mockResolvedValue({
      id: 'pe-old',
      program_id: 'prog-college',
      course_id: 'course-bscs',
      strand_id: null,
      level_id: 'lvl-3',
    } as never);
    (db.program.findFirst as jest.Mock).mockResolvedValue({ id: 'prog-college', school_year_id: 'sy-1', type: 'college' });
    (db.level.findFirst as jest.Mock).mockResolvedValue({ id: 'lvl-1', program_id: 'prog-college', course_id: 'course-bsa' });
    repo.findEnrollmentsForOldProgramTx.mockResolvedValue([]);

    const result = await service.shiftProgram('org-1', 'ssy-1', 'actor-1', {
      toProgramId: 'prog-college',
      courseId: 'course-bsa',
      levelId: 'lvl-1',
    } as never);

    expect(result.created).toBeDefined();
    expect(mockTx.studentProgramEnrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ course_id: 'course-bsa', level_id: 'lvl-1' }) }),
    );
  });

  it('blocks same placement (same program, course, strand and level)', async () => {
    repo.findActiveProgramEnrollment.mockResolvedValue({
      id: 'pe-old',
      program_id: 'prog-A',
      course_id: null,
      strand_id: null,
      level_id: 'lvl-1',
    } as never);
    (db.program.findFirst as jest.Mock).mockResolvedValue({ id: 'prog-A', school_year_id: 'sy-1', type: 'college' });
    (db.level.findFirst as jest.Mock).mockResolvedValue({ id: 'lvl-1', program_id: 'prog-A' });

    await expect(
      service.shiftProgram('org-1', 'ssy-1', 'actor-1', { toProgramId: 'prog-A', levelId: 'lvl-1' } as never),
    ).rejects.toThrow('same as current');
  });

  it('blocks cross-department shift (College → Elementary not allowed, use enrollment)', async () => {
    repo.findActiveProgramEnrollment.mockResolvedValue({
      id: 'pe-old',
      program_id: 'prog-A',
      course_id: null,
      strand_id: null,
      level_id: 'lvl-old',
    } as never);
    (db.program.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 'prog-elem', school_year_id: 'sy-1', type: 'elementary' })
      .mockResolvedValueOnce({ id: 'prog-A', school_year_id: 'sy-1', type: 'college' });
    (db.level.findFirst as jest.Mock).mockResolvedValue({ id: 'lvl-elem', program_id: 'prog-elem' });

    await expect(
      service.shiftProgram('org-1', 'ssy-1', 'actor-1', { toProgramId: 'prog-elem', levelId: 'lvl-elem' } as never),
    ).rejects.toThrow('across departments');
  });
});
