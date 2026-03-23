// src/modules/grading-scale/grading-scale.service.ts
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

@Injectable()
export class GradingScaleService {
  constructor(private readonly gradingScaleRepository: GradingScaleRepository) {}

  // ── Range validation ────────────────────────────────────────────────────────

  /**
   * Validates that ranges:
   * 1. Cover 0–100 exactly with no gaps
   * 2. Have no overlapping boundaries
   * 3. Have at least one passing range
   */
  private validateRanges(ranges: GradeRangeDto[]): void {
    if (ranges.length === 0) {
      throw new BadRequestException('At least one grade range is required.');
    }

    // Check individual ranges
    for (const range of ranges) {
      if (range.minPercent >= range.maxPercent) {
        throw new BadRequestException(
          `Range "${range.gradeValue}": minPercent must be less than maxPercent.`,
        );
      }
    }

    // Sort by minPercent
    const sorted = [...ranges].sort((a, b) => a.minPercent - b.minPercent);

    // Must start at 0
    if (sorted[0].minPercent !== 0) {
      throw new BadRequestException(
        'Ranges must start at 0%. Current lowest range starts at ' +
          `${sorted[0].minPercent}%.`,
      );
    }

    // Must end at 100
    if (sorted[sorted.length - 1].maxPercent !== 100) {
      throw new BadRequestException(
        'Ranges must end at 100%. Current highest range ends at ' +
          `${sorted[sorted.length - 1].maxPercent}%.`,
      );
    }

    // Check for gaps and overlaps between consecutive ranges
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      if (curr.minPercent < prev.maxPercent) {
        throw new BadRequestException(
          `Ranges "${prev.gradeValue}" and "${curr.gradeValue}" overlap.`,
        );
      }

      if (curr.minPercent > prev.maxPercent) {
        throw new BadRequestException(
          `There is a gap between ranges "${prev.gradeValue}" ` +
            `(ends at ${prev.maxPercent}%) and "${curr.gradeValue}" ` +
            `(starts at ${curr.minPercent}%).`,
        );
      }
    }

    // Must have at least one passing range
    const hasPassingRange = ranges.some((r) => r.isPassing);
    if (!hasPassingRange) {
      throw new BadRequestException(
        'At least one range must be marked as passing.',
      );
    }
  }

  // ── POST /grading-scales ────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateGradingScaleDto) {
    // One scale per level per school year
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

    return this.gradingScaleRepository.create({
      orgId,
      levelId: dto.levelId,
      schoolYearId: dto.schoolYearId,
      name: dto.name,
      ranges: dto.ranges,
    });
  }

  // ── GET /grading-scales ─────────────────────────────────────────────────────

  async findAll(orgId: string, query: QueryGradingScaleDto) {
    return this.gradingScaleRepository.findAll(
      orgId,
      query.levelId,
      query.schoolYearId,
    );
  }

  // ── PATCH /grading-scales/:id ───────────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateGradingScaleDto) {
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

    return this.gradingScaleRepository.update(id, {
      name: dto.name,
      ranges: dto.ranges,
    });
  }

  // ── Utility (called by grade module in Phase 3) ─────────────────────────────

  /**
   * Locks the grading scale permanently for the current school year.
   * Triggered when the first grade is locked in this level section.
   */
  async lock(id: string, orgId: string) {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    if (scale.is_locked) return scale; // idempotent

    return this.gradingScaleRepository.lock(id);
  }

  /**
   * Unlocks the grading scale for a new school year.
   * Triggered at the start of each new school year.
   */
  async unlock(id: string, orgId: string) {
    const scale = await this.gradingScaleRepository.findById(id, orgId);

    if (!scale) {
      throw new NotFoundException('Grading scale not found.');
    }

    return this.gradingScaleRepository.unlock(id);
  }

  /**
   * Resolve the grade value and remark for a given percentage score.
   * Used by grade computation in Phase 3.
   */
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

    const ranges = scale.ranges as GradeRangeDto[];
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
}