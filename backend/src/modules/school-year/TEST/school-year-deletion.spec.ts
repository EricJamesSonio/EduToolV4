import { NotFoundException } from '@nestjs/common';
import { SchoolYearService } from '../school-year.service';

describe('SchoolYearService safe delete', () => {
  const orgId = 'org-1';
  const actorId = 'actor-1';
  let service: SchoolYearService;
  let repo: {
    findById: jest.Mock;
    getBlockerCounts: jest.Mock;
    getCascadeCounts: jest.Mock;
    deleteYearLeftovers: jest.Mock;
  };
  let programService: { deleteProgramCascade: jest.Mock };
  let tx: {
    schoolYear: { findFirst: jest.Mock };
    program: { findMany: jest.Mock };
  };
  let db: { $transaction: jest.Mock };
  let audit: { logAdminAction: jest.Mock };

  const cleanBlockers = { enrollments: 0, applications: 0, classes: 0 };
  const emptyCascade = {
    departments: 0,
    levels: 0,
    sections: 0,
    subjects: 0,
    semesters: 0,
    classes: 0,
  };

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      getBlockerCounts: jest.fn(),
      getCascadeCounts: jest.fn(),
      deleteYearLeftovers: jest.fn(),
    };
    programService = { deleteProgramCascade: jest.fn() };
    tx = {
      schoolYear: { findFirst: jest.fn() },
      program: { findMany: jest.fn().mockResolvedValue([]) },
    };
    db = { $transaction: jest.fn((fn: (txArg: unknown) => unknown) => fn(tx)) };
    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    service = new SchoolYearService(
      repo as any,
      {} as any,
      {} as any,
      {} as any,
      audit as any,
      {} as any,
      {} as any,
      {} as any,
      programService as any,
      db as any,
    );
    jest.clearAllMocks();
  });

  describe('deletionCheck', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.deletionCheck('nope', orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('blocks active years (end instead of delete)', async () => {
      repo.findById.mockResolvedValue({ id: 'sy-1', name: 'SY', status: 'active' });
      repo.getBlockerCounts.mockResolvedValue(cleanBlockers);
      repo.getCascadeCounts.mockResolvedValue(emptyCascade);

      const report = await service.deletionCheck('sy-1', orgId);

      expect(report.canDelete).toBe(false);
      expect(report.blockers).toEqual([
        { key: 'status', label: 'active status (end the year instead)', count: 1 },
      ]);
    });

    it('blocks when any student is enrolled', async () => {
      repo.findById.mockResolvedValue({ id: 'sy-1', name: 'SY', status: 'pending' });
      repo.getBlockerCounts.mockResolvedValue({ ...cleanBlockers, enrollments: 5 });
      repo.getCascadeCounts.mockResolvedValue(emptyCascade);

      const report = await service.deletionCheck('sy-1', orgId);

      expect(report.canDelete).toBe(false);
      expect(report.blockers).toEqual([
        { key: 'enrollments', label: 'enrolled students', count: 5 },
      ]);
    });

    it('lists departments and curriculum removed when clean', async () => {
      repo.findById.mockResolvedValue({ id: 'sy-1', name: 'SY', status: 'pending' });
      repo.getBlockerCounts.mockResolvedValue(cleanBlockers);
      repo.getCascadeCounts.mockResolvedValue({
        departments: 2,
        levels: 6,
        sections: 14,
        subjects: 40,
        semesters: 4,
        classes: 0,
      });

      const report = await service.deletionCheck('sy-1', orgId);

      expect(report.canDelete).toBe(true);
      expect(report.willDelete).toEqual([
        { key: 'departments', label: 'departments', count: 2 },
        { key: 'levels', label: 'levels', count: 6 },
        { key: 'sections', label: 'sections', count: 14 },
        { key: 'subjects', label: 'subjects', count: 40 },
        { key: 'semesters', label: 'semesters', count: 4 },
      ]);
    });
  });

  describe('remove', () => {
    it('throws NotFound when missing inside the transaction', async () => {
      tx.schoolYear.findFirst.mockResolvedValue(null);
      await expect(
        service.remove('nope', orgId, actorId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(programService.deleteProgramCascade).not.toHaveBeenCalled();
    });

    it('refuses active years without touching departments', async () => {
      tx.schoolYear.findFirst.mockResolvedValue({
        id: 'sy-1',
        name: 'SY',
        status: 'active',
      });
      await expect(
        service.remove('sy-1', orgId, actorId),
      ).rejects.toThrow(/end it instead/);
      expect(programService.deleteProgramCascade).not.toHaveBeenCalled();
      expect(repo.deleteYearLeftovers).not.toHaveBeenCalled();
    });

    it('re-checks inside the transaction and blocks on late enrollments', async () => {
      tx.schoolYear.findFirst.mockResolvedValue({
        id: 'sy-1',
        name: 'SY',
        status: 'pending',
      });
      repo.getBlockerCounts.mockResolvedValue({ ...cleanBlockers, classes: 1 });

      await expect(
        service.remove('sy-1', orgId, actorId),
      ).rejects.toThrow(/classes/);
      expect(programService.deleteProgramCascade).not.toHaveBeenCalled();
      expect(audit.logAdminAction).not.toHaveBeenCalled();
    });

    it('cascades every department through the shared program logic, then leftovers, and audits', async () => {
      tx.schoolYear.findFirst.mockResolvedValue({
        id: 'sy-1',
        name: 'SY',
        status: 'pending',
      });
      tx.program.findMany.mockResolvedValue([{ id: 'prog-1' }, { id: 'prog-2' }]);
      repo.getBlockerCounts.mockResolvedValue(cleanBlockers);

      const result = await service.remove('sy-1', orgId, actorId);

      expect(result).toEqual({ id: 'sy-1', deleted: true });
      expect(programService.deleteProgramCascade).toHaveBeenCalledTimes(2);
      expect(programService.deleteProgramCascade).toHaveBeenNthCalledWith(
        1,
        tx,
        orgId,
        'prog-1',
      );
      expect(repo.deleteYearLeftovers).toHaveBeenCalledWith(tx, orgId, 'sy-1');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'school_year_deleted' }),
      );
    });
  });
});
