import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'; // ✅ added semicolon

import { DatabaseService } from '@/core/database/database.provider';
import { GradingScaleRepository } from '../grading-scale/grading-scale.repository';
import { SubjectPrerequisiteRepository } from './subject-prerequisite.repository';
import {
  CreatePrerequisiteDto,
  BulkCreatePrerequisiteDto,
  PrerequisiteCheckResultDto,
} from './dto/subject-prerequisite.dto';

// Fallback when no GradingScale assignment exists — matches legacy PASSING_SCORE.
// Prefer isPassing from GradingScale.ranges; this is only for subjects with no scale.
const FALLBACK_PASSING_SCORE = 75;

@Injectable()
export class SubjectPrerequisiteService {
  constructor(
    private readonly prereqRepository: SubjectPrerequisiteRepository,
    private readonly gradingScaleRepository: GradingScaleRepository,
    private readonly db: DatabaseService,
  ) {}

  async create(orgId: string, dto: CreatePrerequisiteDto) {
    if (dto.subject_id === dto.prerequisite_id) {
      throw new BadRequestException(
        'A subject cannot be a prerequisite of itself',
      );
    }

    const existing = await this.prereqRepository.findOne(
      dto.subject_id,
      dto.prerequisite_id,
      orgId,
    );

    if (existing) {
      throw new ConflictException('This prerequisite link already exists');
    }

    // Immediate-only cycle check: reject A->B if B->A already exists (consistent with immediate-only checking)
    const mutual = await this.prereqRepository.findOne(
      dto.prerequisite_id,
      dto.subject_id,
      orgId,
    );
    if (mutual) {
      throw new BadRequestException(
        'Immediate cycle detected: the prerequisite already requires this subject',
      );
    }

    return this.prereqRepository.create(orgId, dto);
  }

  async bulkCreate(orgId: string, dto: BulkCreatePrerequisiteDto) {
    if (dto.prerequisite_ids.includes(dto.subject_id)) {
      throw new BadRequestException(
        'A subject cannot be a prerequisite of itself',
      );
    }

    // Immediate-only cycle check for each requested prerequisite
    for (const prereqId of dto.prerequisite_ids) {
      const mutual = await this.prereqRepository.findOne(
        prereqId,
        dto.subject_id,
        orgId,
      );
      if (mutual) {
        throw new BadRequestException(
          `Immediate cycle detected: prerequisite ${prereqId} already requires ${dto.subject_id}`,
        );
      }
    }

    return this.prereqRepository.bulkCreate(
      orgId,
      dto.subject_id,
      dto.prerequisite_ids,
    );
  }

  async findBySubject(subject_id: string, org_id: string) {
    return this.prereqRepository.findBySubject(subject_id, org_id);
  }

  async remove(id: string, subject_id: string, org_id: string) {
    const existing = await this.prereqRepository.findOne(
      subject_id,
      id,
      org_id,
    );

    if (!existing) {
      throw new NotFoundException('Prerequisite link not found');
    }

    return this.prereqRepository.delete(existing.id);
  }

  private async isGradePassing(
    grade: { final_score: number; class: { id: string } },
    orgId: string,
  ): Promise<boolean> {
    const classId = (grade.class as unknown as { id: string }).id;
    try {
      const scale = await this.gradingScaleRepository.findByClassId(
        classId,
        orgId,
      );
      if (scale && (scale as unknown as { ranges: unknown }).ranges) {
        const ranges = (scale as unknown as { ranges: unknown[] }).ranges as Array<{
          minPercent: number;
          maxPercent: number;
          isPassing: boolean;
        }>;
        const rounded = Math.round(grade.final_score);
        const match = ranges.find(
          (r) => rounded >= r.minPercent && rounded <= r.maxPercent,
        );
        if (match) return !!match.isPassing;
      }
    } catch {
      // fall through to fallback
    }
    // Fallback when no scale or no matching range — legacy threshold
    return grade.final_score >= FALLBACK_PASSING_SCORE;
  }

  async checkEligibility(
    subject_id: string,
    student_id: string,
    org_id: string,
  ): Promise<PrerequisiteCheckResultDto> {
    let rows = await this.prereqRepository.getPrerequisitesWithGrades(
      subject_id,
      student_id,
      org_id,
    );

    if (rows.length === 0) {
      const defined = await this.prereqRepository.findBySubject(
        subject_id,
        org_id,
      );

      if (defined.length > 0) {
        rows = defined.map((d) => ({
          subject_id: d.prerequisite_id,
          subject_name: (d as unknown as { prerequisite: { name: string } })
            ?.prerequisite?.name ?? d.prerequisite_id,
          grade: null,
        }));
      }
    }

    if (rows.length === 0) {
      return { eligible: true, missing: [] };
    }

    const missing: PrerequisiteCheckResultDto['missing'] = [];

    for (const row of rows) {
      if (!row.grade) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_taken',
        });
        continue;
      }

      if (!row.grade.is_locked) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_locked',
        });
        continue;
      }

      const passed = await this.isGradePassing(
        row.grade as unknown as { final_score: number; class: { id: string } },
        org_id,
      );
      if (!passed) {
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_passed',
        });
      }
    }

    return {
      eligible: missing.length === 0,
      missing,
    };
  }
}
