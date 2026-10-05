import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import type { PrismaClient } from '@prisma/client';

/**
 * Interactive-transaction client. Repository methods that must run inside
 * the bundle transaction take it as an optional last argument and default
 * to the shared client, so every non-transactional caller is untouched.
 */
export type PrismaTx = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export interface TeachableSubjectRow {
  id: string;
  name: string;
  programId: string | null;
  programName: string | null;
  programType: string | null;
  levelId: string | null;
  levelName: string | null;
  courseId: string | null;
  courseName: string | null;
  strandId: string | null;
  strandName: string | null;
  /** Sections this educator handles for the subject (assigned pairs). */
  sectionIds: string[];
  /** Weekly slot positions picked per section. */
  sectionSlots: SubjectSlotPick[];
}

export interface SubjectSectionAssignment {
  subjectId: string;
  sectionIds: string[];
}

export interface SubjectSlotPick {
  sectionId: string;
  /** 1-based weekly positions, e.g. [1, 2] of a 2x/week subject. */
  slots: number[];
}

export interface SubjectSlotAssignment {
  subjectId: string;
  sections: SubjectSlotPick[];
}

export interface SubjectSectionClaim {
  subjectId: string;
  sectionId: string;
  educatorId: string;
  educatorName: string | null;
  createdAt: Date;
}

/**
 * One educator's hold on one section: which weekly positions they handle.
 * `wholePair` marks legacy rows (section_ids with no slots JSON), which read
 * as holding every position so nothing silently unassigns.
 */
export interface SubjectSlotClaim {
  subjectId: string;
  sectionId: string;
  educatorId: string;
  educatorName: string | null;
  slots: number[];
  wholePair: boolean;
  createdAt: Date;
}

/** section_slots JSON shape, validated defensively on every read. */
export function parseSectionSlots(value: unknown): SubjectSlotPick[] {
  if (!Array.isArray(value)) return [];
  const out: SubjectSlotPick[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const { sectionId, slots } = entry as Record<string, unknown>;
    if (typeof sectionId !== 'string') continue;
    const clean = Array.isArray(slots)
      ? [...new Set(slots.filter((n) => Number.isInteger(n) && n > 0))]
      : [];
    out.push({ sectionId, slots: clean });
  }
  return out;
}

@Injectable()
export class EducatorSubjectRepository {
  constructor(private readonly db: DatabaseService) {}

  /** Subjects linked to one educator, with display context. */
  findByEducator(orgId: string, educatorId: string, tx?: PrismaTx) {
    const client = tx ?? this.db;
    return client.educatorSubject.findMany({
      where: { org_id: orgId, educator_id: educatorId },
      select: {
        section_ids: true,
        section_slots: true,
        subject: {
          select: {
            id: true,
            name: true,
            program_id: true,
            level_id: true,
            course_id: true,
            strand_id: true,
            program: { select: { name: true, type: true } },
            // Level/Course/Strand are soft-deleted, so an archived parent must
            // not surface as a live teaching option.
            level: { select: { name: true, deleted_at: true } },
            course: { select: { name: true, deleted_at: true } },
            strand: { select: { name: true, deleted_at: true } },
          },
        },
      },
      orderBy: { subject: { name: 'asc' } },
    });
  }

  /** Raw subject ids for one educator. Used by the eligibility assertions. */
  findSubjectIds(orgId: string, educatorId: string): Promise<string[]> {
    return this.db.educatorSubject
      .findMany({
        where: { org_id: orgId, educator_id: educatorId },
        select: { subject_id: true },
      })
      .then((rows) => rows.map((r) => r.subject_id));
  }

