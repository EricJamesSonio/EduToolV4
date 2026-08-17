import { GradeLockOperationsService } from '../grade-lock-operations.service';
import { GradeLockAutoService } from '../grade-lock-auto.service';
import { GradeLockRequestsService } from '../grade-lock-requests.service';
import { GradeLockRepository } from '../grade-lock.repository';

describe('Grade-lock chain — proof tests (Lane 1 item 3)', () => {
  const auditLog = {
    logActivityEvent: jest.fn().mockResolvedValue(undefined),
    logAdminAction: jest.fn().mockResolvedValue(undefined),
  };

  describe('(a) auto-lock never locks the grading scale (manual lock does)', () => {
    it('PROOF: auto lock passes ONLY setLocked, never lockGradingScaleForClass', async () => {
      const repo = {
        findExpiredUnlockedLocks: jest.fn().mockResolvedValue([
          {
            class_id: 'c1',
            setting: { lock_deadline: new Date(Date.now() - 60_000) },
          },
        ]),
        findUnlockedLocksWithSchoolYear: jest.fn().mockResolvedValue([]),
        setLocked: jest.fn().mockResolvedValue({ class_id: 'c1', is_locked: true }),
        createEvent: jest.fn().mockResolvedValue({}),
        lockGradingScaleForClass: jest.fn().mockResolvedValue(undefined),
      };

      const auto = new GradeLockAutoService(repo as any, auditLog as any);
      await auto.autoLockExpiredClasses('org-1');

      // Correct behavior: locking a class must also lock the grading scale it
      // was computed with, exactly like the manual lockClass path does
      // (grade-lock-operations.service.ts:78-79).
      expect(repo.lockGradingScaleForClass).toHaveBeenCalled();
    });

    it('sanity: manual lockClass DOES call lockGradingScaleForClass', async () => {
      const validator = { validateReadiness: jest.fn().mockResolvedValue({ ready: true, issues: [] }) };
      const repo = {
        findClassById: jest.fn().mockResolvedValue({ id: 'c1', educator_id: 'e1', deleted_at: null }),
        findLockByClassId: jest.fn().mockResolvedValue({
          is_locked: false,
          setting: { lock_deadline: new Date(Date.now() + 60_000), deadlineDays: null },
        }),
        resolveDeadline: undefined,
        setLocked: jest.fn().mockResolvedValue({ class_id: 'c1' }),
        lockGradingScaleForClass: jest.fn().mockResolvedValue(undefined),
        createEvent: jest.fn().mockResolvedValue({}),
      };

      const ops = new GradeLockOperationsService(repo as any, validator as any, auditLog as any);
      await ops.lockClass('c1', 'e1', 'org-1', {});

      expect(repo.lockGradingScaleForClass).toHaveBeenCalledWith('c1', 'org-1');
    });
  });

  describe('(b) scale resolved via level.school_year_id vs class.school_year_id', () => {
    it('PROOF: lockGradingScaleForClass keys the assignment off the LEVEL school year, not the class', async () => {
      let capturedWhere: any = null;

      const fakeDb = {
        class: {
          // Class lives in school year 2027...
          findUnique: jest.fn().mockResolvedValue({
            id: 'c1',
            school_year_id: 'sy-2027',
            subject: { level_id: 'lv-1' },
          }),
        },
        level: {
          // ...but its subject's LEVEL row is pinned to school year 2026.
          findUnique: jest.fn().mockResolvedValue({
            id: 'lv-1',
            program_id: 'p-1',
            school_year_id: 'sy-2026',
          }),
        },
        gradingScaleAssignment: {
          findFirst: jest.fn().mockImplementation(async (args: any) => {
            capturedWhere = args.where;
            return { grading_scale_id: 'gs-1' };
          }),
        },
        gradingScale: {
          update: jest.fn().mockResolvedValue({ id: 'gs-1' }),
        },
      };

      const repo = new GradeLockRepository(fakeDb as any);
      await repo.lockGradingScaleForClass('c1', 'org-1');

      // Correct behavior: grade computation (grade-educator.service.ts:405)
      // resolves the scale with cls.school_year_id = sy-2027, so the lock must
      // target the same scale — the assignment lookup must use sy-2027.
      expect(capturedWhere).toEqual(
        expect.objectContaining({ program_id: 'p-1', school_year_id: 'sy-2027' }),
      );
    });
  });

  describe('(c) grantUnlock writes metadata.new_deadline but never updates the setting', () => {
    it('PROOF: granting with a newDeadline does NOT persist it onto the GradeLockSetting', async () => {
      // Setting's lock_deadline is already in the past -> the hourly sweep will
      // select this lock again AFTER it has been unlocked by the grant.
      const setting = { lock_deadline: new Date(Date.now() - 60_000), deadlineDays: null };

      const repo = {
        findClassById: jest.fn().mockResolvedValue({ id: 'c1', educator_id: 'e1' }),
        findLockByClassId: jest.fn().mockResolvedValue({ is_locked: true, setting }),
        setUnlocked: jest.fn().mockResolvedValue({ class_id: 'c1', is_locked: false, setting }),
        createEvent: jest.fn().mockResolvedValue({}),
        updateSetting: jest.fn().mockResolvedValue(undefined),
      };

      const requests = new GradeLockRequestsService(repo as any, auditLog as any);
      const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      await requests.grantUnlock('c1', 'u1', 'org-1', { reason: 'allow regrade', newDeadline: future });

      // Correct behavior: a granted newDeadline must be written to the setting
      // so the auto-lock sweep does not re-lock the class within the hour.
      expect(repo.updateSetting).toHaveBeenCalledWith('c1', expect.objectContaining({ lock_deadline: future }));
    });
  });

  describe('(d) a resolved grant/deny still blocks future requests (no resolved marker)', () => {
    it('PROOF: requestUnlock throws Conflict even though the earlier request was already GRANTED', async () => {
      const repo = {
        findClassById: jest.fn().mockResolvedValue({ id: 'c1', educator_id: 'e1' }),
        findLockByClassId: jest.fn().mockResolvedValue({
          is_locked: true,
          setting: { lock_deadline: new Date(Date.now() + 60_000) },
        }),
        findEventsByClassId: jest.fn().mockResolvedValue([
          { type: 'unlock_request', created_at: new Date(Date.now() - 3_600_000) },
          { type: 'grant_unlock', created_at: new Date(Date.now() - 3_500_000) },
        ]),
        createEvent: jest.fn().mockResolvedValue({}),
      };

      const requests = new GradeLockRequestsService(repo as any, auditLog as any);

      // Correct behavior: the earlier request was RESOLVED by a grant, so a
      // fresh unlock request for the same class must be permitted.
      await expect(
        requests.requestUnlock('c1', 'e1', 'org-1', { reason: 'regrade again' }),
      ).resolves.toEqual({ success: true });
    });
  });
});