import { Test, TestingModule } from '@nestjs/testing';
import { AcademicCalendarService } from '../academic-calendar.service';
import { AcademicCalendarRepository } from '../academic-calendar.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AcademicCalendarService', () => {
  let service: AcademicCalendarService;
  let repository: jest.Mocked<AcademicCalendarRepository>;

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findSessionBlockingEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicCalendarService,
        {
          provide: AcademicCalendarRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AcademicCalendarService>(AcademicCalendarService);
    repository = module.get(AcademicCalendarRepository);
    jest.clearAllMocks();
  });

  // ── CREATE ─────────────────────────────────────────

  describe('create', () => {
    it('should create event successfully', async () => {
      const dto = {
        schoolYearId: 'sy1',
        title: 'Test Event',
        type: 'holiday',
        startDate: '2025-01-01',
        endDate: '2025-01-02',
        description: 'desc',
      };

      repository.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create('org1', dto);

      expect(repository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('warning');
    });

    it('should throw if startDate > endDate', async () => {
      const dto = {
        schoolYearId: 'sy1',
        title: 'Invalid Event',
        type: 'holiday',
        startDate: '2025-01-03',
        endDate: '2025-01-01',
        description: '',
      };

      await expect(service.create('org1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return warning if retroactive', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const dto = {
        schoolYearId: 'sy1',
        title: 'Past Event',
        type: 'holiday',
        startDate: pastDate.toISOString(),
        endDate: pastDate.toISOString(),
        description: '',
      };

      repository.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.create('org1', dto);

      expect(result.warning).toBeTruthy();
    });
  });

  // ── FIND ALL ──────────────────────────────────────

  describe('findAll', () => {
    it('should return events', async () => {
      repository.findAll.mockResolvedValue([{ id: '1' }]);

      const result = await service.findAll('org1', {
        schoolYearId: 'sy1',
      });

      expect(repository.findAll).toHaveBeenCalledWith('org1', 'sy1');
      expect(result).toEqual([{ id: '1' }]);
    });
  });

  // ── UPDATE ────────────────────────────────────────

  describe('update', () => {
    it('should update event', async () => {
      const existing = {
        id: '1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-02'),
      };

      repository.findById.mockResolvedValue(existing as any);
      repository.update.mockResolvedValue({ id: '1' });

      const result = await service.update('1', 'org1', {
        title: 'Updated',
      });

      expect(repository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('warning');
    });

    it('should throw if not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('1', 'org1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if invalid date range', async () => {
      const existing = {
        id: '1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-02'),
      };

      repository.findById.mockResolvedValue(existing as any);

      await expect(
        service.update('1', 'org1', {
          startDate: '2025-01-05',
          endDate: '2025-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── DELETE ────────────────────────────────────────

  describe('remove', () => {
    it('should delete event', async () => {
      repository.findById.mockResolvedValue({ id: '1' } as any);

      await service.remove('1', 'org1');

      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw if not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove('1', 'org1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── SESSION BLOCKING EVENTS ───────────────────────

  describe('getSessionBlockingEvents', () => {
    it('should return blocking events', async () => {
      repository.findSessionBlockingEvents.mockResolvedValue([{ id: '1' }]);

      const result = await service.getSessionBlockingEvents('org1', 'sy1');

      expect(result).toEqual([{ id: '1' }]);
    });
  });

  // ── IS BLOCKED DATE ───────────────────────────────

  describe('isBlockedDate', () => {
    it('should return true if date is blocked', async () => {
      repository.findSessionBlockingEvents.mockResolvedValue([
        {
          start_date: '2025-01-01',
          end_date: '2025-01-10',
        },
      ]);

      const result = await service.isBlockedDate(
        'org1',
        'sy1',
        new Date('2025-01-05'),
      );

      expect(result).toBe(true);
    });

    it('should return false if date is not blocked', async () => {
      repository.findSessionBlockingEvents.mockResolvedValue([
        {
          start_date: '2025-01-01',
          end_date: '2025-01-03',
        },
      ]);

      const result = await service.isBlockedDate(
        'org1',
        'sy1',
        new Date('2025-01-05'),
      );

      expect(result).toBe(false);
    });
  });
});