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
import { OrgSeederService } from '@/modules/org-seeder/org-seeder.service';
import { SchoolProfileService } from '@/modules/school-profile/school-profile.service';
import { DatabaseService } from '@/core/database/database.provider';
import {
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
  SchoolYearCreateResult,
} from './dto/school-year.dto';

const TEN_MONTHS_MS = 10 * 30 * 24 * 60 * 60 * 1000;
const MAX_CONFLICT_NAMES_IN_MESSAGE = 3;

@Injectable()
export class SchoolYearService {
  constructor(
    private readonly schoolYearRepository: SchoolYearRepository,
    private readonly levelService: LevelService,
    private readonly subjectService: SubjectService,
    private readonly gradingScaleService: GradingScaleService,
    private readonly auditLogService: AuditLogService,
    private readonly readinessService: SchoolYearReadinessService,
    private readonly orgSeeder: OrgSeederService,
    private readonly schoolProfileService: SchoolProfileService,
    private readonly db: DatabaseService,
  ) {}

    private deriveSchoolYearName(start_date?: string, end_date?: string): string {
    if (!start_date || !end_date) {
      throw new BadRequestException(
        'Both start_date and end_date are required to generate the school year name.',
      );
    }
    const startYear = new Date(start_date).getFullYear();
    const endYear = new Date(end_date).getFullYear();
    return `SY ${startYear}-${endYear}`;
  }

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

