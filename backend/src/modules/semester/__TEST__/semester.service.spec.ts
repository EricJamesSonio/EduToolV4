import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SemesterService } from '../semester.service';

describe('SemesterService', () => {
  let service: SemesterService;
  let repo: any;
  const orgId = 'org-1';

  function semDto(overrides: any = {}) {
    return {
      schoolYearId: 'sy-1',
      name: '1st Semester',
      startDate: '2024-06-01',
      endDate: '2024-10-31',
      terms: [
        { name: 'Term 1', orderIndex: 0, startDate: '2024-06-01', endDate: '2024-07-15' },
        { name: 'Term 2', orderIndex: 1, startDate: '2024-07-16', endDate: '2024-08-15' },
      ],
      ...overrides,
    };
  }

  beforeEach(() => {
    repo = {
      countBySchoolYear: jest.fn(),
      findSiblingsInSchoolYear: jest.fn(),
      create: jest.fn(),
      upsertTerms: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findBySchoolYear: jest.fn(),
      update: jest.fn(),
      deleteTermsBySemester: jest.fn(),
      delete: jest.fn(),
    };
    service = new SemesterService(repo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws BadRequest when start missing/invalid', async () => {
      await expect(service.create(orgId, { ...semDto(), startDate: '' } as any)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.create(orgId, { ...semDto(), startDate: 'invalid' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws BadRequest when start >= end', async () => {
      await expect(service.create(orgId, semDto({ startDate: '2024-10-31', endDate: '2024-06-01' }) as any)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.create(orgId, semDto({ startDate: '2024-06-01', endDate: '2024-06-01' }) as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws Conflict when max 3 semesters reached', async () => {
      repo.countBySchoolYear.mockResolvedValue(3);
      await expect(service.create(orgId, semDto() as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('throws Conflict when overlapping sibling', async () => {
      repo.countBySchoolYear.mockResolvedValue(1);
      repo.findSiblingsInSchoolYear.mockResolvedValue([{ name: 'Existing', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') }]);
      await expect(service.create(orgId, semDto() as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('throws BadRequest when term dates outside semester', async () => {
      repo.countBySchoolYear.mockResolvedValue(0);
      repo.findSiblingsInSchoolYear.mockResolvedValue([]);
      await expect(service.create(orgId, semDto({ terms: [{ name: 'Term 1', orderIndex: 0, startDate: '2024-05-01', endDate: '2024-06-15' }] }) as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws Conflict when terms overlap each other', async () => {
      repo.countBySchoolYear.mockResolvedValue(0);
      repo.findSiblingsInSchoolYear.mockResolvedValue([]);
      await expect(service.create(orgId, semDto({ terms: [
        { name: 'Term 1', orderIndex: 0, startDate: '2024-06-01', endDate: '2024-07-15' },
        { name: 'Term 2', orderIndex: 1, startDate: '2024-07-10', endDate: '2024-08-15' },
      ] }) as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('creates semester and upserts terms', async () => {
      repo.countBySchoolYear.mockResolvedValue(0);
      repo.findSiblingsInSchoolYear.mockResolvedValue([]);
      repo.create.mockResolvedValue({ id: 'sem-1' });
      repo.findById.mockResolvedValue({ id: 'sem-1', name: '1st Semester' });
      const res = await service.create(orgId, semDto() as any);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: '1st Semester' }));
      expect(repo.upsertTerms).toHaveBeenCalled();
      expect(res.id).toBe('sem-1');
    });
  });

  describe('update', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws BadRequest when start >= end', async () => {
      repo.findById.mockResolvedValue({ id: 'sem-1', school_year_id: 'sy-1', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') });
      await expect(service.update('sem-1', orgId, { startDate: '2024-11-01', endDate: '2024-06-01' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws Conflict when overlapping sibling on update', async () => {
      repo.findById.mockResolvedValue({ id: 'sem-1', school_year_id: 'sy-1', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') });
      repo.findSiblingsInSchoolYear.mockResolvedValue([{ name: 'Other', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') }]);
      await expect(service.update('sem-1', orgId, { startDate: '2024-06-15', endDate: '2024-11-01' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('updates and upserts terms', async () => {
      repo.findById.mockResolvedValue({ id: 'sem-1', school_year_id: 'sy-1', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') });
      repo.findSiblingsInSchoolYear.mockResolvedValue([]);
      repo.update.mockResolvedValue({});
      repo.findById.mockResolvedValueOnce({ id: 'sem-1', school_year_id: 'sy-1', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') }).mockResolvedValueOnce({ id: 'sem-1', name: 'Updated' });
      const res = await service.update('sem-1', orgId, { name: 'Updated', terms: [{ name: 'Term 1', orderIndex: 0, startDate: '2024-06-01', endDate: '2024-07-01' }] } as any);
      expect(repo.update).toHaveBeenCalled();
      expect(repo.upsertTerms).toHaveBeenCalled();
      expect(res.name).toBe('Updated');
    });
    it('throws when term missing name/orderIndex', async () => {
      repo.findById.mockResolvedValue({ id: 'sem-1', school_year_id: 'sy-1', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') });
      repo.findSiblingsInSchoolYear.mockResolvedValue([]);
      await expect(service.update('sem-1', orgId, { terms: [{ orderIndex: 0, startDate: '2024-06-01', endDate: '2024-07-01' }] } as any)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.update('sem-1', orgId, { terms: [{ name: 'T', startDate: '2024-06-01', endDate: '2024-07-01' }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove / find', () => {
    it('remove throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('remove deletes terms then semester', async () => {
      repo.findById.mockResolvedValue({ id: 'sem-1' });
      await service.remove('sem-1', orgId);
      expect(repo.deleteTermsBySemester).toHaveBeenCalledWith('sem-1');
      expect(repo.delete).toHaveBeenCalledWith('sem-1');
    });
    it('findById throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findAll delegates', async () => {
      repo.findAll.mockResolvedValue([{ id: 'sem-1' }]);
      expect(await service.findAll(orgId)).toEqual([{ id: 'sem-1' }]);
    });
  });
});
