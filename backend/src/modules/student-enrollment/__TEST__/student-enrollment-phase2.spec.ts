import { StudentEnrollmentService } from '../student-enrollment.service';
import { StudentEnrollmentRepository } from '../student-enrollment.repository';

describe('Phase 2 — re-enrollment after ended + soft delete', () => {
  let service: StudentEnrollmentService;
  let repo: jest.Mocked<StudentEnrollmentRepository>;
  let audit: { logAdminAction: jest.Mock };
  let sectionService: { findById: jest.Mock; countStudentsInSection: jest.Mock };
  let readiness: { assertReady: jest.Mock };

  beforeEach(() => {
    repo = {
      findByStudentAndSchoolYear: jest.fn(),
      findProgramEnrollmentById: jest.fn(),
      enrollInProgram: jest.fn(),
      removeProgramEnrollment: jest.fn(),
      findActiveEnrollmentForStudent: jest.fn(),
    } as unknown as jest.Mocked<StudentEnrollmentRepository>;

    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    sectionService = {
      findById: jest.fn(),
      countStudentsInSection: jest.fn(),
    };
    readiness = { assertReady: jest.fn().mockResolvedValue(undefined) };

    service = new StudentEnrollmentService(
      repo as unknown as StudentEnrollmentRepository,
      audit as unknown as never,
      sectionService as unknown as never,
      readiness as unknown as never,
    );
  });

  it('allows re-enroll in same program after previous enrollment was ended', async () => {
    const schoolYearId = 'sy-1';
    const studentId = 'stu-1';
    const orgId = 'org-1';

    // SSY with one program enrollment that is ended (not active)
    repo.findByStudentAndSchoolYear.mockResolvedValue({
      id: 'ssy-1',
      status: 'active',
      programEnrollments: [
        { program_id: 'prog-A', status: 'ended' } as never,
      ],
    } as never);

    repo.enrollInProgram.mockResolvedValue({ id: 'new-pe' } as never);

    const result = await service.enrollInProgram(
      schoolYearId,
      studentId,
      orgId,
      { program_id: 'prog-A' } as never,
      'actor-1',
    );

    expect(readiness.assertReady).toHaveBeenCalled();
    expect(repo.enrollInProgram).toHaveBeenCalled();
    expect(result).toEqual({ id: 'new-pe' });
  });

  it('still blocks duplicate when active enrollment exists', async () => {
    repo.findByStudentAndSchoolYear.mockResolvedValue({
      id: 'ssy-1',
      status: 'active',
      programEnrollments: [
        { program_id: 'prog-A', status: 'active' } as never,
      ],
    } as never);

    await expect(
      service.enrollInProgram('sy-1', 'stu-1', 'org-1', { program_id: 'prog-A' } as never, 'actor-1'),
    ).rejects.toThrow('already enrolled');
  });

  it('removeProgramEnrollment soft-ends with admin_correction default and audits program_enrollment_ended', async () => {
    repo.findProgramEnrollmentById.mockResolvedValue({
      id: 'pe-1',
      org_id: 'org-1',
      status: 'active',
      studentSchoolYear: { student_id: 'stu-1', school_year_id: 'sy-1' },
    } as never);
    repo.removeProgramEnrollment.mockResolvedValue({ id: 'pe-1' } as never);

    await service.removeProgramEnrollment('pe-1', 'org-1', 'actor-99');

    expect(repo.removeProgramEnrollment).toHaveBeenCalledWith(
      'pe-1',
      'actor-99',
      'admin_correction',
    );
    expect(audit.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'program_enrollment_ended' }),
    );
  });

  it('respects explicit reason when ending', async () => {
    repo.findProgramEnrollmentById.mockResolvedValue({
      id: 'pe-2',
      org_id: 'org-1',
      status: 'active',
      studentSchoolYear: { student_id: 'stu-1', school_year_id: 'sy-1' },
    } as never);
    repo.removeProgramEnrollment.mockResolvedValue({ id: 'pe-2' } as never);

    await service.removeProgramEnrollment('pe-2', 'org-1', 'actor-1', { reason: 'other' });

    expect(repo.removeProgramEnrollment).toHaveBeenCalledWith('pe-2', 'actor-1', 'other');
  });

  it('rejects ending non-active enrollment', async () => {
    repo.findProgramEnrollmentById.mockResolvedValue({
      id: 'pe-3',
      org_id: 'org-1',
      status: 'ended',
      studentSchoolYear: { student_id: 'stu-1', school_year_id: 'sy-1' },
    } as never);

    await expect(service.removeProgramEnrollment('pe-3', 'org-1', 'actor-1')).rejects.toThrow(
      'not active',
    );
  });
});
