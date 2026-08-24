import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { GradingScaleService } from '../grading-scale.service';

describe('GradingScaleService', () => {
  let service: GradingScaleService;
  let scaleRepo: any;
  let assignRepo: any;
  let db: any;
  const orgId = 'org-1';
  const scaleId = 'scale-1';

  const validRanges: any = [
    { gradeValue: 'A', minPercent: 0, maxPercent: 74, remark: 'Fail', isPassing: false },
    { gradeValue: 'B', minPercent: 75, maxPercent: 100, remark: 'Pass', isPassing: true },
  ];

  beforeEach(() => {
    scaleRepo = {
      findByName: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      lock: jest.fn(),
      unlock: jest.fn(),
      delete: jest.fn(),
      isUsedInGrades: jest.fn(),
      findByClassId: jest.fn(),
    };
    assignRepo = {
      findByScaleId: jest.fn(),
      findByProgramAndYear: jest.fn(),
      upsert: jest.fn(),
      findBySchoolYear: jest.fn(),
      remove: jest.fn(),
    };
    db = { program: { findFirst: jest.fn() } };
    service = new GradingScaleService(scaleRepo, assignRepo, db);
    jest.clearAllMocks();
  });

  describe('validateRanges (via create)', () => {
    it('throws when empty', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: [] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when min >= max', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: [{ gradeValue: 'A', minPercent: 80, maxPercent: 70, isPassing: true }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when not starting at 0', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: [{ gradeValue: 'A', minPercent: 10, maxPercent: 100, isPassing: true }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when not ending at 100', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: [{ gradeValue: 'A', minPercent: 0, maxPercent: 90, isPassing: true }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when overlapping', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: [{ gradeValue: 'A', minPercent: 0, maxPercent: 50, isPassing: false }, { gradeValue: 'B', minPercent: 40, maxPercent: 100, isPassing: true }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when gap', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: [{ gradeValue: 'A', minPercent: 0, maxPercent: 50, isPassing: false }, { gradeValue: 'B', minPercent: 52, maxPercent: 100, isPassing: true }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when no passing range', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: [{ gradeValue: 'A', minPercent: 0, maxPercent: 100, isPassing: false }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('create', () => {
    it('throws Conflict when name exists', async () => {
      scaleRepo.findByName.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, { name: 'S', programType: 'college', ranges: validRanges } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates and maps', async () => {
      scaleRepo.findByName.mockResolvedValue(null);
      scaleRepo.create.mockResolvedValue({ id: scaleId, org_id: orgId, name: 'S', program_type: 'college', ranges: validRanges, is_locked: false, locked_at: null, created_at: new Date(), updated_at: new Date() });
      const res = await service.create(orgId, { name: 'S', programType: 'college', ranges: validRanges } as any);
      expect(scaleRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'S' }));
      expect(res.name).toBe('S');
      expect(res.isLocked).toBe(false);
    });
  });

  describe('update / lock / unlock / delete', () => {
    it('update throws NotFound when missing', async () => {
      scaleRepo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('update throws when locked', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, is_locked: true });
      await expect(service.update(scaleId, orgId, {} as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('update validates ranges when provided', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, is_locked: false });
      await expect(service.update(scaleId, orgId, { ranges: [] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('update succeeds', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, is_locked: false });
      scaleRepo.update.mockResolvedValue({ id: scaleId, org_id: orgId, name: 'New', program_type: 'college', ranges: validRanges, is_locked: false, locked_at: null, created_at: new Date(), updated_at: new Date() });
      const res = await service.update(scaleId, orgId, { name: 'New' } as any);
      expect(res.name).toBe('New');
    });
    it('lock returns already locked without calling repo.lock', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, org_id: orgId, name: 'S', program_type: 'college', ranges: validRanges, is_locked: true, locked_at: new Date(), created_at: new Date(), updated_at: new Date() });
      const res = await service.lock(scaleId, orgId);
      expect(scaleRepo.lock).not.toHaveBeenCalled();
      expect(res.isLocked).toBe(true);
    });
    it('lock succeeds', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, is_locked: false });
      scaleRepo.lock.mockResolvedValue({ id: scaleId, org_id: orgId, name: 'S', program_type: 'college', ranges: validRanges, is_locked: true, locked_at: new Date(), created_at: new Date(), updated_at: new Date() });
      const res = await service.lock(scaleId, orgId);
      expect(repoCall(scaleRepo.lock)).toBe(true);
      expect(res.isLocked).toBe(true);
    });
    it('unlock throws NotFound', async () => {
      scaleRepo.findById.mockResolvedValue(null);
      await expect(service.unlock('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('delete throws when locked', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, is_locked: true });
      await expect(service.delete(scaleId, orgId)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('delete throws when used in grades', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, is_locked: false });
      assignRepo.findByScaleId.mockResolvedValue([{ program_id: 'prog-1', school_year_id: 'sy-1' }]);
      scaleRepo.isUsedInGrades.mockResolvedValue(true);
      await expect(service.delete(scaleId, orgId)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('delete succeeds when not used', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, is_locked: false });
      assignRepo.findByScaleId.mockResolvedValue([]);
      scaleRepo.delete.mockResolvedValue({});
      await service.delete(scaleId, orgId);
      expect(scaleRepo.delete).toHaveBeenCalledWith(scaleId);
    });
  });

  describe('resolveGrade / assignToProgram', () => {
    it('resolveGrade returns null when no assignment', async () => {
      assignRepo.findByProgramAndYear.mockResolvedValue(null);
      expect(await service.resolveGrade(orgId, 'prog-1', 'sy-1', 80)).toBeNull();
    });
    it('resolveGrade matches range', async () => {
      assignRepo.findByProgramAndYear.mockResolvedValue({ grading_scale: { ranges: validRanges } });
      const res = await service.resolveGrade(orgId, 'prog-1', 'sy-1', 80);
      expect(res?.gradeValue).toBe('B');
      expect(res?.isPassing).toBe(true);
    });
    it('resolveGrade returns null when no range matches', async () => {
      assignRepo.findByProgramAndYear.mockResolvedValue({ grading_scale: { ranges: [{ gradeValue: 'A', minPercent: 0, maxPercent: 50, remark: 'Fail', isPassing: false }] } });
      expect(await service.resolveGrade(orgId, 'prog-1', 'sy-1', 80)).toBeNull();
    });
    it('assignToProgram throws NotFound when scale missing', async () => {
      scaleRepo.findById.mockResolvedValue(null);
      await expect(service.assignToProgram(orgId, 'prog-1', 'bad', 'sy-1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('assignToProgram throws NotFound when program missing', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, program_type: 'college' });
      db.program.findFirst.mockResolvedValue(null);
      await expect(service.assignToProgram(orgId, 'prog-1', scaleId, 'sy-1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('assignToProgram throws when type mismatch', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, program_type: 'college' });
      db.program.findFirst.mockResolvedValue({ type: 'shs' });
      await expect(service.assignToProgram(orgId, 'prog-1', scaleId, 'sy-1')).rejects.toBeInstanceOf(BadRequestException);
    });
    it('assignToProgram succeeds and upserts', async () => {
      scaleRepo.findById.mockResolvedValue({ id: scaleId, program_type: 'college' });
      db.program.findFirst.mockResolvedValue({ type: 'college' });
      assignRepo.upsert.mockResolvedValue({});
      const res = await service.assignToProgram(orgId, 'prog-1', scaleId, 'sy-1');
      expect(assignRepo.upsert).toHaveBeenCalledWith(orgId, scaleId, 'prog-1', 'sy-1');
      expect(res.id).toBe(scaleId);
    });
  });

  function repoCall(mockFn: any) {
    return mockFn.mock.calls.length > 0;
  }
});
