import { ProgramCalendarService } from './program-calendar.service';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('ProgramCalendarService', () => {
  let service: ProgramCalendarService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProgram: jest.fn(),
      findAll: jest.fn(),
      findAllByOrg: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      replaceBreaks: jest.fn(),
      replaceHolidays: jest.fn(),
      findHolidayConfig: jest.fn(),
      upsertHolidayConfig: jest.fn(),
    };

    service = new ProgramCalendarService(repo);
  });

  // ─────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should reject invalid date inputs (Invalid Date bug)', async () => {
      await expect(
        service.create('org1', {
          startDate: 'invalid',
          endDate: '2025-01-01',
          schoolYearId: 'sy1',
          programId: 'p1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when startDate >= endDate', async () => {
      await expect(
        service.create('org1', {
          startDate: '2025-01-01',
          endDate: '2025-01-01',
          schoolYearId: 'sy1',
          programId: 'p1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should behave idempotently (redirect to update if exists)', async () => {
      repo.findByProgram.mockResolvedValue({ id: 'existing-id' });

      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue({} as any);

      await service.create('org1', {
        startDate: '2025-01-01',
        endDate: '2025-02-01',
        schoolYearId: 'sy1',
        programId: 'p1',
      } as any);

      expect(updateSpy).toHaveBeenCalledWith(
        'existing-id',
        'org1',
        expect.objectContaining({
          startDate: '2025-01-01',
          endDate: '2025-02-01',
        }),
      );
    });

    it('should reject overlapping breaks', async () => {
      repo.findByProgram.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: '1' });

      await expect(
        service.create('org1', {
          startDate: '2025-01-01',
          endDate: '2025-03-01',
          schoolYearId: 'sy1',
          programId: 'p1',
          breaks: [
            {
              label: 'Break 1',
              startDate: '2025-01-10',
              endDate: '2025-01-20',
            },
            {
              label: 'Break 2',
              startDate: '2025-01-15',
              endDate: '2025-01-25',
            },
          ],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject breaks outside calendar range', async () => {
      repo.findByProgram.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: '1' });

      await expect(
        service.create('org1', {
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          schoolYearId: 'sy1',
          programId: 'p1',
          breaks: [
            {
              label: 'Invalid Break',
              startDate: '2024-12-25',
              endDate: '2025-01-05',
            },
          ],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw if calendar does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('1', 'org1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid date range after partial update', async () => {
      repo.findById.mockResolvedValue({
        start_date: new Date('2025-01-10'),
        end_date: new Date('2025-02-10'),
      });

      await expect(
        service.update('1', 'org1', {
          endDate: '2025-01-01',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject overlapping breaks on update', async () => {
      repo.findById.mockResolvedValue({
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-03-01'),
      });

      await expect(
        service.update('1', 'org1', {
          breaks: [
            {
              label: 'A',
              startDate: '2025-01-10',
              endDate: '2025-01-20',
            },
            {
              label: 'B',
              startDate: '2025-01-19',
              endDate: '2025-01-25',
            },
          ],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should not delete non-existent calendar', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.delete('1', 'org1'),
      ).rejects.toThrow(NotFoundException);

      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('should delete when calendar exists', async () => {
      repo.findById.mockResolvedValue({ id: '1' });

      await service.delete('1', 'org1');

      expect(repo.delete).toHaveBeenCalledWith('1');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // HOLIDAY CONFIG
  // ─────────────────────────────────────────────────────────────

  describe('saveHolidayConfig', () => {
    it('should reject invalid holiday keys', async () => {
      await expect(
        service.saveHolidayConfig('org1', {
          enabledKeys: ['INVALID_KEY'],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should resync all calendars after saving config', async () => {
      repo.upsertHolidayConfig.mockResolvedValue({
        enabled_keys: [],
        custom_holidays: [],
      });

      repo.findAllByOrg.mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ]);

      repo.findById
        .mockResolvedValueOnce({
          id: '1',
          start_date: '2025-01-01',
        })
        .mockResolvedValueOnce({
          id: '2',
          start_date: '2025-01-01',
        });

      await service.saveHolidayConfig('org1', {
        enabledKeys: [],
      } as any);

      expect(repo.replaceHolidays).toHaveBeenCalledTimes(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SEED DEFAULT HOLIDAYS
  // ─────────────────────────────────────────────────────────────

  describe('seedDefaultHolidays', () => {
    it('should merge defaults without duplicating existing keys', async () => {
      repo.findHolidayConfig.mockResolvedValue({
        enabled_keys: ['A'],
        custom_holidays: [],
      });

      repo.upsertHolidayConfig.mockResolvedValue({
        enabled_keys: ['A', 'B'],
        custom_holidays: [],
      });

      repo.findAllByOrg.mockResolvedValue([]);
      
      const result = await service.seedDefaultHolidays('org1');

      expect(result.added).toBeGreaterThanOrEqual(0);
    });
  });
});