import { AuditLogRepository } from '../audit-log.repository';
import { NotificationRepository } from '../../notification/notification.repository';

// Perf Phase 4: log/notification reads are paginated {data, meta} with the
// same filter semantics as the old unbounded findMany calls.

describe('AuditLogRepository pagination', () => {
  const makeRepo = () => {
    const db = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
        count: jest.fn().mockResolvedValue(95),
      },
    };
    return { repo: new AuditLogRepository(db as never), db };
  };

  it('findAdminLogs pages with skip/take + total and keeps filters', async () => {
    const { repo, db } = makeRepo();
    const res = await repo.findAdminLogs('org-1', {
      action: 'grade_locked',
      page: 3,
      limit: 20,
    });

    expect(res).toEqual({
      data: [{ id: 'log-1' }],
      meta: { total: 95, page: 3, limit: 20, totalPages: 5 },
    });
    expect(db.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          org_id: 'org-1',
          log_type: 'admin',
          action: 'grade_locked',
        }),
        orderBy: { created_at: 'desc' },
        skip: 40,
        take: 20,
      }),
    );
    expect(db.auditLog.count).toHaveBeenCalledTimes(1);
  });

  it('findActivityLogs supports exact + contains action filters', async () => {
    const { repo, db } = makeRepo();
    await repo.findActivityLogs('org-1', {
      classId: 'class-1',
      actionContains: 'grade',
    });

    expect(db.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          org_id: 'org-1',
          log_type: 'activity',
          entity_type: 'class',
          entity_id: 'class-1',
          action: { contains: 'grade', mode: 'insensitive' },
        }),
        skip: 0,
        take: 20,
      }),
    );
  });
});

describe('NotificationRepository pagination', () => {
  it('findByUser pages the inbox with skip/take + total', async () => {
    const db = {
      notification: {
        findMany: jest.fn().mockResolvedValue([{ id: 'n-1' }]),
        count: jest.fn().mockResolvedValue(3),
      },
    };
    const repo = new NotificationRepository(db as never);

    const res = await repo.findByUser('acc-1', 'org-1', true, 2, 20);

    expect(res).toEqual({
      data: [{ id: 'n-1' }],
      meta: { total: 3, page: 2, limit: 20, totalPages: 1 },
    });
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          account_id: 'acc-1',
          archived_at: null,
          read_at: null,
        }),
        skip: 20,
        take: 20,
      }),
    );
  });
});
