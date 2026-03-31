// backend/src/modules/grading-scale/grading-scale.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { GradingScaleRepository } from './grading-scale.repository';
import {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
  GradeRangeDto,
} from './dto/grading-scale.dto';
import { GradingScaleEntity, GradeRangeEntity } from './entity/grading-scale.entity';

@Injectable()
export class GradingScaleService {
  constructor(private readonly gradingScaleRepository: GradingScaleRepository) {}

  // Maps raw Prisma snake_case record → camelCase entity
  private mapToEntity(scale: Record<string, unknown>): GradingScaleEntity {
    return {
      id: scale.id as string,
      orgId: scale.org_id as string,
      levelId: scale.level_id as string,
      schoolYearId: scale.school_year_id as string,
      name: scale.name as string,
      ranges: scale.ranges as GradeRangeEntity[],
      isLocked: scale.is_locked as boolean,
      lockedAt: (scale.locked_at as Date) ?? null,
      createdAt: scale.created_at as Date,
      updatedAt: scale.updated_at as Date,
    };
  }

  private validateRanges(ranges: GradeRangeDto[]): void {
    if (ranges.length === 0) {
      throw new BadRequestException('At least one grade range is required.');
    }

    for (const range of ranges) {
      if (range.minPercent >= range.maxPercent) {
        throw new BadRequestException(
          `Range "${range.gradeValue}": minPercent must be less than maxPercent.`,
        );
      }
    }

    const sorted = [...ranges].sort((a, b) => a.minPercent - b.minPercent);

    if (sorted[0].minPercent !== 0) {
      throw new BadRequestException(
        'Ranges must start at 0%. Current lowest range starts at ' +
          `${sorted[0].minPercent}%.`,
      );
    }

    if (sorted[sorted.length - 1].maxPercent !== 100) {
      throw new BadRequestException(
        'Ranges must end at 100%. Current highest range ends at ' +
          `${sorted[sorted.length - 1].maxPercent}%.`,
      );
    }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Overlap
    if (curr.minPercent <= prev.maxPercent) {
      throw new BadRequestException(
        `Ranges "${prev.gradeValue}" and "${curr.gradeValue}" overlap.`,
      );
    }

    // Gap (FIXED)
    if (curr.minPercent !== prev.maxPercent + 1) {
      throw new BadRequestException(
        `There is a gap between ranges "${prev.gradeValue}" ` +
        `(ends at ${prev.maxPercent}%) and "${curr.gradeValue}" ` +
        `(starts at ${curr.minPercent}%).`,
      );
    }
  }

    const hasPassingRange = ranges.some((r) => r.isPassing);
    if (!hasPassingRange) {
      throw new BadRequestException(
        'At least one range must be marked as passing.',
      );
    }
  }

  async create(orgId: string, dto: CreateGradingScaleDto): Promise<GradingScaleEntity> {
    const existing = await this.gradingScaleRepository.findByLevelAndYear(
      orgId,
      dto.levelId,
      dto.schoolYearId,
    );

    if (existing) {
      throw new ConflictException(
        'A grading scale already exists for this level and school year.',
      );
    }

    this.validateRanges(dto.ranges);

    const scale = await this.gradingScaleRepository.create({
      orgId,
      levelId: dto.levelId,
      schoolYearId: dto.schoolYearId,
      name: dto.name,
      ranges: dto.ranges,
    });

    return this.mapToEntity(scale as Record<string, unknown>);
  }

  async findAll(orgId: string, query: QueryGradingScaleDto): Promise<GradingScaleEntity[]> {
    const scales = await this.gradingScaleRepository.findAll(
      orgId,
      query.levelId,
      query.schoolYearId,
    );

    return scales.map((s) => this.mapToEntity(s as Record<string, unknown>));
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateGradingScaleDto,
  ): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    if (scale.is_locked) {
      throw new BadRequestException(
        'This grading scale is locked and cannot be modified. ' +
          'It will unlock at the start of the next school year.',
      );
    }

    if (dto.ranges) {
      this.validateRanges(dto.ranges);
    }

    const updated = await this.gradingScaleRepository.update(id, {
      name: dto.name,
      ranges: dto.ranges,
    });

    return this.mapToEntity(updated as Record<string, unknown>);
  }

  async lock(id: string, orgId: string): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    if (scale.is_locked) {
      return this.mapToEntity(scale as Record<string, unknown>); // idempotent
    }

    const locked = await this.gradingScaleRepository.lock(id);
    return this.mapToEntity(locked as Record<string, unknown>);
  }

  async unlock(id: string, orgId: string): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    const unlocked = await this.gradingScaleRepository.unlock(id);
    return this.mapToEntity(unlocked as Record<string, unknown>);
  }

  async resolveGrade(
    orgId: string,
    levelId: string,
    schoolYearId: string,
    percent: number,
  ): Promise<{ gradeValue: string; remark: string; isPassing: boolean } | null> {
    const scale = await this.gradingScaleRepository.findByLevelAndYear(
      orgId,
      levelId,
      schoolYearId,
    );

    if (!scale) return null;

    const ranges = scale.ranges as unknown as GradeRangeDto[];
    const match = ranges.find(
      (r) => percent >= r.minPercent && percent <= r.maxPercent,
    );

    return match
      ? { gradeValue: match.gradeValue, remark: match.remark, isPassing: match.isPassing }
      : null;
  }

  async unlockAllForSchoolYear(schoolYearId: string, orgId: string): Promise<void> {
    await this.gradingScaleRepository.unlockAllForSchoolYear(schoolYearId, orgId);
  }
}