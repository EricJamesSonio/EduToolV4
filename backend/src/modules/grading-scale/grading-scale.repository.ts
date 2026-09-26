import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  AppCacheService,
  APP_CACHE_TTL,
} from '@/core/cache/app-cache.service';

@Injectable()
export class GradingScaleRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly cache: AppCacheService,
  ) {}

  private scaleKey(orgId: string, classId: string): string {
    return this.cache.key('org', orgId, 'scale', 'class', classId);
  }

  /** Drop all cached class→scale resolutions for an org after any scale or
   * assignment write. Call from GradingScaleService mutators. */
  async invalidateScaleCache(orgId: string): Promise<void> {
    await this.cache.delByPrefix(this.cache.key('org', orgId, 'scale'));
  }

  async create(data: {
    orgId: string;
    name: string;
    programType: string;
    ranges: object;
  }) {
    return this.db.gradingScale.create({
      data: {
        org_id: data.orgId,
        name: data.name,
        program_type: data.programType,
        ranges: data.ranges,
        is_locked: false,
        locked_at: null,
      },
    });
  }

  async findAll(orgId: string, programType?: string) {
    return this.db.gradingScale.findMany({
      where: {
        org_id: orgId,
        ...(programType ? { program_type: programType } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.gradingScale.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async findByName(orgId: string, name: string) {
    return this.db.gradingScale.findFirst({
      where: { org_id: orgId, name },
    });
  }

  async update(id: string, data: { name?: string; ranges?: object }) {
    return this.db.gradingScale.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.ranges !== undefined ? { ranges: data.ranges } : {}),
      },
    });
  }

  async lock(id: string) {
    return this.db.gradingScale.update({
      where: { id },
      data: { is_locked: true, locked_at: new Date() },
    });
  }

  async unlock(id: string) {
    return this.db.gradingScale.update({
      where: { id },
      data: { is_locked: false, locked_at: null },
    });
  }

  async delete(id: string) {
    return this.db.gradingScale.delete({
      where: { id },
    });
  }

  async findByClassId(classId: string, orgId: string) {
    // Perf Phase 6: class→scale resolution is on the eligibility hot path
    // and changes rarely — 5-minute TTL. Nulls are never cached (see
    // AppCacheService), so newly-assigned scales resolve immediately.
    return this.cache.cached(
      this.scaleKey(orgId, classId),
      APP_CACHE_TTL.gradingScale,
      () => this.loadScaleByClassId(classId, orgId),
    );
  }

  private async loadScaleByClassId(classId: string, orgId: string) {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      select: {
        school_year_id: true,
        subject: { select: { program_id: true } },
      },
    });

    if (!cls || !cls.subject?.program_id) return null;

    const assignment = await this.db.gradingScaleAssignment.findFirst({
      where: {
        org_id: orgId,
        program_id: cls.subject.program_id,
        school_year_id: cls.school_year_id,
      },
      include: { grading_scale: true },
    });

    return assignment?.grading_scale ?? null;
  }

  /**
   * Batched variant of findByClassId (Perf Phase 5): resolves scales for many
   * classes with 2 queries (classes → assignments) instead of 2 per class.
   * Returns a Map keyed by class id; classes without a resolvable scale map
   * to null — the same outcome as the single path. Callers memoize this Map
   * for the duration of one request (never across requests: services are
   * singletons and scales are mutable).
   */
  async findByClassIds(
    classIds: string[],
    orgId: string,
  ): Promise<Map<string, Awaited<ReturnType<GradingScaleRepository['findByClassId']>>>> {
    const uniqueIds = [...new Set(classIds)];
    const result = new Map<
      string,
      Awaited<ReturnType<GradingScaleRepository['findByClassId']>>
    >();
    if (uniqueIds.length === 0) return result;

    const classes = await this.db.class.findMany({
      where: { id: { in: uniqueIds }, org_id: orgId, deleted_at: null },
      select: {
        id: true,
        school_year_id: true,
        subject: { select: { program_id: true } },
      },
    });

    const programIds = new Set<string>();
    const schoolYearIds = new Set<string>();
    const comboByClass = new Map<string, string>();
    for (const cls of classes) {
      const programId = cls.subject?.program_id ?? null;
      if (!programId) {
        result.set(cls.id, null);
        continue;
      }
      programIds.add(programId);
      schoolYearIds.add(cls.school_year_id);
      comboByClass.set(cls.id, `${programId}::${cls.school_year_id}`);
    }
    for (const id of uniqueIds) {
      if (!result.has(id) && !comboByClass.has(id)) result.set(id, null);
    }
    if (comboByClass.size === 0) return result;

    const assignments = await this.db.gradingScaleAssignment.findMany({
      where: {
        org_id: orgId,
        program_id: { in: [...programIds] },
        school_year_id: { in: [...schoolYearIds] },
      },
      include: { grading_scale: true },
    });
    const scaleByCombo = new Map<string, (typeof assignments)[number]['grading_scale']>();
    for (const assignment of assignments) {
      const key = `${assignment.program_id}::${assignment.school_year_id}`;
      if (!scaleByCombo.has(key)) scaleByCombo.set(key, assignment.grading_scale);
    }

    for (const [classId, combo] of comboByClass) {
      result.set(classId, scaleByCombo.get(combo) ?? null);
    }
    return result;
  }

  async isUsedInGrades(
    orgId: string,
    programId: string,
    schoolYearId: string,
  ): Promise<boolean> {
    const count = await this.db.grade.count({
      where: {
        org_id: orgId,
        class: {
          school_year_id: schoolYearId,
          subject: {
            program_id: programId,
          },
        },
      },
    });

    return count > 0;
  }
}
