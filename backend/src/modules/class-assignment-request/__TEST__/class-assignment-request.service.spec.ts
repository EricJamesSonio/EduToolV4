import { ClassAssignmentRequestService } from '../class-assignment-request.service';
import { ClassAssignmentRequestRepository } from '../class-assignment-request.repository';

describe('Phase 3A — ClassAssignmentRequest proof', () => {
  let service: ClassAssignmentRequestService;
  let repo: jest.Mocked<ClassAssignmentRequestRepository>;
  let db: {
    studentSchoolYear: { findFirst: jest.Mock };
    subject: { findMany: jest.Mock };
  } & Record<string, unknown>;
  let audit: { logAdminAction: jest.Mock };

  beforeEach(() => {
    repo = {
      findPendingByStudentSchoolYear: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'req-1', status: 'pending_review' }),
      findById: jest.fn(),
      finalize: jest.fn(),
      reopen: jest.fn(),
      findPendingStudentIds: jest.fn(),
      findMany: jest.fn(),
    } as unknown as jest.Mocked<ClassAssignmentRequestRepository>;

    db = {
      studentSchoolYear: { findFirst: jest.fn().mockResolvedValue({ id: 'ssy-1', student_id: 'stu-1', status: 'active' }) },
      subject: { findMany: jest.fn().mockResolvedValue([{ id: 'subj-1' }, { id: 'subj-2' }]) },
    } as unknown as typeof db;

    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };

    service = new ClassAssignmentRequestService(repo, db as unknown as never, audit as unknown as never);
  });

  it('creates request before section assignment (enrolled but no section yet)', async () => {
    // SSY active even though program enrollment has no section — service only checks SSY, not section
    const result = await service.create('org-1', 'actor-1', {
      studentSchoolYearId: 'ssy-1',
      origin: 'student_request',
      studentRequestedSubjectIds: ['subj-1', 'subj-2'],
    } as never);

    expect(repo.findPendingByStudentSchoolYear).toHaveBeenCalledWith('ssy-1', 'org-1');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        student_id: 'stu-1',
        origin: 'student_request',
        status: 'pending_review',
      }),
    );
    expect(result.status).toBe('pending_review');
    expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'class_assignment_request_created' }));
  });

  it('rejects duplicate pending request', async () => {
    repo.findPendingByStudentSchoolYear.mockResolvedValue({ id: 'existing' } as never);
    await expect(
      service.create('org-1', 'actor-1', {
        studentSchoolYearId: 'ssy-1',
        origin: 'student_request',
        studentRequestedSubjectIds: ['subj-1'],
      } as never),
    ).rejects.toThrow('pending request already exists');
  });

  it('finalize → ready (admin send triggers ready)', async () => {
    repo.findById.mockResolvedValue({ id: 'req-1', status: 'pending_review' } as never);
    repo.finalize.mockResolvedValue({ id: 'req-1', status: 'ready', admin_finalized_subject_ids: ['subj-1'] } as never);
    // finalized subjects exist
    (db.subject.findMany as jest.Mock).mockResolvedValue([{ id: 'subj-1' }]);

    const finalized = await service.finalize('req-1', 'org-1', 'admin-1', {
      adminFinalizedSubjectIds: ['subj-1'],
    } as never);

    expect(repo.finalize).toHaveBeenCalledWith('req-1', ['subj-1'], 'admin-1');
    expect(finalized.status).toBe('ready');
    expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'class_assignment_request_finalized' }));
  });

  it('reopen → pending_review (reversible)', async () => {
    repo.findById.mockResolvedValue({ id: 'req-1', status: 'ready' } as never);
    repo.reopen.mockResolvedValue({ id: 'req-1', status: 'pending_review' } as never);

    const reopened = await service.reopen('req-1', 'org-1', 'admin-1', { reason: 'schedule changed' } as never);

    expect(repo.reopen).toHaveBeenCalledWith('req-1', 'schedule changed');
    expect(reopened.status).toBe('pending_review');
    expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'class_assignment_request_reopened' }));
  });

  it('batch-skip: pending_review students are excluded via getPendingStudentIds', async () => {
    repo.findPendingStudentIds.mockResolvedValue([{ student_id: 'stu-1' }, { student_id: 'stu-2' }] as never);

    const ids = await service.getPendingStudentIds('org-1', 'sy-1');

    expect(repo.findPendingStudentIds).toHaveBeenCalledWith('org-1', 'sy-1');
    expect(ids).toEqual(['stu-1', 'stu-2']);
    // Batch enrollment would do: eligible = allStudents.filter(s => !ids.includes(s.id))
    const all = ['stu-1', 'stu-2', 'stu-3'];
    const batchEligible = all.filter((id) => !ids.includes(id));
    expect(batchEligible).toEqual(['stu-3']);
  });
});
