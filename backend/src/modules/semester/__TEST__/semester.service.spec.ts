import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { SemesterService } from '../semester.service';
import { CreateSemesterDto, CreateTermDto } from '../dto/semester.dto';
import type { DatabaseService } from '@/core/database/database.provider';

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
    service = new SemesterService(repo, {
      program: { findFirst: jest.fn() },
      programSemesterAssignment: { findFirst: jest.fn() },
    } as unknown as DatabaseService);
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
      if (!res) throw new Error('expected res to be defined');
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
      if (!res) throw new Error('expected res to be defined');
      expect(res.name).toBe('Updated');
    });
    it('throws when term missing name/orderIndex', async () => {
      repo.findById.mockResolvedValue({ id: 'sem-1', school_year_id: 'sy-1', start_date: new Date('2024-06-01'), end_date: new Date('2024-10-31') });
      repo.findSiblingsInSchoolYear.mockResolvedValue([]);
      await expect(service.update('sem-1', orgId, { terms: [{ orderIndex: 0, startDate: '2024-06-01', endDate: '2024-07-01' }] } as any)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.update('sem-1', orgId, { terms: [{ name: 'T', startDate: '2024-06-01', endDate: '2024-07-01' }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove / find', () => {    it('remove throws NotFound when missing', async () => {
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

  // TICK-INFRA-017: semester/term dates are kind-B — "YYYY-MM-DD" only.
  describe('DTO calendar-date boundary', () => {
    async function errorsFor(dto: object): Promise<string[]> {
      // Nested (@ValidateNested) violations surface in `children`, not in
      // top-level constraints — collect recursively.
      const errors = await validate(dto);
      const messages: string[] = [];
      const walk = (list: typeof errors): void => {
        for (const e of list) {
          messages.push(...Object.values(e.constraints ?? {}));
          if (e.children?.length) walk(e.children);
        }
      };
      walk(errors);
      return messages;
    }

    function validDto(): CreateSemesterDto {
      const term = new CreateTermDto();
      term.name = 'Prelim';
      term.orderIndex = 1;
      term.startDate = '2024-06-01';
      term.endDate = '2024-07-15';
      const dto = new CreateSemesterDto();
      dto.schoolYearId = '11111111-1111-4111-8111-111111111111';
      dto.programId = '22222222-2222-4222-8222-222222222222';
      dto.templateSemesterId = '33333333-3333-4333-8333-333333333333';
      dto.name = '1st Semester';
      dto.startDate = '2024-06-01';
      dto.endDate = '2024-10-31';
      dto.terms = [term];
      return dto;
    }

    it('accepts YYYY-MM-DD throughout', async () => {
      expect(await errorsFor(validDto())).toHaveLength(0);
    });

    it('rejects full datetimes for semester and term dates', async () => {
      const zoned = validDto();
      zoned.startDate = '2024-06-01T00:00:00.000Z';
      expect(await errorsFor(zoned)).not.toHaveLength(0);

      const termZoned = validDto();
      termZoned.terms[0].endDate = '2024-07-15T16:00:00.000Z';
      expect(await errorsFor(termZoned)).not.toHaveLength(0);
    });
  });
});
