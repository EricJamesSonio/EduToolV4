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
      delete: jest.fn(),
      hasLevels: jest.fn(),
      hasCourses: jest.fn(),
      hasStrands: jest.fn(),
    };
    db = {
      programSemesterAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
      semester: { findMany: jest.fn() },
      program: { findMany: jest.fn() },
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
    it('findById throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findById returns program', async () => {
      repo.findById.mockResolvedValue({ id: 'prog-1', name: 'A' });
      expect(await service.findById('prog-1', orgId)).toEqual({ id: 'prog-1', name: 'A' });
    });
    it('findAll delegates', async () => {
      repo.findAll.mockResolvedValue([{ id: '1' }]);
      expect(await service.findAll(orgId, 'sy-1')).toEqual([{ id: '1' }]);
    });
    it('remove throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('nope', orgId, actorId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('remove throws Conflict when has levels', async () => {
      repo.findById.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.hasLevels.mockResolvedValue(true);
      repo.hasCourses.mockResolvedValue(false);
      repo.hasStrands.mockResolvedValue(false);
      await expect(service.remove('prog-1', orgId, actorId)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.delete).not.toHaveBeenCalled();
    });
    it('remove throws with combined blockers', async () => {
      repo.findById.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.hasLevels.mockResolvedValue(true);
      repo.hasCourses.mockResolvedValue(true);
      repo.hasStrands.mockResolvedValue(true);
      await expect(service.remove('prog-1', orgId, actorId)).rejects.toThrow(/levels.*courses.*strands/);
    });
    it('remove succeeds and audits', async () => {
      repo.findById.mockResolvedValue({ id: 'prog-1', name: 'A' });
      repo.hasLevels.mockResolvedValue(false);
      repo.hasCourses.mockResolvedValue(false);
      repo.hasStrands.mockResolvedValue(false);
      repo.delete.mockResolvedValue({});
      await service.remove('prog-1', orgId, actorId);
      expect(repo.delete).toHaveBeenCalledWith('prog-1');
      expect(audit.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'program_deleted' }));
    });
  });

  describe('getSemesters', () => {
    it('returns [] when no assignment', async () => {
      db.programSemesterAssignment.findFirst.mockResolvedValue(null);
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
      db.programSemesterAssignment.findMany.mockResolvedValue([]);
      expect(await service.getSemestersGroupedByProgram(orgId, 'sy-1')).toEqual([]);
    });
    it('maps assignments to semester rows sorted by date and program name', async () => {
      const date1 = new Date('2024-06-01');
      const date2 = new Date('2024-11-01');
      db.programSemesterAssignment.findMany.mockResolvedValue([
        { program: { id: 'prog-1', name: 'B Program' }, template: { semesters: [{ name: '1st Semester' }] } },
        { program: { id: 'prog-2', name: 'A Program' }, template: { semesters: [{ name: '1st Semester' }] } },
      ]);
      db.semester.findMany.mockResolvedValue([{ id: 'sem-1', name: '1st Semester', start_date: date1, end_date: date2 }]);
      const res = await service.getSemestersGroupedByProgram(orgId, 'sy-1');
      expect(res).toHaveLength(2);
      // Sorted by program name when dates equal
      expect(res[0].programName).toBe('A Program');
      expect(res[1].programName).toBe('B Program');
    });
    it('skips assignments with no matching semester row', async () => {
      db.programSemesterAssignment.findMany.mockResolvedValue([
        { program: { id: 'prog-1', name: 'P' }, template: { semesters: [{ name: 'Missing Sem' }] } },
      ]);
      db.semester.findMany.mockResolvedValue([]);
      expect(await service.getSemestersGroupedByProgram(orgId, 'sy-1')).toEqual([]);
    });
  });
});
