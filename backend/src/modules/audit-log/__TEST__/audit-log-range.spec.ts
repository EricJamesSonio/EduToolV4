import { AuditLogService } from '../audit-log.service';

/**
 * TICK-INFRA-017 (Step 4.5) — date-only range bounds cover the whole Manila
 * school day. Deterministic under every process TZ.
 */
describe('audit-log range bounds (TICK-INFRA-017)', () => {
  function serviceWith() {
    const repository = {
      findAdminLogs: jest.fn().mockResolvedValue({ data: [], meta: {} }),
      findActivityLogs: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    };
    return {
      service: new AuditLogService(repository as never),
      repository,
    };
  }

  it('expands date-only `to` to the end of that Manila day', async () => {
    const { service, repository } = serviceWith();
    await service.findAdminLogs('org-1', { to: '2026-10-06' });
    const filters = repository.findAdminLogs.mock.calls[0][1] as {
      to?: Date;
    };
    // End of Oct 6 in Manila == 15:59:59.999Z Oct 6.
    expect(filters.to?.toISOString()).toBe('2026-10-06T15:59:59.999Z');
  });

  it('expands date-only `from` to the start of that Manila day', async () => {
    const { service, repository } = serviceWith();
    await service.findActivityLogs('org-1', { from: '2026-10-06' });
    const filters = repository.findActivityLogs.mock.calls[0][1] as {
      from?: Date;
    };
    expect(filters.from?.toISOString()).toBe('2026-10-05T16:00:00.000Z');
  });

  it('includes 23:59 Manila on the `to` day, excludes 00:00 the next day', async () => {
    const { service, repository } = serviceWith();
    await service.findAdminLogs('org-1', { to: '2026-10-06' });
    const filters = repository.findAdminLogs.mock.calls[0][1] as {
      to: Date;
    };
    const bound = filters.to.getTime();
    // 23:59 Manila Oct 6 == 15:59Z Oct 6 → included (lte).
    expect(new Date('2026-10-06T15:59:00.000Z').getTime() <= bound).toBe(true);
    // 00:00 Manila Oct 7 == 16:00Z Oct 6 → excluded.
    expect(new Date('2026-10-06T16:00:00.000Z').getTime() <= bound).toBe(false);
  });

  it('passes full ISO bounds through as exact instants', async () => {
    const { service, repository } = serviceWith();
    await service.findAdminLogs('org-1', {
      from: '2026-10-06T09:00:00.000Z',
      to: '2026-10-06T17:00:00+08:00',
    });
    const filters = repository.findAdminLogs.mock.calls[0][1] as {
      from: Date;
      to: Date;
    };
    expect(filters.from.toISOString()).toBe('2026-10-06T09:00:00.000Z');
    expect(filters.to.toISOString()).toBe('2026-10-06T09:00:00.000Z');
  });
});
