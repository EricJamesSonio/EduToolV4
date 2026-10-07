import { NotFoundException, ConflictException } from '@nestjs/common';
import { SubjectService } from '../subject.service';

describe('SubjectService safe delete / archive / restore', () => {
  const orgId = 'org-1';
  const actorId = 'actor-1';
  let service: SubjectService;
  let repo: {
    findById: jest.Mock;
    getClassCount: jest.Mock;
    getCleanupCounts: jest.Mock;
    softDelete: jest.Mock;
    hardDeleteCascade: jest.Mock;
    findArchivedById: jest.Mock;
    findDuplicateByName: jest.Mock;
    restoreSubject: jest.Mock;
  };
  let tx: { subject: { findFirst: jest.Mock } };
  let db: { $transaction: jest.Mock };
  let audit: { logAdminAction: jest.Mock };
  let cfg: { getByOrg: jest.Mock };
  let educatorSubjects: {
    keyPartsFor: jest.Mock;
    pruneOrphanedSubjectKey: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      getClassCount: jest.fn(),
      getCleanupCounts: jest.fn(),
      softDelete: jest.fn(),
      hardDeleteCascade: jest.fn(),
      findArchivedById: jest.fn(),
      findDuplicateByName: jest.fn(),
      restoreSubject: jest.fn(),
    };
    tx = { subject: { findFirst: jest.fn() } };
    db = { $transaction: jest.fn((fn: (txArg: unknown) => unknown) => fn(tx)) };
    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    cfg = { getByOrg: jest.fn().mockResolvedValue({ slotDuration: 30 }) };
    educatorSubjects = {
      keyPartsFor: jest.fn().mockResolvedValue(new Map()),
      pruneOrphanedSubjectKey: jest.fn().mockResolvedValue(undefined),
    };
    service = new SubjectService(repo as any, db as any, cfg as any, audit as any, educatorSubjects as any);
    jest.clearAllMocks();
  });

  describe('deletionCheck', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.deletionCheck('nope', orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns archive outcome when classes exist (soft-deleted included)', async () => {
      repo.findById.mockResolvedValue({ id: 'sub-1', name: 'Math' });
      repo.getClassCount.mockResolvedValue(3);

      const report = await service.deletionCheck('sub-1', orgId);

      expect(report).toEqual({
        canDelete: true,
        outcome: 'archive',
        blockers: [],
        willDelete: [
          { key: 'classes', label: 'classes using this subject', count: 3 },
        ],
      });
      expect(repo.getCleanupCounts).not.toHaveBeenCalled();
    });

    it('returns delete outcome with cleanup list when class-free', async () => {
      repo.findById.mockResolvedValue({ id: 'sub-1', name: 'Math' });
      repo.getClassCount.mockResolvedValue(0);
      repo.getCleanupCounts.mockResolvedValue({
        sharings: 2,
        prerequisites: 0,
        teachableLinks: 1,
        overrides: 0,
      });

      const report = await service.deletionCheck('sub-1', orgId);

      expect(report.canDelete).toBe(true);
      expect(report.outcome).toBe('delete');
      expect(report.blockers).toEqual([]);
      expect(report.willDelete).toEqual([
        { key: 'sharings', label: 'subject sharings', count: 2 },
        { key: 'teachable-links', label: 'educator teachable links', count: 1 },
      ]);
    });
  });

  describe('remove', () => {
    it('throws NotFound when missing inside the transaction', async () => {
      tx.subject.findFirst.mockResolvedValue(null);
      await expect(
        service.remove('nope', orgId, actorId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.hardDeleteCascade).not.toHaveBeenCalled();
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('archives (never hard-deletes) when classes exist, and audits', async () => {
      tx.subject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Math',
        deleted_at: null,
      });
      repo.getClassCount.mockResolvedValue(1);

      const result = await service.remove('sub-1', orgId, actorId);

      expect(result).toEqual({ id: 'sub-1', outcome: 'archived' });
      expect(repo.softDelete).toHaveBeenCalledWith(tx, 'sub-1');
      expect(repo.hardDeleteCascade).not.toHaveBeenCalled();
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'subject_archived' }),
      );
    });

    it('hard-deletes class-free subjects with children-first cleanup, and audits', async () => {
      tx.subject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Math',
        deleted_at: null,
      });
      repo.getClassCount.mockResolvedValue(0);

      const result = await service.remove('sub-1', orgId, actorId);

      expect(result).toEqual({ id: 'sub-1', outcome: 'deleted' });
      expect(repo.hardDeleteCascade).toHaveBeenCalledWith(tx, orgId, 'sub-1');
      expect(repo.softDelete).not.toHaveBeenCalled();
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'subject_deleted' }),
      );
    });

    it('prunes the orphaned global teachable key on hard delete', async () => {
      tx.subject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Math',
        deleted_at: null,
      });
      repo.getClassCount.mockResolvedValue(0);
      const parts = new Map([['sub-1', { name: 'Math' }]]);
      educatorSubjects.keyPartsFor.mockResolvedValue(parts);

      await service.remove('sub-1', orgId, actorId);

      expect(educatorSubjects.keyPartsFor).toHaveBeenCalledWith(
        orgId,
        ['sub-1'],
        tx,
      );
      expect(repo.hardDeleteCascade).toHaveBeenCalledWith(tx, orgId, 'sub-1');
      expect(educatorSubjects.pruneOrphanedSubjectKey).toHaveBeenCalledWith(
        tx,
        orgId,
        { name: 'Math' },
      );
    });

    it('never prunes on archive, so restore keeps working', async () => {
      tx.subject.findFirst.mockResolvedValue({
        id: 'sub-1',
        name: 'Math',
        deleted_at: null,
      });
      repo.getClassCount.mockResolvedValue(1);

      await service.remove('sub-1', orgId, actorId);

      expect(educatorSubjects.pruneOrphanedSubjectKey).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('throws NotFound when nothing is archived', async () => {
      repo.findArchivedById.mockResolvedValue(null);
      await expect(
        service.restore('sub-1', orgId, actorId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when an active subject took the name', async () => {
      repo.findArchivedById.mockResolvedValue({
        id: 'sub-1',
        name: 'Math',
        program_id: 'prog-1',
        level_id: 'lvl-1',
        subject_type: 'major',
      });
      repo.findDuplicateByName.mockResolvedValue({ id: 'sub-2' });

      await expect(
        service.restore('sub-1', orgId, actorId),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.restoreSubject).not.toHaveBeenCalled();
    });

    it('restores and audits when the name is free', async () => {
      repo.findArchivedById.mockResolvedValue({
        id: 'sub-1',
        name: 'Math',
        program_id: 'prog-1',
        level_id: 'lvl-1',
        subject_type: 'major',
      });
      repo.findDuplicateByName.mockResolvedValue(null);
      repo.restoreSubject.mockResolvedValue({ id: 'sub-1' });
      repo.findById.mockResolvedValue({
        id: 'sub-1',
        org_id: orgId,
        name: 'Math',
        subject_type: 'major',
        program_id: 'prog-1',
        level_id: 'lvl-1',
        course_id: null,
        strand_id: null,
        is_locked: false,
        year_level: null,
        term_label: null,
        sessions_per_week: null,
        session_minutes: null,
        session_durations: [],
        prerequisites: [],
        prereqFor: [],
        sharings: [],
        created_at: null,
        updated_at: null,
      });

      const result = await service.restore('sub-1', orgId, actorId);

      expect(repo.restoreSubject).toHaveBeenCalledWith('sub-1');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'subject_restored' }),
      );
      expect(result.id).toBe('sub-1');
    });
  });
});
