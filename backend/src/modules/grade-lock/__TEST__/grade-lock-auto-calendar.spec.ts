import { validate } from 'class-validator';
import { GradeLockAutoService } from '../grade-lock-auto.service';
import {
  CreateGradeLockSettingDto,
  GrantUnlockDto,
  UpdateGradeLockSettingDto,
} from '../dto/grade-lock.dto';
import {
  addDaysToCalendarDate,
  calendarDateOf,
  calendarDateToUtc,
  todayInZone,
} from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 — relative grade-lock deadlines are CALENDAR math.
 *
 * schoolYear.end_date (kind B) minus deadlineDays is compared as
 * "YYYY-MM-DD" against todayInZone(). No setDate/getDate anywhere.
 * Fixtures are derived from the real today, so these pass under every
 * process TZ (UTC, Asia/Manila, America/Los_Angeles, Pacific/Kiritimati).
 */
describe('grade-lock instant DTOs (TICK-INFRA-017)', () => {
  async function errorsFor(dto: object): Promise<string[]> {
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  function validCreate(): CreateGradeLockSettingDto {
    const dto = new CreateGradeLockSettingDto();
    dto.name = 'Finals';
    dto.lockType = 'hard';
    dto.allowOverride = true;
    return dto;
  }

  it('rejects zone-less lock_deadline, accepts Z', async () => {
    const zoneless = validCreate();
    zoneless.lock_deadline = '2026-10-06T17:00';
    expect(await errorsFor(zoneless)).not.toHaveLength(0);

    const zoned = validCreate();
    zoned.lock_deadline = '2026-10-06T09:00:00.000Z';
    expect(await errorsFor(zoned)).toHaveLength(0);
  });

  it('accepts lock_deadline:null as clear on update', async () => {
    const dto = new UpdateGradeLockSettingDto();
    dto.lock_deadline = null;
    expect(await errorsFor(dto)).toHaveLength(0);
  });

  it('rejects zone-less newDeadline on grant-unlock', async () => {
    const dto = new GrantUnlockDto();
    dto.reason = 'appeal upheld';
    dto.newDeadline = '2026-10-06T17:00';
    expect(await errorsFor(dto)).not.toHaveLength(0);

    dto.newDeadline = '2026-10-06T17:00:00+08:00';
    expect(await errorsFor(dto)).toHaveLength(0);
  });
});

describe('GradeLockAutoService relative deadline (calendar math)', () => {
  const auditLog = {
    logAdminAction: jest.fn().mockResolvedValue(undefined),
  };

  function repoWithLocks(
    locks: Array<{
      class_id: string;
      endDate: Date;
      deadlineDays: number | null;
    }>,
  ) {
    return {
      findExpiredUnlockedLocks: jest.fn().mockResolvedValue([]),
      findUnlockedLocksWithSchoolYear: jest.fn().mockResolvedValue(
        locks.map((l) => ({
          class_id: l.class_id,
          class: { schoolYear: { end_date: l.endDate } },
          setting: { deadlineDays: l.deadlineDays, lock_deadline: null },
        })),
      ),
      setLocked: jest.fn().mockResolvedValue({}),
      lockGradingScaleForClass: jest.fn().mockResolvedValue(undefined),
      createEvent: jest.fn().mockResolvedValue({}),
    };
  }

  /** Legacy Manila-midnight row: 16:00Z the previous day. */
  function legacyRowFor(endDay: string): Date {
    return new Date(calendarDateToUtc(endDay).getTime() - 8 * 3_600_000);
  }

  it('locks when today reaches the deadline day from a legacy 16:00Z row', async () => {
    const today = todayInZone();
    const repo = repoWithLocks([
      { class_id: 'c1', endDate: legacyRowFor(today), deadlineDays: 0 },
    ]);
    const service = new GradeLockAutoService(repo as any, auditLog as any);

    expect(calendarDateOf(legacyRowFor(today))).toBe(today);
    const result = await service.autoLockExpiredClasses('org-1');

    expect(result.lockedCount).toBe(1);
    expect(repo.setLocked).toHaveBeenCalledWith('c1', 'system');
  });

  it('treats UTC-midnight and legacy rows identically', async () => {
    const today = todayInZone();
    const repo = repoWithLocks([
      { class_id: 'c1', endDate: calendarDateToUtc(today), deadlineDays: 0 },
      { class_id: 'c2', endDate: legacyRowFor(today), deadlineDays: 0 },
    ]);
    const service = new GradeLockAutoService(repo as any, auditLog as any);

    const result = await service.autoLockExpiredClasses('org-1');
    expect(result.lockedCount).toBe(2);
  });

  it('does not lock before the deadline day, even with deadlineDays > 0', async () => {
    const today = todayInZone();
    const endDay = addDaysToCalendarDate(today, 8);
    const repo = repoWithLocks([
      { class_id: 'c1', endDate: legacyRowFor(endDay), deadlineDays: 7 },
    ]);
    const service = new GradeLockAutoService(repo as any, auditLog as any);

    const result = await service.autoLockExpiredClasses('org-1');
    expect(result.lockedCount).toBe(0);
    expect(repo.setLocked).not.toHaveBeenCalled();
  });

  it('locks on the exact deadline day (deadlineDays offset)', async () => {
    const today = todayInZone();
    const endDay = addDaysToCalendarDate(today, 7);
    const repo = repoWithLocks([
      { class_id: 'c1', endDate: calendarDateToUtc(endDay), deadlineDays: 7 },
    ]);
    const service = new GradeLockAutoService(repo as any, auditLog as any);

    const result = await service.autoLockExpiredClasses('org-1');
    expect(result.lockedCount).toBe(1);
  });

  it('skips locks without a school year end or deadlineDays', async () => {
    const repo = {
      findExpiredUnlockedLocks: jest.fn().mockResolvedValue([]),
      findUnlockedLocksWithSchoolYear: jest.fn().mockResolvedValue([
        {
          class_id: 'c1',
          class: { schoolYear: null },
          setting: { deadlineDays: 3, lock_deadline: null },
        },
        {
          class_id: 'c2',
          class: {
            schoolYear: { end_date: calendarDateToUtc(todayInZone()) },
          },
          setting: { deadlineDays: null, lock_deadline: null },
        },
      ]),
      setLocked: jest.fn(),
      lockGradingScaleForClass: jest.fn().mockResolvedValue(undefined),
      createEvent: jest.fn().mockResolvedValue({}),
    };
    const service = new GradeLockAutoService(repo as any, auditLog as any);

    const result = await service.autoLockExpiredClasses('org-1');
    expect(result.lockedCount).toBe(0);
    expect(repo.setLocked).not.toHaveBeenCalled();
  });
});
