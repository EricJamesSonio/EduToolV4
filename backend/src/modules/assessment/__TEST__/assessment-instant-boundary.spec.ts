import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import {
  CreateAssessmentDto,
  UpdateAssessmentDto,
  ReopenAssessmentDto,
  GradingMode,
} from '../dto/assessment.dto';
import { AssessmentEducatorService } from '../educator/assessment-educator.service';
import { AssessmentCreationHelper } from '../educator/helpers/assessment-creation.helper';

/**
 * TICK-INFRA-017 — instant-boundary proof for assessment writes.
 *
 * Run under every process TZ (UTC, Asia/Manila, America/Los_Angeles,
 * Pacific/Kiritimati): all fixtures are explicit-offset ISO strings or
 * Date objects, so results must be identical in all four.
 */
describe('assessment instant boundary (TICK-INFRA-017)', () => {
  describe('UpdateAssessmentDto clearing contract', () => {
    async function errorsFor(dto: object): Promise<string[]> {
      const errors = await validate(dto);
      return errors.flatMap((e) => Object.values(e.constraints ?? {}));
    }

    it('accepts endDate:null (clear) and undefined (untouched)', async () => {
      const cleared = new UpdateAssessmentDto();
      cleared.endDate = null;
      expect(await errorsFor(cleared)).toHaveLength(0);

      const untouched = new UpdateAssessmentDto();
      expect(await errorsFor(untouched)).toHaveLength(0);
    });

    it('rejects zone-less datetimes on update', async () => {
      const zoneless = new UpdateAssessmentDto();
      zoneless.releaseDate = '2026-10-06T17:00';
      zoneless.endDate = '2026-10-06';
      expect(await errorsFor(zoneless)).not.toHaveLength(0);
    });

    it('accepts Z and offset instants on create and reopen', async () => {
      const create = new CreateAssessmentDto();
      create.termId = '11111111-1111-4111-8111-111111111111';
      create.type = 'quiz';
      create.totalItems = 1;
      create.releaseDate = '2026-10-06T09:00:00.000Z';
      create.endDate = '2026-10-06T17:00:00+08:00';
      expect(await errorsFor(create)).toHaveLength(0);

      const reopen = new ReopenAssessmentDto();
      reopen.studentIds = ['11111111-1111-4111-8111-111111111111'];
      reopen.reopenedUntil = '2026-10-06T17:00';
      expect(await errorsFor(reopen)).not.toHaveLength(0);
    });
  });

  describe('AssessmentEducatorService.update null-clearing', () => {
    const repo = { update: jest.fn() };
    const core = { findAssessmentOrThrow: jest.fn() };
    const classRepo = { findById: jest.fn() };
    const auditLog = { logActivityEvent: jest.fn() };
    let service: AssessmentEducatorService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = new AssessmentEducatorService(
        repo as any,
        core as any,
        {} as any,
        classRepo as any,
        auditLog as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );
      core.findAssessmentOrThrow.mockResolvedValue({
        id: 'a1',
        class_id: 'c1',
      });
      classRepo.findById.mockResolvedValue({ educator_id: 'educator-1' });
    });

    it('maps null to NULL (clear) and undefined to untouched', async () => {
      await service.update('a1', 'org1', 'educator-1', {
        releaseDate: null,
        endDate: undefined,
      });
      expect(repo.update).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({ releaseDate: null }),
      );
      const payload = repo.update.mock.calls[0][1] as Record<string, unknown>;
      expect('endDate' in payload ? payload.endDate : undefined).toBeUndefined();
    });

    it('stores Z and offset strings as the same absolute instant', async () => {
      await service.update('a1', 'org1', 'educator-1', {
        releaseDate: '2026-10-06T09:00:00.000Z',
        endDate: '2026-10-06T17:00:00+08:00',
      });
      const payload = repo.update.mock.calls[0][1] as {
        releaseDate: Date;
        endDate: Date;
      };
      expect(payload.releaseDate.toISOString()).toBe(
        '2026-10-06T09:00:00.000Z',
      );
      expect(payload.endDate.toISOString()).toBe('2026-10-06T09:00:00.000Z');
    });

    it('rejects zone-less strings even if DTO validation is bypassed', async () => {
      await expect(
        service.update('a1', 'org1', 'educator-1', {
          releaseDate: '2026-10-06T17:00',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('single parse site (AssessmentCreationHelper.createAssessmentRecord)', () => {
    const repo = { create: jest.fn() };
    let helper: AssessmentCreationHelper;

    beforeEach(() => {
      jest.clearAllMocks();
      helper = new AssessmentCreationHelper(repo as any, {} as any, {} as any);
    });

    function baseDto(): CreateAssessmentDto {
      return {
        termId: 'term-1',
        type: 'quiz',
        totalItems: 1,
        gradingMode: GradingMode.MANUAL,
      };
    }

    it('stores Z and offset strings as the same absolute instant', async () => {
      const dto = baseDto();
      dto.releaseDate = '2026-10-06T09:00:00.000Z';
      dto.endDate = '2026-10-06T17:00:00+08:00';
      await helper.createAssessmentRecord('org1', 'c1', dto, GradingMode.MANUAL);
      const payload = repo.create.mock.calls[0][0] as {
        releaseDate?: Date;
        endDate?: Date;
      };
      expect(payload.releaseDate?.toISOString()).toBe(
        '2026-10-06T09:00:00.000Z',
      );
      expect(payload.endDate?.toISOString()).toBe('2026-10-06T09:00:00.000Z');
    });

    it('rejects zone-less strings (preview/confirm flows through here too)', async () => {
      const dto = baseDto();
      dto.releaseDate = '2026-10-06T17:00';
      await expect(
        helper.createAssessmentRecord('org1', 'c1', dto, GradingMode.MANUAL),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});
