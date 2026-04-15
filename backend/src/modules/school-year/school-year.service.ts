// backend/src/modules/school-year/school-year.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SchoolYearRepository } from './school-year.repository';
import { LevelService } from '@/modules/level/level.service';
import { SubjectService } from '@/modules/subject/subject.service';
import { GradingScaleService } from '../grading-scale/grading-scale.service';
import {
  CreateSchoolYearDto,
  UpdateSchoolYearDto,
  SchoolYearCreateResult,
} from './dto/school-year.dto';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface CreateResult {
  data: Awaited<ReturnType<SchoolYearRepository['findById']>>;
  warning?: string;
}

@Injectable()
export class SchoolYearService {
  constructor(
    private readonly schoolYearRepository: SchoolYearRepository,
    private readonly levelService: LevelService,
    private readonly subjectService: SubjectService,
    private readonly gradingScaleService: GradingScaleService,
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
   * Returns true when both dates are provided and the span is less than 1 year.
   * The caller decides whether to abort or proceed based on confirm_short_duration.
   */
  private isShortDuration(start_date?: string, end_date?: string): boolean {
    if (!start_date || !end_date) return false;

    const start = new Date(start_date);
    const end = new Date(end_date);
    return end.getTime() - start.getTime() < ONE_YEAR_MS;
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(
    orgId: string,
    dto: CreateSchoolYearDto,
  ): Promise<SchoolYearCreateResult> {
    this.validateDateRange(dto.start_date, dto.end_date);
    this.validateNotInPast(dto.start_date, dto.end_date); // 👈 ADD THIS

    const short = this.isShortDuration(dto.start_date, dto.end_date);

    if (short && !dto.confirm_short_duration) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SHORT_DURATION_WARNING',
        message:
          'This school year does not span a full year. Are you sure you want to proceed?',
      });
    }

    const schoolYear = await this.schoolYearRepository.create({
      orgId,
      name: dto.name,
      start_date: dto.start_date,
      end_date: dto.end_date,
    });

    await this.levelService.seedFromDefaults(orgId, schoolYear.id, {});

    return {
      data: schoolYear,
      warning: short ? 'School year is shorter than one year.' : undefined,
    };
  }

  async findAll(orgId: string) {
    return this.schoolYearRepository.findAll(orgId);
  }

  async findById(id: string, orgId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) throw new NotFoundException('School year not found.');
    return schoolYear;
  }

  async findActive(orgId: string) {
    return this.schoolYearRepository.findActive(orgId);
  }

  async update(id: string, orgId: string, dto: UpdateSchoolYearDto) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId);
    if (!schoolYear) throw new NotFoundException('School year not found.');

    if (schoolYear.status === 'ended') {
      throw new BadRequestException(
        'Ended school years are archived and cannot be modified.',
      );
    }

    // Resolve effective dates for cross-field validation
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
          'This school year does not span a full year. Are you sure you want to proceed?',
      });
    }

    return this.schoolYearRepository.update(id, {
      name: dto.name,
      start_date: dto.start_date,
      end_date: dto.end_date,
    });
  }

async activate(id: string, orgId: string) {
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

  // 🔓 Reset locks for new active cycle
  await this.subjectService.unlockAllForOrg(orgId);

  return result;
}
  async end(id: string, orgId: string) {
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

    return this.schoolYearRepository.findById(id, orgId);
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
