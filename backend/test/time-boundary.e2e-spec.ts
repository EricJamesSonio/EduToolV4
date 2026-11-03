/**
 * time-boundary.e2e-spec.ts — HTTP proof of the strict API boundary
 * (TICK-INFRA-017 R1, enforced TICK-INFRA-018).
 *
 * Boots a minimal Nest application with the SAME global ValidationPipe
 * configuration as src/main.ts (transform + whitelist + forbidNonWhitelisted
 * + implicit conversion) and a test controller bound to the REAL DTOs.
 * No database is touched, so this runs anywhere — including CI's e2e job
 * and a laptop with no Postgres.
 *
 * Each case is asserted under every TZ via `npm run test:tz` locally and
 * the CI tz-matrix job: the expectations are absolute (status codes), so
 * results must be identical in UTC, Asia/Manila, America/Los_Angeles, and
 * Pacific/Kiritimati.
 */
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import {
  CreateAssessmentDto,
  ReopenAssessmentDto,
} from '@/modules/assessment/dto/assessment.dto';
import { CreateGradeLockSettingDto } from '@/modules/grade-lock/dto/grade-lock.dto';
import { GrantUnlockDto } from '@/modules/grade-lock/dto/grade-lock.dto';
import { CreateMeetingDto } from '@/modules/meeting/dto/meeting.dto';
import { CreateSchoolYearDto } from '@/modules/school-year/dto/school-year.dto';
import { CreateEnrollmentPeriodDto } from '@/modules/enrollment-portal/registrar/dto/enrollment-registrar.dto';

@Controller('t')
class BoundaryController {
  @Post('assessment')
  @HttpCode(201)
  createAssessment(@Body() _dto: CreateAssessmentDto) {
    return { ok: true };
  }

  @Post('reopen')
  @HttpCode(201)
  reopen(@Body() _dto: ReopenAssessmentDto) {
    return { ok: true };
  }

  @Post('grade-lock-setting')
  @HttpCode(201)
  createSetting(@Body() _dto: CreateGradeLockSettingDto) {
    return { ok: true };
  }

  @Post('grant-unlock')
  @HttpCode(201)
  grantUnlock(@Body() _dto: GrantUnlockDto) {
    return { ok: true };
  }

  @Post('meeting')
  @HttpCode(201)
  createMeeting(@Body() _dto: CreateMeetingDto) {
    return { ok: true };
  }

  @Post('school-year')
  @HttpCode(201)
  createSchoolYear(@Body() _dto: CreateSchoolYearDto) {
    return { ok: true };
  }

  @Post('enrollment-period')
  @HttpCode(201)
  createPeriod(@Body() _dto: CreateEnrollmentPeriodDto) {
    return { ok: true };
  }
}

describe('time API boundary (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BoundaryController],
    }).compile();
    app = moduleRef.createNestApplication();
    // Mirror src/main.ts exactly.
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const UUID = '11111111-1111-4111-8111-111111111111';

  it('rejects a zone-less assessment instant with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/t/assessment')
      .send({
        termId: UUID,
        type: 'quiz',
        totalItems: 1,
        releaseDate: '2026-10-06T17:00',
        endDate: '2026-10-07T17:00',
      });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/offset|zone/i);
  });

  it('accepts Z and +08:00 assessment instants as the same moment', async () => {
    for (const releaseDate of [
      '2026-10-06T09:00:00.000Z',
      '2026-10-06T17:00:00+08:00',
    ]) {
      const res = await request(app.getHttpServer())
        .post('/t/assessment')
        .send({ termId: UUID, type: 'quiz', totalItems: 1, releaseDate });
      expect(res.status).toBe(201);
    }
  });

  it('rejects zone-less reopenedUntil and grade-lock deadlines with 400', async () => {
    const reopen = await request(app.getHttpServer()).post('/t/reopen').send({
      studentIds: [UUID],
      reopenedUntil: '2026-10-06T17:00',
    });
    expect(reopen.status).toBe(400);

    const setting = await request(app.getHttpServer())
      .post('/t/grade-lock-setting')
      .send({
        name: 'Finals',
        lockType: 'hard',
        allowOverride: true,
        lock_deadline: '2026-10-06T17:00',
      });
    expect(setting.status).toBe(400);

    const grant = await request(app.getHttpServer())
      .post('/t/grant-unlock')
      .send({ reason: 'appeal upheld', newDeadline: '2026-10-06' });
    expect(grant.status).toBe(400);
  });

  it('rejects zone-less and date-only meeting startTime with 400', async () => {
    for (const startTime of ['2026-10-06T17:00', '2026-10-06']) {
      const res = await request(app.getHttpServer())
        .post('/t/meeting')
        .send({ title: 'Sync', startTime });
      expect(res.status).toBe(400);
    }
    const ok = await request(app.getHttpServer())
      .post('/t/meeting')
      .send({ title: 'Sync', startTime: '2026-10-06T09:00:00.000Z' });
    expect(ok.status).toBe(201);
  });

  it('rejects full datetimes for calendar-date fields with 400', async () => {
    const year = await request(app.getHttpServer()).post('/t/school-year').send({
      start_date: '2026-08-01',
      end_date: '2027-06-30T00:00:00.000Z',
    });
    expect(year.status).toBe(400);

    const period = await request(app.getHttpServer())
      .post('/t/enrollment-period')
      .send({
        name: 'P1',
        school_year_id: 'sy-1',
        start_date: '2026-08-01',
        end_date: '2027-06-30',
        lock_date: '2027-06-01T08:00:00.000Z',
      });
    expect(period.status).toBe(400);

    const ok = await request(app.getHttpServer())
      .post('/t/enrollment-period')
      .send({
        name: 'P1',
        school_year_id: 'sy-1',
        start_date: '2026-08-01',
        end_date: '2027-06-30',
        lock_date: '2027-06-01',
      });
    expect(ok.status).toBe(201);
  });
});
