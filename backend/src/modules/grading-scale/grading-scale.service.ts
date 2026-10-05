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
import { GradeEducatorService } from '@/modules/grade/educator/grade-educator.service';

@Injectable()
export class GradingScaleService {
  constructor(
    private readonly gradingScaleRepository: GradingScaleRepository,
    private readonly assignmentRepository: GradingScaleAssignmentRepository,
    private readonly db: DatabaseService,
    private readonly gradeRefresh: GradeEducatorService,
  ) {}

  private async refreshBestEffort(
    orgId: string,
    classId: string,
    actorId: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.gradeRefresh.refreshClassGrades(
        orgId,
        classId,
        actorId,
        reason,
      );
    } catch {
      // Grades refresh must never fail the scale save itself.
    }
  }

  /** Class ids under a program (direct + via course/strand/level subjects). */
  private async findClassIdsForProgram(
    orgId: string,
    programId: string,
    schoolYearId?: string,
  ): Promise<string[]> {
    const [courses, strands, levels] = await Promise.all([
      this.db.course.findMany({
        where: { org_id: orgId, program_id: programId, deleted_at: null },
        select: { id: true },
      }),
      this.db.strand.findMany({
        where: { org_id: orgId, program_id: programId, deleted_at: null },
        select: { id: true },
      }),
      this.db.level.findMany({
        where: { org_id: orgId, program_id: programId, deleted_at: null },
        select: { id: true },
      }),
    ]);
    const courseIds = courses.map((c) => c.id);
    const strandIds = strands.map((s) => s.id);
    const levelIds = levels.map((l) => l.id);
    const subjects = await this.db.subject.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
        OR: [
          { program_id: programId },
          ...(courseIds.length ? [{ course_id: { in: courseIds } }] : []),
          ...(strandIds.length ? [{ strand_id: { in: strandIds } }] : []),
          ...(levelIds.length ? [{ level_id: { in: levelIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const subjectIds = subjects.map((s) => s.id);
    if (subjectIds.length === 0) return [];
    const classes = await this.db.class.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
        subject_id: { in: subjectIds },
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      select: { id: true },
    });
    return classes.map((c) => c.id);
  }

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

    await this.gradingScaleRepository.invalidateScaleCache(orgId);

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
    actorId?: string,
  ): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    // Locks no longer block edits: admin may change ranges even after
    // grades exist / school year started. is_locked stays as audit only.

    if (dto.ranges) {
      this.validateRanges(dto.ranges);
    }

    const updated = await this.gradingScaleRepository.update(id, {
      name: dto.name,
      ranges: dto.ranges,
    });

    await this.gradingScaleRepository.invalidateScaleCache(orgId);

    if (dto.ranges && actorId) {
      const assignments =
        await this.assignmentRepository.findByScaleId(id);
      for (const a of assignments) {
        const classIds = await this.findClassIdsForProgram(
          orgId,
          (a as unknown as { program_id: string }).program_id,
          (a as unknown as { school_year_id: string }).school_year_id,
        );
        for (const classId of classIds) {
          await this.refreshBestEffort(
            orgId,
            classId,
            actorId,
            'grading_scale_updated',
          );
        }
      }
    }

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
    await this.gradingScaleRepository.invalidateScaleCache(orgId);
    return this.mapToEntity(locked);
  }

  async unlock(id: string, orgId: string): Promise<GradingScaleEntity> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    const unlocked = await this.gradingScaleRepository.unlock(id);
    await this.gradingScaleRepository.invalidateScaleCache(orgId);
    return this.mapToEntity(unlocked);
  }

  async delete(id: string, orgId: string): Promise<void> {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    // Locks and existing grades no longer block delete: admin may freely
    // replace scales even after the school year started.

    await this.gradingScaleRepository.delete(id);
    await this.gradingScaleRepository.invalidateScaleCache(orgId);
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
    actorId?: string,
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

    await this.gradingScaleRepository.invalidateScaleCache(orgId);

    if (actorId) {
      const classIds = await this.findClassIdsForProgram(
        orgId,
        programId,
        schoolYearId,
      );
      for (const classId of classIds) {
        await this.refreshBestEffort(
          orgId,
          classId,
          actorId,
          'grading_scale_assigned',
        );
      }
    }

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
    await this.gradingScaleRepository.invalidateScaleCache(orgId);
  }
}
