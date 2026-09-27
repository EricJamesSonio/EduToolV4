import { GroupyService } from '@/modules/groupy/groupy.service';

// Phase 2: reportRead persists every receipt immediately but coalesces the
// room-wide groupy:read:updated fan-out (leading + trailing 3s per viewer).

describe('GroupyService reportRead broadcast throttle (Phase 2)', () => {
  let service: GroupyService;
  let repo: {
    isClassMember: jest.Mock;
    findMessageById: jest.Mock;
    upsertReadReceipt: jest.Mock;
  };
  let gateway: { emitReadUpdated: jest.Mock };

  const classId = 'class-1';
  const orgId = 'org-1';
  const accountId = 'u-1';

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      isClassMember: jest.fn().mockResolvedValue(true),
      findMessageById: jest
        .fn()
        .mockImplementation(async (id: string) => ({ id, class_id: classId })),
      upsertReadReceipt: jest.fn().mockResolvedValue({}),
    };
    gateway = { emitReadUpdated: jest.fn() };
    service = new GroupyService(
      repo as never,
      gateway as never,
      {} as never,
      {} as never,
    );
  });

  it('persists every receipt but broadcasts leading + one trailing', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
    try {
      await service.reportRead(classId, orgId, accountId, 'msg-1');
      await service.reportRead(classId, orgId, accountId, 'msg-2');
      await service.reportRead(classId, orgId, accountId, 'msg-3');

      // All three receipts persisted (correctness untouched)…
      expect(repo.upsertReadReceipt).toHaveBeenCalledTimes(3);
      // …but only the leading broadcast went out so far.
      expect(gateway.emitReadUpdated).toHaveBeenCalledTimes(1);
      expect(gateway.emitReadUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ lastReadMessageId: 'msg-1' }),
      );

      jest.advanceTimersByTime(3_000);

      // One trailing broadcast with the latest pointer.
      expect(gateway.emitReadUpdated).toHaveBeenCalledTimes(2);
      expect(gateway.emitReadUpdated).toHaveBeenLastCalledWith(
        expect.objectContaining({ lastReadMessageId: 'msg-3' }),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('different viewers do not suppress each other', async () => {
    await service.reportRead(classId, orgId, 'u-1', 'msg-1');
    await service.reportRead(classId, orgId, 'u-2', 'msg-1');

    expect(gateway.emitReadUpdated).toHaveBeenCalledTimes(2);
  });
});
