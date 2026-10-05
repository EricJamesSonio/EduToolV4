import { NotFoundException } from '@nestjs/common';
import { ProgramService } from '../program.service';
import { ProgramRepository } from '../program.repository';

describe('ProgramService safe delete', () => {
  const orgId = 'org-1';
  const actorId = 'actor-1';
  let service: ProgramService;
  let repo: {
    findById: jest.Mock;
    getBlockerCounts: jest.Mock;
    getCascadeCounts: jest.Mock;
    deleteCascade: jest.Mock;
  };
  let tx: { program: { findFirst: jest.Mock } };
  let db: { $transaction: jest.Mock };
  let audit: { logAdminAction: jest.Mock };

  const cleanBlockers = {
    enrollments: 0,
    applications: 0,
    classes: 0,
    overrides: 0,
    sharedSubjects: 0,
  };
  const emptyCascade = {
    subjects: 0,
    levels: 0,
    courses: 0,
    strands: 0,
    semesters: 0,
    sections: 0,
  };

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      getBlockerCounts: jest.fn(),
      getCascadeCounts: jest.fn(),
      deleteCascade: jest.fn(),
    };
    tx = { program: { findFirst: jest.fn() } };
    db = { $transaction: jest.fn((fn: (txArg: unknown) => unknown) => fn(tx)) };
    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    service = new ProgramService(repo as any, db as any, audit as any);
    jest.clearAllMocks();
  });

  describe('deletionCheck', () => {
    it('throws NotFound when the program does not belong to the org', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.deletionCheck('nope', orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('reports blocked when students/classes exist', async () => {
      repo.findById.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.getBlockerCounts.mockResolvedValue({
        ...cleanBlockers,
        enrollments: 2,
        classes: 1,
      });
      repo.getCascadeCounts.mockResolvedValue(emptyCascade);

      const report = await service.deletionCheck('prog-1', orgId);

      expect(report.canDelete).toBe(false);
      expect(report.blockers).toEqual([
        { key: 'enrollments', label: 'student enrollments', count: 2 },
        { key: 'classes', label: 'classes', count: 1 },
      ]);
      expect(report.willDelete).toEqual([]);
    });

    it('lists everything removed when clean', async () => {
      repo.findById.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.getBlockerCounts.mockResolvedValue(cleanBlockers);
      repo.getCascadeCounts.mockResolvedValue({
        subjects: 40,
        levels: 6,
        courses: 1,
        strands: 2,
        semesters: 2,
        sections: 14,
      });

      const report = await service.deletionCheck('prog-1', orgId);

      expect(report.canDelete).toBe(true);
      expect(report.blockers).toEqual([]);
      expect(report.willDelete).toEqual([
        { key: 'subjects', label: 'subjects', count: 40 },
        { key: 'levels', label: 'levels', count: 6 },
        { key: 'sections', label: 'sections', count: 14 },
        { key: 'courses', label: 'courses', count: 1 },
        { key: 'strands', label: 'strands', count: 2 },
        { key: 'semesters', label: 'semesters', count: 2 },
      ]);
    });
  });

  describe('remove', () => {
    it('throws NotFound when missing inside the transaction', async () => {
      tx.program.findFirst.mockResolvedValue(null);
      await expect(
        service.remove('nope', orgId, actorId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.deleteCascade).not.toHaveBeenCalled();
    });

    it('re-checks inside the transaction and blocks on late enrollments', async () => {
      tx.program.findFirst.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.getBlockerCounts.mockResolvedValue({
        ...cleanBlockers,
        applications: 1,
      });

      await expect(
        service.remove('prog-1', orgId, actorId),
      ).rejects.toThrow(/enrollment applications/);
      expect(repo.deleteCascade).not.toHaveBeenCalled();
      expect(audit.logAdminAction).not.toHaveBeenCalled();
    });

    it('cascades and audits when clean', async () => {
      tx.program.findFirst.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.getBlockerCounts.mockResolvedValue(cleanBlockers);
      repo.deleteCascade.mockResolvedValue(undefined);

      await service.remove('prog-1', orgId, actorId);

      expect(db.$transaction).toHaveBeenCalled();
      expect(repo.deleteCascade).toHaveBeenCalledWith(tx, orgId, 'prog-1');
      expect(audit.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'program_deleted',
          entityType: 'program',
          entityId: 'prog-1',
        }),
      );
    });
  });
});

describe('ProgramRepository.deleteCascade order', () => {
  function mockModel() {
    return {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      delete: jest.fn().mockResolvedValue({}),
    };
  }

  function orderOf(mockFn: jest.Mock): number {
    return mockFn.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER;
  }

  it('deletes children before parents (no FK errors)', async () => {
    const models = {
      subject: mockModel(),
      level: mockModel(),
      course: mockModel(),
      strand: mockModel(),
      semester: mockModel(),
      section: mockModel(),
      subjectSharing: mockModel(),
      subjectPrerequisite: mockModel(),
      educatorSubject: mockModel(),
      subjectCompletionOverride: mockModel(),
      term: mockModel(),
      programSemesterAssignment: mockModel(),
      programSemesterTermDate: mockModel(),
      gradingScaleAssignment: mockModel(),
      program: mockModel(),
    };
    models.subject.findMany.mockResolvedValue([{ id: 'sub-1' }]);
    models.level.findMany.mockResolvedValue([{ id: 'lvl-1' }]);
    models.course.findMany.mockResolvedValue([{ id: 'crs-1' }]);
    models.semester.findMany.mockResolvedValue([{ id: 'sem-1' }]);
    models.programSemesterAssignment.findFirst.mockResolvedValue({ id: 'asg-1' });

    const repository = new ProgramRepository({} as any);
    await repository.deleteCascade(models as any, 'org-1', 'prog-1');

    // Sections before levels/courses/strands; subjects before levels.
    expect(orderOf(models.section.deleteMany)).toBeLessThan(
      orderOf(models.level.deleteMany),
    );
    expect(orderOf(models.subject.deleteMany)).toBeLessThan(
      orderOf(models.level.deleteMany),
    );
    // Links/overrides/sharings/prereqs before subjects (Restrict).
    expect(orderOf(models.educatorSubject.deleteMany)).toBeLessThan(
      orderOf(models.subject.deleteMany),
    );
    expect(orderOf(models.subjectCompletionOverride.deleteMany)).toBeLessThan(
      orderOf(models.subject.deleteMany),
    );
    expect(orderOf(models.subjectSharing.deleteMany)).toBeLessThan(
      orderOf(models.subject.deleteMany),
    );
    expect(orderOf(models.subjectPrerequisite.deleteMany)).toBeLessThan(
      orderOf(models.subject.deleteMany),
    );
    // Levels before courses/strands (Restrict FKs on Level).
    expect(orderOf(models.level.deleteMany)).toBeLessThan(
      orderOf(models.course.deleteMany),
    );
    expect(orderOf(models.level.deleteMany)).toBeLessThan(
      orderOf(models.strand.deleteMany),
    );
    // Terms before semesters; term dates before the assignment.
    expect(orderOf(models.term.deleteMany)).toBeLessThan(
      orderOf(models.semester.deleteMany),
    );
    expect(orderOf(models.programSemesterTermDate.deleteMany)).toBeLessThan(
      orderOf(models.programSemesterAssignment.delete),
    );
    // The program goes last.
    const last = orderOf(models.program.delete);
    for (const model of Object.values(models)) {
      for (const fn of [model.deleteMany, model.delete]) {
        if (fn === models.program.delete) continue;
        if (fn.mock.calls.length === 0) continue;
        expect(orderOf(fn)).toBeLessThan(last);
      }
    }
  });
});
