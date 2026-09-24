import { ConflictException } from '@nestjs/common';
import { SchoolYearService } from '../school-year.service';
import type { SchoolYearRepository } from '../school-year.repository';
import type { SchoolYearReadinessService } from '../school-year-readiness.service';
import type { LevelService } from '@/modules/level/level.service';
import type { SubjectService } from '@/modules/subject/subject.service';
import type { GradingScaleService } from '../../grading-scale/grading-scale.service';
import type { AuditLogService } from '../../audit-log/audit-log.service';

const DAY_MS = 24 * 60 * 60 * 1000;

const dayFromNow = (days: number): string =>
  new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);

describe('SchoolYearService overlap rules', () => {
  const orgId = 'org-1';
  const actorId = 'actor-1';
  const START = dayFromNow(30);
  const END = dayFromNow(400);

  const existingRow = {
    id: 'sy-existing',
    name: 'SY 2026-2027',
    status: 'pending',
    start_date: new Date(dayFromNow(10)),
    end_date: new Date(dayFromNow(380)),
  };

  let repo: {
    create: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    findOverlapping: jest.Mock;
    expireAndEndActive: jest.Mock;
  };
  let levelService: { seedFromDefaults: jest.Mock };
  let audit: { logAdminAction: jest.Mock };
  let service: SchoolYearService;

  beforeEach(() => {
    repo = {
      create: jest.fn().mockResolvedValue({ id: 'sy-new' }),
      findById: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'sy-1' }),
      findOverlapping: jest.fn().mockResolvedValue([]),
      expireAndEndActive: jest.fn().mockResolvedValue(0),
    };
    levelService = { seedFromDefaults: jest.fn().mockResolvedValue(undefined) };
    audit = { logAdminAction: jest.fn().mockResolvedValue(undefined) };

    service = new SchoolYearService(
      repo as unknown as SchoolYearRepository,
      levelService as unknown as LevelService,
      {} as unknown as SubjectService,
      {} as unknown as GradingScaleService,
      audit as unknown as AuditLogService,
      {} as unknown as SchoolYearReadinessService,
    );
  });

  describe('create', () => {
    it('checks overlaps with the requested range and creates when free', async () => {
      await service.create(
        orgId,
        { name: 'New', start_date: START, end_date: END },
        actorId,
      );

      expect(repo.findOverlapping).toHaveBeenCalledWith(
        orgId,
        new Date(START),
        new Date(END),
        undefined,
      );
      expect(repo.create).toHaveBeenCalledTimes(1);
    });

    it('throws SCHOOL_YEAR_OVERLAP and does not create when a range overlaps', async () => {
      repo.findOverlapping.mockResolvedValue([existingRow]);

      const error = await service
        .create(orgId, { name: 'New', start_date: START, end_date: END }, actorId)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        statusCode: 409,
        error: 'SCHOOL_YEAR_OVERLAP',
        conflicts: [{ id: 'sy-existing', name: 'SY 2026-2027' }],
      });
      expect(repo.create).not.toHaveBeenCalled();
      expect(levelService.seedFromDefaults).not.toHaveBeenCalled();
    });

    it('reports the overlap before the short duration prompt', async () => {
      repo.findOverlapping.mockResolvedValue([existingRow]);

      await expect(
        service.create(
          orgId,
          { name: 'Short', start_date: START, end_date: dayFromNow(100) },
          actorId,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('skips the overlap check when a date is missing', async () => {
      await service.create(orgId, { name: 'No end', start_date: START }, actorId);

      expect(repo.findOverlapping).not.toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    const stored = {
      id: 'sy-1',
      name: 'Old',
      status: 'pending',
      start_date: new Date(START),
      end_date: new Date(END),
    };

    beforeEach(() => {
      repo.findById.mockResolvedValue(stored);
    });

    it('does not re-check overlaps when only the name changes', async () => {
      await service.update(
        'sy-1',
        orgId,
        { name: 'Renamed', start_date: START, end_date: END },
        actorId,
      );

      expect(repo.findOverlapping).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledTimes(1);
    });

    it('checks overlaps excluding itself when a date changes', async () => {
      const newStart = dayFromNow(60);

      await service.update(
        'sy-1',
        orgId,
        { start_date: newStart, end_date: END },
        actorId,
      );

      expect(repo.findOverlapping).toHaveBeenCalledWith(
        orgId,
        new Date(newStart),
        new Date(END),
        'sy-1',
      );
      expect(repo.update).toHaveBeenCalledTimes(1);
    });

    it('throws SCHOOL_YEAR_OVERLAP and does not update when the new range overlaps', async () => {
      repo.findOverlapping.mockResolvedValue([existingRow]);

      const error = await service
        .update('sy-1', orgId, { end_date: dayFromNow(500) }, actorId)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        error: 'SCHOOL_YEAR_OVERLAP',
      });
      expect(repo.update).not.toHaveBeenCalled();
    });
  });
});