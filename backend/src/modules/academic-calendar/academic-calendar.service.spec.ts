import { AcademicCalendarService } from './academic-calendar.service';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('AcademicCalendarService', () => {
  let service: AcademicCalendarService;
  let repo: any;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findSessionBlockingEvents: jest.fn(),
    };

    service = new AcademicCalendarService(repo);
  });

  describe('create', () => {
    it('should reject invalid date inputs (guards against Invalid Date)', async () => {
      const dto = {
        startDate: 'invalid-date',
        endDate: '2025-01-01',
        schoolYearId: 'sy1',
        title: 'Invalid Event',
        type: 'holiday',
      };

      await expect(service.create('org1', dto as any))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should reject when startDate is after endDate', async () => {
      const dto = {
        startDate: '2025-02-01',
        endDate: '2025-01-01',
        schoolYearId: 'sy1',
        title: 'Bad Range',
        type: 'holiday',
      };

      await expect(service.create('org1', dto as any))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should NOT mark event as retroactive when start date is today', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      repo.create.mockResolvedValue({ id: '1' });

      const result = await service.create('org1', {
        startDate: today.toISOString(),
        endDate: today.toISOString(),
        schoolYearId: 'sy1',
        title: 'Today Event',
        type: 'holiday',
      } as any);

      expect(result.warning).toBeNull();
    });

    it('should mark event as retroactive when start date is in the past', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);

      repo.create.mockResolvedValue({ id: '1' });

      const result = await service.create('org1', {
        startDate: past.toISOString(),
        endDate: past.toISOString(),
        schoolYearId: 'sy1',
        title: 'Past Event',
        type: 'holiday',
      } as any);

      expect(result.warning).not.toBeNull();
    });
  });

  describe('update', () => {
    it('should throw NotFound if event does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update('1', 'org1', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject update that creates invalid date range (partial update bug)', async () => {
      repo.findById.mockResolvedValue({
        id: '1',
        start_date: new Date('2025-01-10'),
        end_date: new Date('2025-01-20'),
      });

      await expect(
        service.update('1', 'org1', {
          endDate: '2025-01-05',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not overwrite existing dates with undefined values', async () => {
      repo.findById.mockResolvedValue({
        id: '1',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-02'),
      });

      repo.update.mockResolvedValue({ id: '1' });

      await service.update('1', 'org1', {
        title: 'Updated title',
      } as any);

      const updatePayload = repo.update.mock.calls[0][1];

      expect(updatePayload.startDate).toBeUndefined();
      expect(updatePayload.endDate).toBeUndefined();
    });

    it('should flag retroactive when updated startDate is in the past', async () => {
      repo.findById.mockResolvedValue({
        id: '1',
        start_date: new Date('2025-01-10'),
        end_date: new Date('2025-01-20'),
      });

      const past = new Date();
      past.setDate(past.getDate() - 2);

      repo.update.mockResolvedValue({ id: '1' });

      const result = await service.update('1', 'org1', {
        startDate: past.toISOString(),
      } as any);

      expect(result.warning).not.toBeNull();
    });
  });

  describe('remove', () => {
    it('should throw NotFound when deleting non-existent event', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.remove('1', 'org1'),
      ).rejects.toThrow(NotFoundException);

      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('should delete when event exists', async () => {
      repo.findById.mockResolvedValue({ id: '1' });

      await service.remove('1', 'org1');

      expect(repo.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('isBlockedDate', () => {
    it('should return true when date equals start boundary', async () => {
      repo.findSessionBlockingEvents.mockResolvedValue([
        {
          start_date: '2025-01-10',
          end_date: '2025-01-15',
        },
      ]);

      const result = await service.isBlockedDate(
        'org1',
        'sy1',
        new Date('2025-01-10'),
      );

      expect(result).toBe(true);
    });

    it('should return true when date equals end boundary', async () => {
      repo.findSessionBlockingEvents.mockResolvedValue([
        {
          start_date: '2025-01-10',
          end_date: '2025-01-15',
        },
      ]);

      const result = await service.isBlockedDate(
        'org1',
        'sy1',
        new Date('2025-01-15'),
      );

      expect(result).toBe(true);
    });

    it('should return false when date is outside event range', async () => {
      repo.findSessionBlockingEvents.mockResolvedValue([
        {
          start_date: '2025-01-10',
          end_date: '2025-01-15',
        },
      ]);

      const result = await service.isBlockedDate(
        'org1',
        'sy1',
        new Date('2025-01-16'),
      );

      expect(result).toBe(false);
    });

    it('should return true if any overlapping event matches (multi-event safety)', async () => {
      repo.findSessionBlockingEvents.mockResolvedValue([
        {
          start_date: '2025-01-01',
          end_date: '2025-01-05',
        },
        {
          start_date: '2025-01-10',
          end_date: '2025-01-20',
        },
      ]);

      const result = await service.isBlockedDate(
        'org1',
        'sy1',
        new Date('2025-01-15'),
      );

      expect(result).toBe(true);
    });
  });
});