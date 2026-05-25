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
import {
  GradingScaleEntity,
  GradeRangeEntity,
} from './entity/grading-scale.entity';

@Injectable()
export class GradingScaleService {
  constructor(
    private readonly gradingScaleRepository: GradingScaleRepository,
  ) {}

  private mapToEntity(scale: Record<string, unknown>): GradingScaleEntity {
    return {
      id: scale.id as string,
      orgId: scale.org_id as string,
      programId: scale.program_id as string,
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

      if (curr.minPercent <= prev.maxPercent) {
        throw new BadRequestException(
          `Ranges "${prev.gradeValue}" and "${curr.gradeValue}" overlap.`,
        );
      }

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

  async delete(id: string, orgId: string): Promise<void> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    if (scale.is_locked) {
      throw new BadRequestException(
        'This grading scale is locked and cannot be deleted.',
      );
    }

    const isUsed = await this.gradingScaleRepository.isUsedInGrades(
      orgId,
      scale.program_id,
      scale.school_year_id,
    );

    if (isUsed) {
      throw new BadRequestException(
        'Cannot delete grading scale because grades already exist for this program and school year.',
      );
    }

    await this.gradingScaleRepository.delete(id);
  }

  async create(
    orgId: string,
    dto: CreateGradingScaleDto,
  ): Promise<GradingScaleEntity> {
    const existing = await this.gradingScaleRepository.findByProgramAndYear(
      orgId,
      dto.programId,
      dto.schoolYearId,
    );

    if (existing) {
      throw new ConflictException(
        'A grading scale already exists for this program and school year.',
      );
    }

    this.validateRanges(dto.ranges);

    const scale = await this.gradingScaleRepository.create({
      orgId,
      programId: dto.programId,
      schoolYearId: dto.schoolYearId,
      name: dto.name,
      ranges: dto.ranges,
    });

    return this.mapToEntity(scale as Record<string, unknown>);
  }

  async findAll(
    orgId: string,
    query: QueryGradingScaleDto,
  ): Promise<GradingScaleEntity[]> {
    const scales = await this.gradingScaleRepository.findAll(
      orgId,
      query.programId,
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
      return this.mapToEntity(scale as Record<string, unknown>);
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
    programId: string,
    schoolYearId: string,
    percent: number,
  ): Promise<{
    gradeValue: string;
    remark: string;
    isPassing: boolean;
  } | null> {
    const scale = await this.gradingScaleRepository.findByProgramAndYear(
      orgId,
      programId,
      schoolYearId,
    );

    if (!scale) return null;

    const ranges = scale.ranges as unknown as GradeRangeDto[];
    const match = ranges.find(
      (r) => percent >= r.minPercent && percent <= r.maxPercent,
    );

    return match
      ? {
          gradeValue: match.gradeValue,
          remark: match.remark,
          isPassing: match.isPassing,
        }
      : null;
  }

  async unlockAllForSchoolYear(
    schoolYearId: string,
    orgId: string,
  ): Promise<void> {
    await this.gradingScaleRepository.unlockAllForSchoolYear(
      schoolYearId,
      orgId,
    );
  }

  /**
   * Assign an existing grading scale to a program
   *
   * Flow:
   * 1. Verify the scale exists and belongs to the org
   * 2. Verify the program exists
   * 3. Check if there's already a scale for this program in this school year
   * 4. If yes, throw error (must delete old one first)
   * 5. Assign the scale to the program
   */
  async assignToProgram(
    orgId: string,
    programId: string,
    scaleId: string,
  ): Promise<GradingScaleEntity> {
    // 1. Verify scale exists
    const scale = await this.gradingScaleRepository.findById(scaleId, orgId);
    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    const schoolYearId = scale.school_year_id;

    // 2. Verify program exists (basic check - you might want to query the program table)
    // This assumes the program exists. Adjust if needed.

    // 3. Check if there's already a scale for this program in this school year
    const existingScale =
      await this.gradingScaleRepository.findByProgramAndYear(
        orgId,
        programId,
        schoolYearId,
      );

    if (existingScale && existingScale.id !== scaleId) {
      throw new ConflictException(
        `Program already has a grading scale assigned for this school year. ` +
          `Delete or reassign the existing scale first.`,
      );
    }

    // If the scale is already assigned to this program, return it as-is
    if (existingScale && existingScale.id === scaleId) {
      return this.mapToEntity(existingScale as Record<string, unknown>);
    }

    // 4. Assign the scale
    const updated = await this.gradingScaleRepository.assignToProgram(
      scaleId,
      programId,
      schoolYearId,
    );

    return this.mapToEntity(updated as Record<string, unknown>);
  }

async findByClassId(
  classId: string,
  orgId:   string,
): Promise<GradingScaleEntity | null> {
  const scale = await this.gradingScaleRepository.findByClassId(classId, orgId);
  if (!scale) return null;
  return this.mapToEntity(scale as Record<string, unknown>);
}
 
}