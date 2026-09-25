import { StudentEnrollmentService } from '../student-enrollment.service';

// Perf Phase 3: bulkEnrollStudents asserts readiness once, pre-checks
// conflicts with 2 batched queries, and keeps per-row conflict semantics.

describe('StudentEnrollmentService.bulkEnrollStudents — batched pre-checks', () => {
  const makeService = (existing: string[] = [], active: any[] = []) => {
    const repo = {
      findByStudentsAndSchoolYear: jest
        .fn()
        .mockResolvedValue(existing.map((student_id) => ({ student_id }))),
      findActiveEnrollmentsForStudents: jest.fn().mockResolvedValue(active),
      enrollStudent: jest
        .fn()
        .mockImplementation(async (_o: string, _y: string, studentId: string) => ({
          id: `enr-${studentId}`,
        })),
      // Old per-row methods must NOT be used by the bulk path anymore.
      findByStudentAndSchoolYear: jest.fn(),
      findActiveEnrollmentForStudent: jest.fn(),
    };
    const readinessService = { assertReady: jest.fn().mockResolvedValue(undefined) };
    const auditLogService = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    const service = new StudentEnrollmentService(
      repo as any,
      auditLogService as any,
      {} as any,
      readinessService as any,
    );
    return { service, repo, readinessService };
  };

  const dto = (ids: string[]) => ({
    students: ids.map((student_id) => ({ student_id })),
  });

  it('enrolls clean rows with 3 batched pre-check queries total', async () => {
    const { service, repo, readinessService } = makeService();
    const res = await service.bulkEnrollStudents('sy-1', 'org-1', dto(['s-1', 's-2']) as any, 'actor-1');

    expect(res).toEqual({ enrolled: ['s-1', 's-2'], failed: [] });
    expect(readinessService.assertReady).toHaveBeenCalledTimes(1);
    expect(repo.findByStudentsAndSchoolYear).toHaveBeenCalledTimes(1);
    expect(repo.findActiveEnrollmentsForStudents).toHaveBeenCalledTimes(1);
    expect(repo.findByStudentAndSchoolYear).not.toHaveBeenCalled();
    expect(repo.findActiveEnrollmentForStudent).not.toHaveBeenCalled();
    expect(repo.enrollStudent).toHaveBeenCalledTimes(2);
  });

  it('reports already-enrolled and active-elsewhere as failures with the same messages', async () => {
    const { service } = makeService(
      ['s-dup'],
      [{ student_id: 's-busy', schoolYear: { name: 'SY 2023' } }],
    );
    const res = await service.bulkEnrollStudents(
      'sy-1',
      'org-1',
      dto(['s-ok', 's-dup', 's-busy']) as any,
      'actor-1',
    );

    expect(res.enrolled).toEqual(['s-ok']);
    expect(res.failed).toEqual([
      { student_id: 's-dup', reason: 'Student is already enrolled in this school year.' },
      {
        student_id: 's-busy',
        reason: 'Student is already actively enrolled in "SY 2023". Unenroll them first.',
      },
    ]);
  });

  it('treats intra-batch duplicates as already-enrolled conflicts', async () => {
    const { service, repo } = makeService();
    const res = await service.bulkEnrollStudents(
      'sy-1',
      'org-1',
      dto(['s-1', 's-1']) as any,
      'actor-1',
    );

    expect(res.enrolled).toEqual(['s-1']);
    expect(res.failed).toEqual([
      { student_id: 's-1', reason: 'Student is already enrolled in this school year.' },
    ]);
    expect(repo.enrollStudent).toHaveBeenCalledTimes(1);
  });
});
