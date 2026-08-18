import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { GradingScaleRepository } from './grading-scale.repository';
import { GradingScaleAssignmentRepository } from './grading-scale-assignment.repository';
import {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
  GradeRangeDto,
} from './dto/grading-scale.dto';
import {
  GradingScaleEntity,
  GradeRangeEntity,
  GradingScaleAssignmentEntity,
} from './entity/grading-scale.entity';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradingScaleService {
  constructor(
    private readonly gradingScaleRepository: GradingScaleRepository,
    private readonly assignmentRepository: GradingScaleAssignmentRepository,
    private readonly db: DatabaseService,
  ) {}

  private mapToEntity(scale: Record<string, unknown>): GradingScaleEntity {
    return {
      id: scale.id as string,
      orgId: scale.org_id as string,
      name: scale.name as string,
      programType: scale.program_type as string,
      ranges: scale.ranges as GradeRangeEntity[],
      isLocked: scale.is_locked as boolean,
      lockedAt: (scale.locked_at as Date) ?? null,
      createdAt: scale.created_at as Date,
      updatedAt: scale.updated_at as Date,
    };
  }

  private mapAssignmentToEntity(
    assignment: Record<string, unknown>,
  ): GradingScaleAssignmentEntity {
    return {
      id: assignment.id as string,
      orgId: assignment.org_id as string,
      gradingScaleId: assignment.grading_scale_id as string,
      programId: assignment.program_id as string,
      schoolYearId: assignment.school_year_id as string,
      createdAt: assignment.created_at as Date,
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

  async create(
    orgId: string,
    dto: CreateGradingScaleDto,
  ): Promise<GradingScaleEntity> {
    const existing = await this.gradingScaleRepository.findByName(
      orgId,
      dto.name,
    );

    if (existing) {
      throw new ConflictException(
        'A grading scale with this name already exists.',
      );
    }

    this.validateRanges(dto.ranges);

    const scale = await this.gradingScaleRepository.create({
      orgId,
      name: dto.name,
      programType: dto.programType,
      ranges: dto.ranges,
    });

    return this.mapToEntity(scale);
  }

  async findAll(
    orgId: string,
    query: QueryGradingScaleDto,
  ): Promise<GradingScaleEntity[]> {
    const scales = await this.gradingScaleRepository.findAll(
      orgId,
      query.programType,
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
        'This grading scale is locked and cannot be modified.',
      );
    }

    if (dto.ranges) {
      this.validateRanges(dto.ranges);
    }

    const updated = await this.gradingScaleRepository.update(id, {
      name: dto.name,
      ranges: dto.ranges,
    });

    return this.mapToEntity(updated);
  }

  async lock(id: string, orgId: string): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    if (scale.is_locked) {
      return this.mapToEntity(scale);
    }

    const locked = await this.gradingScaleRepository.lock(id);
    return this.mapToEntity(locked);
  }

  async unlock(id: string, orgId: string): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    const unlocked = await this.gradingScaleRepository.unlock(id);
    return this.mapToEntity(unlocked);
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

    const assignments = await this.assignmentRepository.findByScaleId(id);

    for (const a of assignments) {
      const isUsed = await this.gradingScaleRepository.isUsedInGrades(
        orgId,
        a.program_id,
        a.school_year_id,
      );

      if (isUsed) {
        throw new BadRequestException(
          'Cannot delete grading scale because grades already exist for a ' +
            'program and school year using this scale.',
        );
      }
    }

    await this.gradingScaleRepository.delete(id);
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
    const assignment = await this.assignmentRepository.findByProgramAndYear(
      orgId,
      programId,
      schoolYearId,
    );

    if (!assignment || !assignment.grading_scale) return null;

    const ranges = assignment.grading_scale
      .ranges as unknown as GradeRangeDto[];
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

  async findByClassId(
    classId: string,
    orgId: string,
  ): Promise<GradingScaleEntity | null> {
    const scale = await this.gradingScaleRepository.findByClassId(
      classId,
      orgId,
    );
    if (!scale) return null;
    return this.mapToEntity(scale);
  }

  async assignToProgram(
    orgId: string,
    programId: string,
    scaleId: string,
    schoolYearId: string,
  ): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(scaleId, orgId);
    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    const program = await this.db.program.findFirst({
      where: { id: programId, org_id: orgId },
    });

    if (!program) {
      throw new NotFoundException('Program not found.');
    }

    if (program.type !== scale.program_type) {
      throw new BadRequestException(
        `Cannot assign a "${scale.program_type}" grading scale to a ` +
          `"${program.type}" program. The program type must match.`,
      );
    }

    await this.assignmentRepository.upsert(
      orgId,
      scaleId,
      programId,
      schoolYearId,
    );

    return this.mapToEntity(scale);
  }

  async getAssignments(orgId: string, schoolYearId: string) {
    const rows = await this.assignmentRepository.findBySchoolYear(
      orgId,
      schoolYearId,
    );
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      orgId: r.org_id,
      gradingScaleId: r.grading_scale_id,
      programId: r.program_id,
      schoolYearId: r.school_year_id,
      createdAt: r.created_at,
      grading_scale: r.grading_scale,
      program: r.program,
    }));
  }

  async removeAssignment(
    orgId: string,
    programId: string,
    schoolYearId: string,
  ): Promise<void> {
    await this.assignmentRepository.remove(orgId, programId, schoolYearId);
  }
}
