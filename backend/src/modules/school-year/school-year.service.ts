// backend/src/modules/school-year/school-year.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SchoolYearRepository } from './school-year.repository';
import { SchoolYearReadinessService } from './school-year-readiness.service';
import { LevelService } from '@/modules/level/level.service';
import { SubjectService } from '@/modules/subject/subject.service';
import { GradingScaleService } from '../grading-scale/grading-scale.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
  SchoolYearCreateResult,
} from './dto/school-year.dto';

const TEN_MONTHS_MS = 10 * 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class SchoolYearService {
  constructor(
    private readonly schoolYearRepository: SchoolYearRepository,
    private readonly levelService: LevelService,
    private readonly subjectService: SubjectService,
    private readonly gradingScaleService: GradingScaleService,
    private readonly auditLogService: AuditLogService,
    private readonly readinessService: SchoolYearReadinessService,
  ) {}

  // ---------------------------------------------------------------------------
  // Date validation helpers
  // ---------------------------------------------------------------------------

  private validateDateRange(start_date?: string, end_date?: string): void {
    if (!start_date || !end_date) return;

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return; // class-validator already catches this

    if (end <= start) {
      throw new BadRequestException('end_date must be after start_date.');
    }
  }

  /**
   * Returns true when both dates are provided and the span is less than 10 months.
   * The caller decides whether to abort or proceed based on confirm_short_duration.
   */
  private isShortDuration(start_date?: string, end_date?: string): boolean {
    if (!start_date || !end_date) return false;

    const start = new Date(start_date);
    const end = new Date(end_date);
    return end.getTime() - start.getTime() < TEN_MONTHS_MS;
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(
    orgId: string,
    dto: CreateSchoolYearDto,
    actorId: string,
  ): Promise<SchoolYearCreateResult> {
    this.validateDateRange(dto.start_date, dto.end_date);
    this.validateNotInPast(dto.start_date, dto.end_date); // 👈 ADD THIS

    const short = this.isShortDuration(dto.start_date, dto.end_date);

    if (short && !dto.confirm_short_duration) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SHORT_DURATION_WARNING',
        message:
          'This school year spans less than 10 months. Are you sure you want to proceed?',
      });
    }

    const schoolYear = await this.schoolYearRepository.create({
      orgId,
      name: dto.name,
      start_date: dto.start_date,
      end_date: dto.end_date,
    });

    await this.levelService.seedFromDefaults(orgId, schoolYear.id, {});

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'school_year_created',
        entityType: 'school_year',
        entityId: schoolYear.id,
        metadata: {
          name: dto.name,
          start_date: dto.start_date,
          end_date: dto.end_date,
        },
      })
      .catch(() => {});

    return {
      data: schoolYear,
      warning: short ? 'School year is shorter than 10 months.' : undefined,
    };
  }

  async findAll(orgId: string) {
    const schoolYears = await this.schoolYearRepository.findAll(orgId);

    // Careful: the usage scan is only a UI hint (show/hide the Delete action).
    // If it fails for any reason we must NOT break the whole list — fall back
    // to "in use = false" and let the server-side check guard deletion.
    let usage: Record<string, number> = {};
    try {
      usage = await this.schoolYearRepository.usageCountsBySchoolYear(orgId);
    } catch {
      usage = {};
    }

    return schoolYears.map((sy) => ({
      ...sy,
      in_use: (usage[sy.id] ?? 0) > 0,
    }));
  }

  async findById(id: string, orgId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) throw new NotFoundException('School year not found.');
    return schoolYear;
  }

  async findActive(orgId: string) {
    return this.schoolYearRepository.findActive(orgId);
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateSchoolYearDto,
    actorId: string,
  ) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) throw new NotFoundException('School year not found.');

    if (schoolYear.status === 'ended') {
      throw new BadRequestException(
        'Ended school years are archived and cannot be modified.',
      );
    }

    const effectiveStart =
      dto.start_date ?? schoolYear.start_date?.toISOString();
    const effectiveEnd = dto.end_date ?? schoolYear.end_date?.toISOString();

    this.validateDateRange(effectiveStart, effectiveEnd);

    const short = this.isShortDuration(effectiveStart, effectiveEnd);

    if (short && !dto.confirm_short_duration) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SHORT_DURATION_WARNING',
        message:
          'This school year spans less than 10 months. Are you sure you want to proceed?',
      });
    }

    const updated = await this.schoolYearRepository.update(id, {
      name: dto.name,
      start_date: dto.start_date,
      end_date: dto.end_date,
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'school_year_updated',
        entityType: 'school_year',
        entityId: id,
        metadata: { name: dto.name },
      })
      .catch(() => {});

    return updated;
  }

  async activate(id: string, orgId: string, actorId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) {
      throw new NotFoundException('School year not found.');
    }

    if (schoolYear.status === 'active') {
      throw new ConflictException('This school year is already active.');
    }

    if (schoolYear.status === 'ended') {
      throw new BadRequestException(
        'An ended school year cannot be reactivated.',
      );
    }

    // Require the school year to be structurally ready before activation.
    await this.readinessService.assertReady(orgId, id);

    // ✅ Null safety (fix TS error properly)
    if (!schoolYear.start_date) {
      throw new BadRequestException(
        'School year has no start date and cannot be activated.',
      );
    }

    // 🔥 Prevent early activation, allow late activation
    const today = new Date();
    const start = new Date(schoolYear.start_date);

    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    if (start > today) {
      throw new BadRequestException(
        'Cannot activate a school year before its start date.',
      );
    }

    // ✅ Ensure only one active school year (safer than count)
    const existingActive = await this.schoolYearRepository.findActive(orgId);
    if (existingActive) {
      throw new ConflictException(
        'Another school year is currently active. End it before activating a new one.',
      );
    }

    const result = await this.schoolYearRepository.updateStatus(id, 'active');

    await this.subjectService.unlockAllForOrg(orgId);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'school_year_activated',
        entityType: 'school_year',
        entityId: id,
      })
      .catch(() => {});

    return result;
  }
  async end(id: string, orgId: string, actorId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) throw new NotFoundException('School year not found.');

    if (schoolYear.status === 'ended')
      throw new ConflictException('This school year has already ended.');
    if (schoolYear.status === 'pending')
      throw new BadRequestException(
        'A pending school year cannot be ended. Activate it first.',
      );

    await this.schoolYearRepository.updateStatus(id, 'ended');
    await this.schoolYearRepository.unenrollAllStudents(id, orgId);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'school_year_ended',
        entityType: 'school_year',
        entityId: id,
      })
      .catch(() => {});

    return this.schoolYearRepository.findById(id, orgId);
  }

  async remove(id: string, orgId: string, actorId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) throw new NotFoundException('School year not found.');

    if (schoolYear.status !== 'pending') {
      throw new ConflictException(
        'Only a pending school year that has not been used can be deleted.',
      );
    }

    const inUse = await this.schoolYearRepository.hasUsage(id);
    if (inUse) {
      throw new ConflictException(
        'This school year cannot be deleted because it is already in use (it has students, classes, sections, or curriculum data).',
      );
    }

    await this.schoolYearRepository.delete(id);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'school_year_deleted',
        entityType: 'school_year',
        entityId: id,
        metadata: { name: schoolYear.name },
      })
      .catch(() => {});

    return { id, deleted: true };
  }

  private validateNotInPast(start_date?: string, end_date?: string): void {
    if (!start_date || !end_date) return;

    const now = new Date();
    const start = new Date(start_date);
    const end = new Date(end_date);

    // normalize to ignore time (important!)
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start < now) {
      throw new BadRequestException('start_date cannot be in the past.');
    }

    if (end < now) {
      throw new BadRequestException('end_date cannot be in the past.');
    }
  }
}
