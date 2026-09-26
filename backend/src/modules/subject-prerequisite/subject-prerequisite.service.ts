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
    scaleCache?: Map<
      string,
      Awaited<ReturnType<GradingScaleRepository['findByClassId']>>
    >,
  ): Promise<boolean> {
    const classId = (grade.class as unknown as { id: string }).id;
    // Perf Phase 5: per-request memoization — repeated prereq checks in one
    // request share one scale lookup per class. Failures are never cached
    // (same retry-then-fallback behavior as before).
    let scale: Awaited<ReturnType<GradingScaleRepository['findByClassId']>>;
    if (scaleCache?.has(classId)) {
      // has() guard above narrows away the Map.get() undefined case.
      scale = scaleCache.get(classId) as Awaited<
        ReturnType<GradingScaleRepository['findByClassId']>
      >;
    } else {
      try {
        scale = await this.gradingScaleRepository.findByClassId(
          classId,
          orgId,
        );
      } catch {
        // fall through to fallback
        return grade.final_score >= FALLBACK_PASSING_SCORE;
      }
      scaleCache?.set(classId, scale);
    }
    try {
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
    // Single-subject path delegates to the batch implementation so there is
    // exactly one decision code path. Existing callers are unaffected.
    const results = await this.checkEligibilityBatch(
      [subject_id],
      student_id,
      org_id,
    );
    return (
      results.get(subject_id) ?? { eligible: true, missing: [] }
    );
  }

  /**
   * Batched eligibility for many subjects (Perf Phase 5): 2 row queries +
   * memoized scale lookups for the whole batch instead of ~2+P×2 queries per
   * subject. Decision rules are identical to the former single path.
   */
  async checkEligibilityBatch(
    subject_ids: string[],
    student_id: string,
    org_id: string,
    scaleCache?: Map<
      string,
      Awaited<ReturnType<GradingScaleRepository['findByClassId']>>
    >,
  ): Promise<Map<string, PrerequisiteCheckResultDto>> {
    const uniqueIds = [...new Set(subject_ids)];
    const cache =
      scaleCache ??
      new Map<
        string,
        Awaited<ReturnType<GradingScaleRepository['findByClassId']>>
      >();

    const rowsBySubject =
      await this.prereqRepository.getPrerequisitesWithGradesForSubjects(
        uniqueIds,
        student_id,
        org_id,
      );

    // Fallback (mirrors the single path): subjects with zero grade-enriched
    // rows but defined prerequisite links resolve to all-not-taken rows.
    const emptySubjects = uniqueIds.filter(
      (id) => (rowsBySubject.get(id) ?? []).length === 0,
    );
    if (emptySubjects.length > 0) {
      const defined =
        await this.prereqRepository.findBySubjects(emptySubjects, org_id);
      const definedBySubject = new Map<string, typeof defined>();
      for (const d of defined) {
        const list = definedBySubject.get(d.subject_id);
        if (list) list.push(d);
        else definedBySubject.set(d.subject_id, [d]);
      }
      for (const id of emptySubjects) {
        const links = definedBySubject.get(id) ?? [];
        if (links.length > 0) {
          rowsBySubject.set(
            id,
            links.map((d) => ({
              subject_id: d.prerequisite_id,
              subject_name:
                (d as unknown as { prerequisite: { name: string } })
                  ?.prerequisite?.name ?? d.prerequisite_id,
              grade: null,
            })),
          );
        }
      }
    }

    const results = new Map<string, PrerequisiteCheckResultDto>();
    for (const id of uniqueIds) {
      const rows = rowsBySubject.get(id) ?? [];
      if (rows.length === 0) {
        results.set(id, { eligible: true, missing: [] });
        continue;
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

        const grade = row.grade as unknown as {
          final_score: number;
          is_locked: boolean;
          class: { id: string };
        };
        if (!grade.is_locked) {
          missing.push({
            subject_id: row.subject_id,
            subject_name: row.subject_name,
            reason: 'not_locked',
          });
          continue;
        }

        const passed = await this.isGradePassing(
          grade as unknown as { final_score: number; class: { id: string } },
          org_id,
          cache,
        );
        if (!passed) {
          missing.push({
            subject_id: row.subject_id,
            subject_name: row.subject_name,
            reason: 'not_passed',
          });
        }
      }

      results.set(id, {
        eligible: missing.length === 0,
        missing,
      });
    }

    return results;
  }
}
