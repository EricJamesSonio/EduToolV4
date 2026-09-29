import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'; // ✅ added semicolon
import { violatesLowerLevelRule } from './subject-prerequisite.utils';

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
        await this.assertPrerequisitesAreLowerLevel(orgId, dto.subject_id, [
      dto.prerequisite_id,
    ]);

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
        const existingLinks = await this.prereqRepository.findBySubject(
      dto.subject_id,
      orgId,
    );
    const existingIds = new Set(existingLinks.map((l) => l.prerequisite_id));
    await this.assertPrerequisitesAreLowerLevel(
      orgId,
      dto.subject_id,
      dto.prerequisite_ids.filter((id) => !existingIds.has(id)),
    );

    return this.prereqRepository.bulkCreate(
      orgId,
      dto.subject_id,
      dto.prerequisite_ids,
    );
  }
    /**
   * A prerequisite must come from a strictly LOWER year level than the
   * subject. Same-year and higher-year subjects are rejected.
   */
  private async assertPrerequisitesAreLowerLevel(
    orgId: string,
    subjectId: string,
    prerequisiteIds: string[],
  ) {
    if (prerequisiteIds.length === 0) return;

    const rows = await this.prereqRepository.findSubjectsForLevelCheck(orgId, [
      subjectId,
      ...prerequisiteIds,
    ]);
    const byId = new Map(rows.map((r) => [r.id, r]));

    const subject = byId.get(subjectId);
    if (!subject) throw new NotFoundException('Subject not found');

    const info = (r: (typeof rows)[number]) => ({
      level: r.level?.name ?? r.year_level ?? null,
      program: r.program?.type ?? null,
    });

    for (const id of prerequisiteIds) {
      const prereq = byId.get(id);
      if (!prereq) throw new NotFoundException('Prerequisite subject not found');

      if (violatesLowerLevelRule(info(prereq), info(subject))) {
        throw new BadRequestException(
          `"${prereq.name}" (${info(prereq).level}) can't be a prerequisite of ` +
            `"${subject.name}" (${info(subject).level}). ` +
            `A prerequisite must be from a lower year level.`,
        );
      }
    }
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

    // Manual completion credits (transferee / pre-system records) satisfy
    // prerequisites without a Grade row.
    let completedOverrideIds = new Set<string>();
    try {
      const delegate = (this.db as unknown as Record<string, unknown>)[
        'subjectCompletionOverride'
      ] as
        | { findMany: (args: unknown) => Promise<{ subject_id: string }[]> }
        | undefined;
      if (delegate) {
        const rows = await delegate.findMany({
          where: { org_id, student_id, status: 'completed' },
          select: { subject_id: true },
        });
        completedOverrideIds = new Set(rows.map((r) => r.subject_id));
      }
    } catch {
      completedOverrideIds = new Set<string>();
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
        if (completedOverrideIds.has(row.subject_id)) continue;
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

  /**
   * Batched eligibility for MANY students against ONE subject (transposed
   * relative to checkEligibilityBatch). Backs the admin enrollment surfaces,
   * which render a list of students for a single class and need to know which
   * of them the enroll gate would reject.
   *
   * Decision rules are identical to checkEligibilityBatch, including manual
   * SubjectCompletionOverride credits — a transferee with a completion credit
   * must NOT be reported as blocked, or the UI would contradict the gate.
   *
   * Students absent from the returned map are eligible (no prerequisite links,
   * or every prerequisite satisfied).
   */
  async checkEligibilityForStudentsBatch(
    subject_id: string,
    student_ids: string[],
    org_id: string,
  ): Promise<Map<string, PrerequisiteCheckResultDto>> {
    const results = new Map<string, PrerequisiteCheckResultDto>();
    const uniqueStudents = [...new Set(student_ids)];
    if (uniqueStudents.length === 0) return results;

    const rowsByStudent =
      await this.prereqRepository.getPrerequisitesWithGradesForStudents(
        subject_id,
        uniqueStudents,
        org_id,
      );

    // No prerequisite links defined for this subject — everyone is eligible.
    if (rowsByStudent.size === 0) {
      for (const studentId of uniqueStudents) {
        results.set(studentId, { eligible: true, missing: [] });
      }
      return results;
    }

    // Manual completion credits (transferee / pre-system records) satisfy
    // prerequisites without a Grade row. Fetched for the whole batch in one
    // query and keyed by student so the per-student credit set is a lookup.
    const completedByStudent = new Map<string, Set<string>>();
    try {
      const delegate = (this.db as unknown as Record<string, unknown>)[
        'subjectCompletionOverride'
      ] as
        | { findMany: (args: unknown) => Promise<{ student_id: string; subject_id: string }[]> }
        | undefined;
      if (delegate) {
        const rows = await delegate.findMany({
          where: {
            org_id,
            student_id: { in: uniqueStudents },
            status: 'completed',
          },
          select: { student_id: true, subject_id: true },
        });
        for (const r of rows) {
          const set = completedByStudent.get(r.student_id) ?? new Set<string>();
          set.add(r.subject_id);
          completedByStudent.set(r.student_id, set);
        }
      }
    } catch {
      // Fall through with no credits — matches the single-student path, which
      // also swallows this lookup and falls back to a clean set.
      completedByStudent.clear();
    }

    // One shared scale cache for the whole batch (was: one lookup per
    // grade row). Memoization only; failures are never cached.
    const cache = new Map<
      string,
      Awaited<ReturnType<GradingScaleRepository['findByClassId']>>
    >();

    for (const studentId of uniqueStudents) {
      const rows = rowsByStudent.get(studentId) ?? [];
      const overrides = completedByStudent.get(studentId);
      const missing: PrerequisiteCheckResultDto['missing'] = [];

      for (const row of rows) {
        if (overrides?.has(row.subject_id)) continue;

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

        const passed = await this.isGradePassing(grade, org_id, cache);
        if (!passed) {
          missing.push({
            subject_id: row.subject_id,
            subject_name: row.subject_name,
            reason: 'not_passed',
          });
        }
      }

      results.set(studentId, {
        eligible: missing.length === 0,
        missing,
      });
    }

    return results;
  }}