  /**
   * Replaces the educator's whole set in one transaction, so a partial set is
   * never observable. `skipDuplicates` makes this safe against a subject that
   * is already linked.
   *
   * Section assignments survive for retained subjects: deleting and
   * recreating the rows would otherwise wipe the per-subject section picks
   * every time the subject set is saved.
   */
  async replaceSet(
    orgId: string,
    educatorId: string,
    subjectIds: string[],
  ): Promise<number> {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.educatorSubject.findMany({
        where: { org_id: orgId, educator_id: educatorId },
        select: { subject_id: true, section_ids: true },
      });
      const sectionsBySubject = new Map(
        existing.map((r) => [r.subject_id, r.section_ids ?? []]),
      );
      await tx.educatorSubject.deleteMany({
        where: { org_id: orgId, educator_id: educatorId },
      });
      if (subjectIds.length === 0) return 0;
      const created = await tx.educatorSubject.createMany({
        data: subjectIds.map((subject_id) => ({
          org_id: orgId,
          educator_id: educatorId,
          subject_id,
          section_ids: sectionsBySubject.get(subject_id) ?? [],
        })),
        skipDuplicates: true,
      });
      return created.count;
    });
  }

  /** Adds links without clearing existing ones (carry-over). */
  addMany(
    orgId: string,
    educatorId: string,
    subjectIds: string[],
  ): Promise<{ count: number }> {
    return this.db.educatorSubject.createMany({
      data: subjectIds.map((subject_id) => ({
        org_id: orgId,
        educator_id: educatorId,
        subject_id,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Replaces the slot picks for the given subjects (one row per subject).
   * Every subject must already be linked to the educator — the caller
   * validates that, so a section can never dangle off an unlinked subject.
   * `section_ids` is derived as the sections with >= 1 pick, so the legacy
   * "handles" column can never drift from the slots JSON.
   */
  async setSlots(
    orgId: string,
    educatorId: string,
    assignments: SubjectSlotAssignment[],
  ): Promise<void> {
    if (assignments.length === 0) return;
    await this.db.$transaction(
      assignments.map((a) => {
        const clean = a.sections.map((s) => ({
          sectionId: s.sectionId,
          slots: [...new Set(s.slots)].sort((x, y) => x - y),
        }));
        return this.db.educatorSubject.updateMany({
          where: {
            org_id: orgId,
            educator_id: educatorId,
            subject_id: a.subjectId,
          },
          data: {
            section_ids: clean
              .filter((s) => s.slots.length > 0)
              .map((s) => s.sectionId),
            section_slots: clean,
          },
        });
      }),
    );
  }

  /**
   * Replaces the educator's whole link set AND their slot picks in one call,
   * for the atomic bundle write. Subjects in `rows` get rows (with slots or
   * empty); every other existing link is dropped — the same replacement
   * semantics as `replaceSet`. Must run inside the bundle transaction.
   */
  async replaceAllWithSlots(
    orgId: string,
    educatorId: string,
    rows: SubjectSlotAssignment[],
    tx: PrismaTx,
  ): Promise<void> {
    await tx.educatorSubject.deleteMany({
      where: { org_id: orgId, educator_id: educatorId },
    });
    if (rows.length === 0) return;
    await tx.educatorSubject.createMany({
      data: rows.map((a) => {
        const clean = a.sections.map((s) => ({
          sectionId: s.sectionId,
          slots: [...new Set(s.slots)].sort((x, y) => x - y),
        }));
        return {
          org_id: orgId,
          educator_id: educatorId,
          subject_id: a.subjectId,
          section_ids: clean
            .filter((s) => s.slots.length > 0)
            .map((s) => s.sectionId),
          section_slots: clean,
        };
      }),
      skipDuplicates: true,
    });
  }

  /**
   * Serializes concurrent bundle saves. One educator-level lock (same
   * educator saving twice cannot interleave delete/create) plus one lock per
   * touched pair in stable order (two educators claiming the same pair
   * cannot both pass the in-transaction holder re-check). Xact-scoped, so a
   * rollback or commit always releases them — no leak path.
   */
  async acquireBundleLocks(
    tx: PrismaTx,
    educatorId: string,
    pairs: Array<{ subjectId: string; sectionId: string }>,
  ): Promise<void> {
    const keys = [
      `educ-bundle:${educatorId}`,
      ...pairs
        .map((p) => `educ-pair:${p.subjectId}:${p.sectionId}`)
        .sort(),
    ];
    for (const key of keys) {
      await tx.$executeRawUnsafe(
        'SELECT pg_advisory_xact_lock(hashtext($1))',
        key,
      );
    }
  }

  /**
   * The other active educator holding one (subject, section) pair, if any.
   * One educator per pair is a hard rule: a second claim is rejected, not
   * warned. Legacy rows (section_ids with no slots entry) count as holding
   * the whole pair; an explicit empty pick counts as released.
   */
  async findSectionHolder(
    orgId: string,
    subjectId: string,
    sectionId: string,
    excludeEducatorId: string,
    tx?: PrismaTx,
  ): Promise<{ educatorId: string; educatorName: string | null } | null> {
    const rows = await (tx ?? this.db).educatorSubject.findMany({
      where: {
        org_id: orgId,
        subject_id: subjectId,
        educator_id: { not: excludeEducatorId },
        educator: {
          is: { role: 'educator', status: 'active', deleted_at: null },
        },
      },
      select: {
        educator_id: true,
        section_ids: true,
        section_slots: true,
        educator: { select: { profile: { select: { full_name: true } } } },
      },
    });
    for (const r of rows) {
      const entry = parseSectionSlots(r.section_slots).find(
        (s) => s.sectionId === sectionId,
      );
      const holds = entry
        ? entry.slots.length > 0
        : (r.section_ids ?? []).includes(sectionId);
      if (holds) {
        return {
          educatorId: r.educator_id,
          educatorName: r.educator?.profile?.full_name ?? null,
        };
      }
    }
    return null;
  }

  /**
   * Bulk lookup for the strict generator and coverage math: per subject,
   * every eligible (educator, section, slot picks) hold. ONE query for the
   * whole scope. Inactive educators are excluded; their links are retained
   * but never used. Legacy rows (no slots entry) read as whole-pair holds.
   */
  async getAssignmentsBySubject(
    orgId: string,
    subjectIds: string[],
  ): Promise<Map<string, SubjectSlotClaim[]>> {
    const out = new Map<string, SubjectSlotClaim[]>();
    if (subjectIds.length === 0) return out;
    const rows = await this.db.educatorSubject.findMany({
      where: {
        org_id: orgId,
        subject_id: { in: subjectIds },
        educator: {
          is: { role: 'educator', status: 'active', deleted_at: null },
        },
      },
      select: {
        subject_id: true,
        educator_id: true,
        section_ids: true,
        section_slots: true,
        created_at: true,
        educator: { select: { profile: { select: { full_name: true } } } },
      },
      orderBy: { created_at: 'asc' },
    });
    for (const r of rows) {
      const picks = parseSectionSlots(r.section_slots);
      const bySection = new Map<string, number[]>();
      for (const p of picks) bySection.set(p.sectionId, p.slots);
      for (const sectionId of r.section_ids ?? []) {
        if (!bySection.has(sectionId)) bySection.set(sectionId, []);
      }
      const list = out.get(r.subject_id) ?? [];
      for (const [sectionId, slots] of bySection) {
        const explicit = picks.some((p) => p.sectionId === sectionId);
        list.push({
          subjectId: r.subject_id,
          sectionId,
          educatorId: r.educator_id,
          educatorName: r.educator?.profile?.full_name ?? null,
          slots,
          wholePair: !explicit,
          createdAt: r.created_at,
        });
      }
      out.set(r.subject_id, list);
    }
    return out;
  }

  /**
   * Bulk lookup for the generator: which educators may teach each subject.
   * ONE query for the whole scope — the alternative is an N+1 per subject.
   *
   * Suspended/dropped/soft-deleted educators are excluded here so they can
   * never be auto-assigned, even though their links are retained.
   */
  async getEligibleEducatorsBySubject(
    orgId: string,
    subjectIds: string[],
  ): Promise<Map<string, string[]>> {
    const out = new Map<string, string[]>();
    if (subjectIds.length === 0) return out;

    const rows = await this.db.educatorSubject.findMany({
      where: {
        org_id: orgId,
        subject_id: { in: subjectIds },
        // Prisma 5 relation filters use the `is:` form for to-one relations.
        educator: {
          is: { role: 'educator', status: 'active', deleted_at: null },
        },
      },
      select: { subject_id: true, educator_id: true },
    });

    for (const r of rows) {
      const list = out.get(r.subject_id);
      if (list) list.push(r.educator_id);
      else out.set(r.subject_id, [r.educator_id]);
    }
    return out;
  }

  /**
   * Educators who can teach one subject. Used by manual class create.
   *
   * The public educator code (EDU-XXXX) lives in `Profile.metadata`, a JSON
   * blob, so it is read defensively rather than selected as a column.
   */
  findEducatorsForSubject(orgId: string, subjectId: string) {
    return this.db.educatorSubject.findMany({
      where: {
        org_id: orgId,
        subject_id: subjectId,
        educator: { is: { role: 'educator', deleted_at: null } },
      },
      select: {
        educator: {
          select: {
            id: true,
            status: true,
            profile: { select: { full_name: true, metadata: true } },
          },
        },
      },
    });
  }

  /** Confirms the educator is a live educator account in this org. */
  async assertEducator(orgId: string, educatorId: string): Promise<void> {
    const acc = await this.db.account.findFirst({
      where: { id: educatorId, org_id: orgId, role: 'educator', deleted_at: null },
      select: { id: true },
    });
    if (!acc) throw new NotFoundException('Educator not found.');
  }

  /**
   * Sections with their level binding, for validating that an assigned
   * section actually belongs to the subject's level.
   */
  async sectionsWithLevels(
    orgId: string,
    sectionIds: string[],
  ): Promise<Map<string, { levelId: string; name: string }>> {
    const out = new Map<string, { levelId: string; name: string }>();
    if (sectionIds.length === 0) return out;
    const rows = await this.db.section.findMany({
      where: { org_id: orgId, id: { in: sectionIds }, deleted_at: null },
      select: { id: true, name: true, level_id: true },
    });
    for (const r of rows) out.set(r.id, { levelId: r.level_id, name: r.name });
    return out;
  }

  /**
   * Subject context for validation and load math: level binding, program
   * type, and explicit session requirement (nulls = program default).
   */
  async subjectLevels(
    orgId: string,
    subjectIds: string[],
  ): Promise<
    Map<
      string,
      {
        levelId: string | null;
        name: string;
        programType: string | null;
        sessionsPerWeek: number | null;
        sessionMinutes: number | null;
        sessionDurations: number[];
      }
    >
  > {
    const out = new Map<
      string,
      {
        levelId: string | null;
        name: string;
        programType: string | null;
        sessionsPerWeek: number | null;
        sessionMinutes: number | null;
        sessionDurations: number[];
      }
    >();
    if (subjectIds.length === 0) return out;
    const rows = await this.db.subject.findMany({
      where: { org_id: orgId, deleted_at: null, id: { in: subjectIds } },
      select: {
        id: true,
        name: true,
        level_id: true,
        sessions_per_week: true,
        session_minutes: true,
        session_durations: true,
        program: { select: { type: true } },
      },
    });
    for (const r of rows)
      out.set(r.id, {
        levelId: r.level_id,
        name: r.name,
        programType: r.program?.type ?? null,
        sessionsPerWeek: r.sessions_per_week,
        sessionMinutes: r.session_minutes,
        sessionDurations: r.session_durations ?? [],
      });
    return out;
  }

  /**
   * Validates that every id is a Subject in this org. Returns the number of
   * distinct ids given, so the caller can detect duplicates itself.
   */
  async assertSubjectsInOrg(
    orgId: string,
    subjectIds: string[],
  ): Promise<void> {
    if (subjectIds.length === 0) return;
    const count = await this.db.subject.count({
      where: { org_id: orgId, id: { in: subjectIds } },
    });
    if (count !== new Set(subjectIds).size) {
      throw new NotFoundException(
        'One or more selected subjects do not exist in this organization.',
      );
    }
  }
}
