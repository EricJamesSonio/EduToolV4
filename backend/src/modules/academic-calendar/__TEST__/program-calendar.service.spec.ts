import { Test, TestingModule } from '@nestjs/testing';
import { ProgramCalendarService } from '../program-calendar/program-calendar.service';
import { ProgramCalendarRepository } from '../program-calendar/program-calendar.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('../data/holidays.data', () => ({
  PHILIPPINE_HOLIDAYS: [
    { key: 'NEW_YEAR', title: 'New Year', date: new Date() },
  ],
  getDefaultEnabledKeys: jest.fn(() => ['NEW_YEAR']),
  resolveHolidays: jest.fn(() => [{ key: 'NEW_YEAR', title: 'New Year' }]),
  buildHolidayDates: jest.fn(() => [
    {
      key: 'NEW_YEAR',
      title: 'New Year',
      date: new Date(),
    },
  ]),
}));
describe('ProgramCalendarService', () => {
  let service: ProgramCalendarService;
  let repo: jest.Mocked<ProgramCalendarRepository>;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByProgram: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    replaceBreaks: jest.fn(),
    replaceHolidays: jest.fn(),
    findHolidayConfig: jest.fn(),
    upsertHolidayConfig: jest.fn(),
    findAllByOrg: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramCalendarService,
        {
          provide: ProgramCalendarRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProgramCalendarService>(ProgramCalendarService);
    repo = module.get(ProgramCalendarRepository);
    jest.clearAllMocks();
  });

  // ── CREATE ─────────────────────────────────────────

  describe('create', () => {
    it('should create new calendar', async () => {
      repo.findByProgram.mockResolvedValue(null);

      repo.create.mockResolvedValue({
        id: '1',
        start_date: new Date(),
      } as any);

      repo.findHolidayConfig.mockResolvedValue(null);
      repo.findById.mockResolvedValue({
        id: '1',
        breaks: [],
        holidays: [],
      } as any);

      const result = await service.create('org1', {
        programId: 'p1',
        schoolYearId: 'sy1',
        startDate: '2025-01-01',
        endDate: '2025-12-01',
      });

      expect(repo.create).toHaveBeenCalled();
      expect(repo.replaceHolidays).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should redirect to update if existing', async () => {
      repo.findByProgram.mockResolvedValue({ id: 'existing' } as any);

      const spy = jest.spyOn(service, 'update').mockResolvedValue({} as any);

      await service.create('org1', {
        programId: 'p1',
        schoolYearId: 'sy1',
        startDate: '2025-01-01',
        endDate: '2025-12-01',
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should throw if invalid date range', async () => {
      await expect(
        service.create('org1', {
          programId: 'p1',
          schoolYearId: 'sy1',
          startDate: '2025-12-01',
          endDate: '2025-01-01',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── FIND ──────────────────────────────────────────

  describe('findById', () => {
    it('should return calendar', async () => {
      repo.findById.mockResolvedValue({
        id: '1',
        breaks: [],
        holidays: [],
      } as any);

      const result = await service.findById('1', 'org1');

      expect(result.id).toBe('1');
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('1', 'org1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── UPDATE ─────────────────────────────────────────

  describe('update', () => {
    it('should update calendar', async () => {
      repo.findById.mockResolvedValue({
        id: '1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-01'),
      } as any);

      repo.update.mockResolvedValue({} as any);
      repo.findById.mockResolvedValue({
        id: '1',
        breaks: [],
        holidays: [],
      } as any);

      const result = await service.update('1', 'org1', {
        notes: 'updated',
      });

      expect(repo.update).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update('1', 'org1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw invalid date range', async () => {
      repo.findById.mockResolvedValue({
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-01'),
      } as any);

      await expect(
        service.update('1', 'org1', {
          startDate: '2025-12-01',
          endDate: '2025-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── DELETE ─────────────────────────────────────────

  describe('delete', () => {
    it('should delete calendar', async () => {
      repo.findById.mockResolvedValue({ id: '1' } as any);

      await service.delete('1', 'org1');

      expect(repo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('1', 'org1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── HOLIDAY CONFIG ─────────────────────────────────

  describe('saveHolidayConfig', () => {
    it('should save config and sync calendars', async () => {
      repo.upsertHolidayConfig.mockResolvedValue({
        enabled_keys: ['NEW_YEAR'],
        custom_holidays: [],
      } as any);

      repo.findAllByOrg.mockResolvedValue([{ id: '1' }]);
      repo.findById.mockResolvedValue({
        id: '1',
        start_date: new Date(),
      } as any);

      const result = await service.saveHolidayConfig('org1', {
        enabledKeys: ['NEW_YEAR'],
      });

      expect(repo.replaceHolidays).toHaveBeenCalled();
      expect(result).toHaveProperty('synced');
    });

    it('should throw on invalid holiday keys', async () => {
      await expect(
        service.saveHolidayConfig('org1', {
          enabledKeys: ['INVALID_KEY'],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── SEED DEFAULT HOLIDAYS ──────────────────────────

  describe('seedDefaultHolidays', () => {
    it('should seed and sync calendars', async () => {
      repo.findHolidayConfig.mockResolvedValue({
        enabled_keys: [],
        custom_holidays: [],
      } as any);

      repo.upsertHolidayConfig.mockResolvedValue({
        enabled_keys: ['NEW_YEAR'],
        custom_holidays: [],
      } as any);

      repo.findAllByOrg.mockResolvedValue([{ id: '1' }]);
      repo.findById.mockResolvedValue({
        id: '1',
        start_date: new Date(),
      } as any);

      const result = await service.seedDefaultHolidays('org1');

      expect(result).toHaveProperty('added');
      expect(repo.replaceHolidays).toHaveBeenCalled();
    });
  });

  // ── BLOCK: BREAK VALIDATION EDGE ───────────────────

  describe('break validation (via update)', () => {
    it('should throw overlapping breaks', async () => {
      repo.findById.mockResolvedValue({
        id: '1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-01'),
      } as any);

      await expect(
        service.update('1', 'org1', {
          breaks: [
            { label: 'A', startDate: '2025-01-01', endDate: '2025-01-10' },
            { label: 'B', startDate: '2025-01-05', endDate: '2025-01-15' },
          ],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
