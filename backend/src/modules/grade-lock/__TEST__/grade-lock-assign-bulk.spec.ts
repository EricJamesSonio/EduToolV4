import { NotFoundException } from '@nestjs/common';
import { GradeLockOperationsService } from '../grade-lock-operations.service';

const SETTING_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_SETTING_ID = '22222222-2222-4222-8222-222222222222';

const uuid = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

interface LockState {
  class_id: string;
  is_locked: boolean;
  setting_id: string;
}

describe('GradeLockOperationsService.assignSettingBulk', () => {
  /**
   * Builds a service whose repository records every call, so the tests can
   * assert on query COUNT (the whole point of this endpoint) as well as on the
   * returned counters.
   */
  const makeService = (opts: {
    activeClassIds?: string[];
    lockStates?: LockState[];
    settingFound?: boolean;
  }) => {
    const {
      activeClassIds = [],
      lockStates = [],
      settingFound = true,
    } = opts;

    const calls: { method: string; args: unknown[] }[] = [];
    const record =
      (method: string, impl: (...args: never[]) => unknown) =>
      (...args: never[]) => {
        calls.push({ method, args });
        return impl(...args);
      };

    const repo = {
      findSettingById: jest.fn(async (orgId: string, id: string) => {
        calls.push({ method: 'findSettingById', args: [orgId, id] });
        return settingFound ? { id, org_id: orgId } : null;
      }),
      findActiveClassIds: jest.fn(
        async (_db: unknown, _org: string, ids: string[]) => {
          calls.push({ method: 'findActiveClassIds', args: [ids] });
          return ids.filter((id) => activeClassIds.includes(id));
        },
      ),
      findLockStates: jest.fn(async (_db: unknown, _org: string, ids: string[]) => {
        calls.push({ method: 'findLockStates', args: [ids] });
        return lockStates.filter((l) => ids.includes(l.class_id));
      }),
      reassignUnlocked: jest.fn(
        record('reassignUnlocked', async () => ({ count: 0 })),
      ),
      createLocks: jest.fn(record('createLocks', async () => ({ count: 0 }))),
      createEvents: jest.fn(record('createEvents', async () => ({ count: 0 }))),
      // Unused by this path — present so an accidental call is a hard failure
      // rather than a silent TypeError.
      upsertLock: jest.fn(),
      createLock: jest.fn(),
      createEvent: jest.fn(),
    };

    const db = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn(db),
      ),
    };

    const auditLogService = {
      logAdminAction: jest.fn().mockResolvedValue(undefined),
    };

    const service = new GradeLockOperationsService(
      repo as never,
      {} as never,
      auditLogService as never,
      {} as never,
      db as never,
    );

    return { service, repo, db, auditLogService, calls };
  };

  const countOf = (calls: { method: string }[], method: string): number =>
    calls.filter((c) => c.method === method).length;

  it('404s when the setting does not belong to the org', async () => {
    const { service, repo } = makeService({ settingFound: false });

    await expect(
      service.assignSettingBulk('org-1', 'actor-1', {
        setting_id: SETTING_ID,
        class_ids: [uuid(1)],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repo.reassignUnlocked).not.toHaveBeenCalled();
    expect(repo.createLocks).not.toHaveBeenCalled();
  });

  it('creates locks for a set of all-new classes', async () => {
    const ids = [uuid(1), uuid(2), uuid(3)];
    const { service, repo, db, calls } = makeService({ activeClassIds: ids });

    const res = await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: ids,
    });

    expect(res).toEqual({
      assigned: 3,
      skippedLocked: 0,
      skippedUnchanged: 0,
      skippedInvalid: 0,
    });
    expect(repo.createLocks).toHaveBeenCalledTimes(1);
    expect(repo.reassignUnlocked).not.toHaveBeenCalled();
    expect(repo.createEvents).toHaveBeenCalledTimes(1);
    expect(db.$transaction).toHaveBeenCalledTimes(1);

    // All reads happened before the transaction opened.
    expect(
      calls.some((c) => c.method === 'findActiveClassIds'),
    ).toBe(true);
    expect(calls.some((c) => c.method === 'findLockStates')).toBe(true);

    // One event row per changed class.
    const eventArgs = repo.createEvents.mock.calls[0][1] as {
      class_id: string;
    }[];
    expect(eventArgs).toHaveLength(3);
    expect(eventArgs.map((e) => e.class_id).sort()).toEqual([...ids].sort());
  });

  it('reassigns existing locks that are on a different setting', async () => {
    const ids = [uuid(1), uuid(2)];
    const { service, repo } = makeService({
      activeClassIds: ids,
      lockStates: [
        { class_id: uuid(1), is_locked: false, setting_id: OTHER_SETTING_ID },
        { class_id: uuid(2), is_locked: false, setting_id: OTHER_SETTING_ID },
      ],
    });

    const res = await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: ids,
    });

    expect(res.assigned).toBe(2);
    expect(repo.reassignUnlocked).toHaveBeenCalledTimes(1);
    expect(repo.createLocks).not.toHaveBeenCalled();
  });

  it('skips locked classes and reports them', async () => {
    const ids = [uuid(1), uuid(2), uuid(3)];
    const { service, repo } = makeService({
      activeClassIds: ids,
      lockStates: [
        { class_id: uuid(1), is_locked: true, setting_id: OTHER_SETTING_ID },
        { class_id: uuid(2), is_locked: false, setting_id: OTHER_SETTING_ID },
      ],
    });

    const res = await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: ids,
    });

    expect(res).toEqual({
      assigned: 2, // uuid(2) updated, uuid(3) created
      skippedLocked: 1,
      skippedUnchanged: 0,
      skippedInvalid: 0,
    });
    // The locked class is never written.
    const updated = repo.reassignUnlocked.mock.calls[0][2] as string[];
    expect(updated).toEqual([uuid(2)]);
  });

  it('counts already-on-setting classes as skippedUnchanged and writes nothing', async () => {
    const ids = [uuid(1), uuid(2)];
    const { service, repo, db, auditLogService } = makeService({
      activeClassIds: ids,
      lockStates: [
        { class_id: uuid(1), is_locked: false, setting_id: SETTING_ID },
        { class_id: uuid(2), is_locked: false, setting_id: SETTING_ID },
      ],
    });

    const res = await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: ids,
    });

    expect(res).toEqual({
      assigned: 0,
      skippedLocked: 0,
      skippedUnchanged: 2,
      skippedInvalid: 0,
    });
    // Re-run safety: no transaction, no writes, no duplicate events.
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(repo.reassignUnlocked).not.toHaveBeenCalled();
    expect(repo.createLocks).not.toHaveBeenCalled();
    expect(repo.createEvents).not.toHaveBeenCalled();
    // ...but the audit summary is still written, so the attempt is traceable.
    expect(auditLogService.logAdminAction).toHaveBeenCalledTimes(1);
  });

  it('counts unknown / soft-deleted / cross-org ids as skippedInvalid', async () => {
    const { service } = makeService({
      activeClassIds: [uuid(1)],
      lockStates: [
        { class_id: uuid(1), is_locked: false, setting_id: OTHER_SETTING_ID },
      ],
    });

    const res = await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: [uuid(1), uuid(99), uuid(98), uuid(97)],
    });

    expect(res).toEqual({
      assigned: 1,
      skippedLocked: 0,
      skippedUnchanged: 0,
      skippedInvalid: 3,
    });
  });

  it('de-duplicates repeated ids before counting', async () => {
    const { service } = makeService({
      activeClassIds: [uuid(1)],
      lockStates: [
        { class_id: uuid(1), is_locked: false, setting_id: OTHER_SETTING_ID },
      ],
    });

    const res = await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: [uuid(1), uuid(1), uuid(1)],
    });

    // Requested collapses to 1, so skippedInvalid must be 0, not 2.
    expect(res).toEqual({
      assigned: 1,
      skippedLocked: 0,
      skippedUnchanged: 0,
      skippedInvalid: 0,
    });
  });

  it('splits >1000 rows into internal sub-batches inside one transaction', async () => {
    const ids = Array.from({ length: 2500 }, (_, i) => uuid(i + 1));
    const { service, repo, db } = makeService({ activeClassIds: ids });

    const res = await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: ids,
    });

    expect(res.assigned).toBe(2500);

    // 2500 rows -> 3 sub-batches of at most 1000.
    expect(repo.createLocks).toHaveBeenCalledTimes(3);
    const sizes = repo.createLocks.mock.calls.map(
      (call) => (call[2] as string[]).length,
    );
    expect(sizes).toEqual([1000, 1000, 500]);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(1000);

    // Events are sub-batched the same way.
    expect(repo.createEvents).toHaveBeenCalledTimes(3);
    const eventSizes = repo.createEvents.mock.calls.map(
      (call) => (call[1] as unknown[]).length,
    );
    expect(eventSizes).toEqual([1000, 1000, 500]);

    // Still ONE transaction.
    expect(db.$transaction).toHaveBeenCalledTimes(1);
  });

  it('keeps query count bounded for a large mixed batch', async () => {
    const ids = Array.from({ length: 1200 }, (_, i) => uuid(i + 1));
    // Half already locked, half needing creation.
    const lockStates: LockState[] = ids
      .filter((_, i) => i % 2 === 0)
      .map((id) => ({
        class_id: id,
        is_locked: true,
        setting_id: OTHER_SETTING_ID,
      }));

    const { service, calls } = makeService({ activeClassIds: ids, lockStates });

    await service.assignSettingBulk('org-1', 'actor-1', {
      setting_id: SETTING_ID,
      class_ids: ids,
    });

    // Reads: one per sub-batch of the IN(...) list, never per class.
    expect(countOf(calls, 'findActiveClassIds')).toBe(2); // 1200 -> 2 batches
    expect(countOf(calls, 'findSettingById')).toBe(1);
  });
});