  /**
   * Rejects the date range when it intersects any other school year of the
   * same organization (any status, boundaries inclusive).
   * Skipped when either date is missing or unparseable, matching the other
   * date validators. excludeId omits the record being edited.
   */
  private async assertNoOverlap(
    orgId: string,
    start_date?: string,
    end_date?: string,
    excludeId?: string,
  ): Promise<void> {
    if (!start_date || !end_date) return;

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const conflicts = await this.schoolYearRepository.findOverlapping(
      orgId,
      start,
      end,
      excludeId,
    );

    if (conflicts.length === 0) return;

    const formatDay = (value: Date | null): string =>
      value ? value.toISOString().slice(0, 10) : 'unset';

    const described = conflicts
      .slice(0, MAX_CONFLICT_NAMES_IN_MESSAGE)
      .map(
        (c) =>
          `"${c.name}" (${formatDay(c.start_date)} to ${formatDay(c.end_date)})`,
      )
      .join(', ');
    const remaining = conflicts.length - MAX_CONFLICT_NAMES_IN_MESSAGE;
    const extra = remaining > 0 ? ` and ${remaining} more` : '';
    const noun = conflicts.length === 1 ? 'school year' : 'school years';

    throw new ConflictException({
      statusCode: 409,
      error: 'SCHOOL_YEAR_OVERLAP',
      message: `The selected dates overlap with existing ${noun} ${described}${extra}. School years cannot overlap.`,
      conflicts: conflicts.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        start_date: c.start_date ? c.start_date.toISOString() : null,
        end_date: c.end_date ? c.end_date.toISOString() : null,
      })),
    });
  }

  private async expireIfNeeded(): Promise<void> {
    try {
      await this.schoolYearRepository.expireAndEndActive();
    } catch {
      // best-effort; do not block main operation
    }
  }

  /**
   * If the org has "auto-seed new school years" enabled AND a School
   * Profile with at least one configured department exists, seeds the new
   * school year's structure (programs/courses/strands/levels/sections/
   * subjects + grading scales/schemes) from that profile — mirroring the
   * "Select All" flow in the Data Seeder. Semester templates and program
   * calendars are intentionally skipped here since they need per-year dates
   * the admin still has to supply.
   *
   * Never throws — a seeding failure must not block school year creation;
   * it's surfaced via the returned warning string instead.
   */
  private async maybeAutoSeed(
    orgId: string,
    schoolYearId: string,
    actorId: string,
  ): Promise<{ seeded: boolean; warning?: string }> {
    const org = await this.db.organization.findUnique({
      where: { id: orgId },
      select: { auto_seed_new_school_years: true },
    });
    if (!org?.auto_seed_new_school_years) return { seeded: false };

    const profileByType = await this.schoolProfileService.getAllByType(orgId);
    const programs = Object.keys(profileByType).filter(
      (type) => !!profileByType[type],
    );
    if (programs.length === 0) return { seeded: false };

    try {
      await this.orgSeeder.seedOrg({
        orgId,
        actorId,
        schoolYearId,
        programs,
        seedGradingScales: true,
        seedGradingSchemes: true,
        seedSemesterTemplates: false,
        seedProgramCalendars: false,
      });
      return { seeded: true };
    } catch (e: any) {
      return {
        seeded: false,
        warning: `School year created, but automatic seeding from your School Profile failed: ${e?.message ?? 'unknown error'}. You can seed it manually from Data Seeder.`,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(
    orgId: string,
    dto: CreateSchoolYearDto,
    actorId: string,
  ): Promise<SchoolYearCreateResult> {
    await this.expireIfNeeded();
    this.validateDateRange(dto.start_date, dto.end_date);
    this.validateNotInPast(dto.start_date, dto.end_date);
    await this.assertNoOverlap(orgId, dto.start_date, dto.end_date);

    const name = dto.name?.trim() || this.deriveSchoolYearName(dto.start_date, dto.end_date);

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
      name,
      start_date: dto.start_date,
      end_date: dto.end_date,
    });

    await this.levelService.seedFromDefaults(orgId, schoolYear.id, {});

    const autoSeedResult = await this.maybeAutoSeed(
      orgId,
      schoolYear.id,
      actorId,
    );

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'school_year_created',
        entityType: 'school_year',
        entityId: schoolYear.id,
        metadata: {
          name,
          start_date: dto.start_date,
          end_date: dto.end_date,
          auto_seeded: autoSeedResult.seeded,
        },
      })
      .catch(() => {});

    const warnings = [
      short ? 'School year is shorter than 10 months.' : undefined,
      autoSeedResult.warning,
    ].filter(Boolean);

    return {
      data: schoolYear,
      warning: warnings.length > 0 ? warnings.join(' ') : undefined,
      seeded: autoSeedResult.seeded,
    };
  }

  async findAll(orgId: string) {
    await this.expireIfNeeded();
    const schoolYears = await this.schoolYearRepository.findAll(orgId);

    // Careful: the usage scan is only a UI hint (show/hide the Delete action).
    // If it fails for any reason we must NOT break the whole list. Fall back
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
    await this.expireIfNeeded();
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) throw new NotFoundException('School year not found.');
    return schoolYear;
  }

  async findActive(orgId: string) {
    await this.expireIfNeeded();
    return this.schoolYearRepository.findActive(orgId);
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateSchoolYearDto,
    actorId: string,
  ) {
    await this.expireIfNeeded();
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
    this.validateNotInPast(effectiveStart, effectiveEnd);

    // Only re-check overlaps when a date really changes, so renaming a school
    // year that already overlaps legacy data is not blocked.
    const startChanged =
      !!dto.start_date &&
      new Date(dto.start_date).getTime() !== schoolYear.start_date?.getTime();
    const endChanged =
      !!dto.end_date &&
      new Date(dto.end_date).getTime() !== schoolYear.end_date?.getTime();

    if (startChanged || endChanged) {
      await this.assertNoOverlap(orgId, effectiveStart, effectiveEnd, id);
    }

    const short = this.isShortDuration(effectiveStart, effectiveEnd);

    if (short && !dto.confirm_short_duration) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SHORT_DURATION_WARNING',
        message:
          'This school year spans less than 10 months. Are you sure you want to proceed?',
      });
    }

    // Keep the name in sync with the dates whenever either changes, unless an
    // explicit name override was sent. This mirrors create()'s auto-naming so
    // editing dates never leaves a stale "SY 2025-2026" label behind.
    const name =
      dto.name?.trim() ||
      (startChanged || endChanged
        ? this.deriveSchoolYearName(effectiveStart, effectiveEnd)
        : schoolYear.name);

    const updated = await this.schoolYearRepository.update(id, {
      name,
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
        metadata: { name },
      })
      .catch(() => {});

    return updated;
  }

  async activate(id: string, orgId: string, actorId: string) {
    await this.expireIfNeeded();
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
    await this.expireIfNeeded();
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
    await this.expireIfNeeded();
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