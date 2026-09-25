import { EnrollmentAutoLockService } from '../enrollment-auto-lock.service';

// Perf Phase 3: lockExpired flips all expired rows with one batched UPDATE
// and only audits rows it actually transitioned.

describe('EnrollmentAutoLockService.lockExpired — batched sweep', () => {
  const apps = [
    {
      id: 'app-1',
      org_id: 'org-1',
      application_code: 'A1',
      enrollmentPeriod: { name: 'P1', lock_date: new Date('2026-01-01') },
    },
    {
      id: 'app-2',
      org_id: 'org-1',
      application_code: 'A2',
      enrollmentPeriod: { name: 'P1', lock_date: new Date('2026-01-01') },
    },
  ];

  const makeService = (lockedCount: number, lockedIds?: string[]) => {
    const repo = {
      findExpiredPendingApplications: jest.fn().mockResolvedValue(apps),
      lockApplication: jest.fn(),
      lockManyApplications: jest.fn().mockResolvedValue({ count: lockedCount }),
      findLockedApplicationsByIds: jest
        .fn()
        .mockResolvedValue((lockedIds ?? []).map((id) => ({ id }))),
    };
    const auditLogService = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    const service = new EnrollmentAutoLockService(
      repo as any,
      auditLogService as any,
    );
    return { service, repo, auditLogService };
  };

  it('locks all expired rows with one UPDATE and audits each', async () => {
    const { service, repo, auditLogService } = makeService(2);
    const res = await service.lockExpired();

    expect(res).toEqual({ success: true, lockedCount: 2 });
    expect(repo.lockManyApplications).toHaveBeenCalledTimes(1);
    expect(repo.lockManyApplications).toHaveBeenCalledWith(['app-1', 'app-2']);
    expect(repo.lockApplication).not.toHaveBeenCalled();
    // Fast path: count matches, no re-read needed.
    expect(repo.findLockedApplicationsByIds).not.toHaveBeenCalled();
    expect(auditLogService.logAdminAction).toHaveBeenCalledTimes(2);
  });

  it('only audits rows it actually locked when a concurrent sweep intervened', async () => {
    const { service, repo, auditLogService } = makeService(1, ['app-2']);
    const res = await service.lockExpired();

    expect(res).toEqual({ success: true, lockedCount: 1 });
    expect(repo.findLockedApplicationsByIds).toHaveBeenCalledTimes(1);
    expect(auditLogService.logAdminAction).toHaveBeenCalledTimes(1);
    expect(auditLogService.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 'app-2' }),
    );
  });

  it('is a no-op when nothing expired', async () => {
    const repo = {
      findExpiredPendingApplications: jest.fn().mockResolvedValue([]),
      lockApplication: jest.fn(),
      lockManyApplications: jest.fn().mockResolvedValue({ count: 0 }),
      findLockedApplicationsByIds: jest.fn(),
    };
    const auditLogService = { logAdminAction: jest.fn() };
    const service = new EnrollmentAutoLockService(
      repo as any,
      auditLogService as any,
    );

    expect(await service.lockExpired()).toEqual({ success: true, lockedCount: 0 });
    expect(repo.lockManyApplications).toHaveBeenCalledWith([]);
    expect(auditLogService.logAdminAction).not.toHaveBeenCalled();
  });
});
