import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProgramService } from '../program.service';

describe('ProgramService', () => {
  let service: ProgramService;
  let repo: any;
  let db: any;
  let audit: any;
  const orgId = 'org-1';
  const actorId = 'actor-1';

  beforeEach(() => {
    repo = {
      findByNameAndYear: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findAllWithStats: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      countLevelsAndSections: jest.fn().mockResolvedValue([]),
      getBlockerCounts: jest.fn(),
      getCascadeCounts: jest.fn(),
      deleteCascade: jest.fn(),
    };
    db = {
      program: { findFirst: jest.fn() },
      $transaction: jest.fn((fn: (txArg: unknown) => unknown) =>
        fn({ program: db.program }),
      ),
      programSemesterAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
      semester: { findMany: jest.fn() },
    };
    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    service = new ProgramService(repo, db, audit);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws Conflict when name exists for year', async () => {
      repo.findByNameAndYear.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, { name: 'BSIT', type: 'college', schoolYearId: 'sy-1' } as any, actorId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates and audits', async () => {
      repo.findByNameAndYear.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'prog-1', name: 'BSIT' });
      const res = await service.create(orgId, { name: 'BSIT', type: 'college', schoolYearId: 'sy-1' } as any, actorId);
      expect(repo.create).toHaveBeenCalledWith({ orgId, schoolYearId: 'sy-1', name: 'BSIT', type: 'college' });
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'program_created' }));
      expect(res.id).toBe('prog-1');
    });
  });

  describe('findById / findAll / remove', () => {
    const cleanBlockers = {
      enrollments: 0,
      applications: 0,
      classes: 0,
      overrides: 0,
      sharedSubjects: 0,
    };
    it('findById throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findById returns program', async () => {
      repo.findById.mockResolvedValue({ id: 'prog-1', name: 'A', courses: [], strands: [] });
      expect(await service.findById('prog-1', orgId)).toEqual({ id: 'prog-1', name: 'A', courses: [], strands: [] });
    });
    it('findAll delegates', async () => {
      repo.findAll.mockResolvedValue([{ id: '1' }]);
      expect(await service.findAll(orgId, 'sy-1')).toEqual([{ id: '1' }]);
    });
    it('remove throws NotFound when missing', async () => {
      db.program.findFirst.mockResolvedValue(null);
      await expect(service.remove('nope', orgId, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('remove throws Conflict when enrollments exist', async () => {
      db.program.findFirst.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.getBlockerCounts.mockResolvedValue({ ...cleanBlockers, enrollments: 1 });
      await expect(service.remove('prog-1', orgId, actorId)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.deleteCascade).not.toHaveBeenCalled();
    });
    it('remove throws with combined blockers', async () => {
      db.program.findFirst.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.getBlockerCounts.mockResolvedValue({
        ...cleanBlockers,
        enrollments: 1,
        applications: 2,
        classes: 3,
      });
      await expect(service.remove('prog-1', orgId, actorId)).rejects.toThrow(
        /student enrollments.*enrollment applications.*classes/,
      );
    });
    it('remove succeeds and audits', async () => {
      db.program.findFirst.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.getBlockerCounts.mockResolvedValue(cleanBlockers);
      repo.deleteCascade.mockResolvedValue(undefined);
      await service.remove('prog-1', orgId, actorId);
      expect(repo.deleteCascade).toHaveBeenCalled();
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'program_deleted' }));
    });
  });

  describe('getSemesters', () => {
    it('returns [] when no assignment', async () => {
      db.semester.findMany.mockResolvedValue([]);
      expect(await service.getSemesters('prog-1', 'sy-1', orgId)).toEqual([]);
    });
    it('returns mapped semesters with terms', async () => {
      db.programSemesterAssignment.findFirst.mockResolvedValue({
        template: { semesters: [{ name: '1st Semester' }, { name: '2nd Semester' }] },
      });
      db.semester.findMany.mockResolvedValue([
        { id: 'sem-1', school_year_id: 'sy-1', name: '1st Semester', start_date: new Date(), end_date: new Date(), terms: [{ id: 't-1', name: 'Term 1', order_index: 0, start_date: new Date(), end_date: new Date() }] },
      ]);
      const res = await service.getSemesters('prog-1', 'sy-1', orgId);
      expect(res[0].name).toBe('1st Semester');
      expect(res[0].terms[0].name).toBe('Term 1');
    });
  });

  describe('getSemestersGroupedByProgram', () => {
    it('returns [] when no assignments', async () => {
      db.semester.findMany.mockResolvedValue([]);
      expect(await service.getSemestersGroupedByProgram(orgId, 'sy-1')).toEqual([]);
    });
    it('maps assignments to semester rows sorted by date and program name', async () => {
      const date1 = new Date('2024-06-01');
      const date2 = new Date('2024-11-01');
      db.semester.findMany.mockResolvedValue([
        { id: 'sem-1', name: '1st Semester', start_date: date1, end_date: date2, program_id: 'prog-1', program: { id: 'prog-1', name: 'B Program' } },
        { id: 'sem-2', name: '1st Semester', start_date: date1, end_date: date2, program_id: 'prog-2', program: { id: 'prog-2', name: 'A Program' } },
      ]);
      const res = await service.getSemestersGroupedByProgram(orgId, 'sy-1');
      expect(res).toHaveLength(2);
      // Sorted by program name when dates equal
      expect(res[0].programName).toBe('A Program');
      expect(res[1].programName).toBe('B Program');
    });
    it('skips assignments with no matching semester row', async () => {
      db.semester.findMany.mockResolvedValue([]);
      expect(await service.getSemestersGroupedByProgram(orgId, 'sy-1')).toEqual([]);
    });
  });
});
