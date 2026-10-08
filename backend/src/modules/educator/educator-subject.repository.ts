import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import type { PrismaClient } from '@prisma/client';
import {
  buildSubjectKey,
  type SubjectKeyParts,
} from './subject-key.util';

/**
 * Interactive-transaction client. Repository methods that must run inside
 * the bundle transaction take it as an optional last argument and default
 * to the shared client, so every non-transactional caller is untouched.
 */
export type PrismaTx = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export interface TeachableSubjectSection {
  sectionId: string;
  name: string;
  levelName: string | null;
  /** Weekly slot positions picked for this section ([] = legacy whole-pair hold). */
  slots: number[];
}

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
  /**
   * Server-resolved sections for the requested school year. Empty when the
   * caller did not scope to a year — a section id that cannot be resolved is
   * omitted here, never rendered as a truncated id on the client.
   */
  sections: TeachableSubjectSection[];
  /**
   * Global subject key. The row id is a year subject id in the year-scoped
   * view and the key itself in the global view — this field lets the client
   * match the two views (offered-in-year badge, Generated indicator).
   */
  subjectKey: string;
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

/**
 * Year-independent identity of one subject for the global teachable table,
 * plus the display context. `deletedAt` lets callers tell archived/pruned
 * subjects apart from live ones (pruning only fires when NO live subject
 * carries the key).
 */
export interface SubjectKeyInfo extends SubjectKeyParts {
  programId: string | null;
  /** Program display name for global rows (null when unknown). */
  programName: string | null;
  levelId: string | null;
  courseId: string | null;
  strandId: string | null;
  deletedAt: Date | null;
  /** The school year the subject belongs to, via its lineage. */
  schoolYearId: string | null;
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

  /**
   * Year-independent identity of subjects: normalized key parts with parent
   * ids and deletion state. Batched (subjects + parents in a few queries),
   * never one per subject. Subjects with no program lineage are SKIPPED (no
   * entry) — exactly like subjectsInYear skips them, so keys computed here
   * and keys computed for a year always agree.
   *
   * Archived parents render as no context rather than as a live one (same
   * rule as the teachable-row mapper). Deleted subjects are INCLUDED but
   * flagged, so pruning can tell "no live subject carries this key" apart
   * from "no subject at all".
   */
  async subjectKeyParts(
    orgId: string,
    subjectIds?: string[],
    tx?: PrismaTx,
  ): Promise<Map<string, SubjectKeyInfo>> {
    const out = new Map<string, SubjectKeyInfo>();
    const client: any = tx ?? this.db;
    const subjects = await client.subject.findMany({
      where: {
        org_id: orgId,
        ...(subjectIds ? { id: { in: subjectIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        program_id: true,
        level_id: true,
        course_id: true,
        strand_id: true,
        deleted_at: true,
      },
    });
    if (subjects.length === 0) return out;

    const levelIds = [...new Set(subjects.map((s: any) => s.level_id).filter(Boolean))];
    const courseIds = [...new Set(subjects.map((s: any) => s.course_id).filter(Boolean))];
    const strandIds = [...new Set(subjects.map((s: any) => s.strand_id).filter(Boolean))];
    const [levels, courses, strands] = await Promise.all([
      levelIds.length > 0
        ? client.level.findMany({
            where: { id: { in: levelIds } },
            select: {
              id: true,
              name: true,
              program_id: true,
              school_year_id: true,
              deleted_at: true,
            },
          })
        : [],
      courseIds.length > 0
        ? client.course.findMany({
            where: { id: { in: courseIds } },
            select: {
              id: true,
              name: true,
              program_id: true,
              school_year_id: true,
              deleted_at: true,
            },
          })
        : [],
      strandIds.length > 0
        ? client.strand.findMany({
            where: { id: { in: strandIds } },
            select: {
              id: true,
              name: true,
              program_id: true,
              school_year_id: true,
              deleted_at: true,
            },
          })
        : [],
    ]);
    const levelById = new Map<string, any>(
      levels.map((l: any): [string, any] => [l.id, l]),
    );
    const courseById = new Map<string, any>(
      courses.map((c: any): [string, any] => [c.id, c]),
    );
    const strandById = new Map<string, any>(
      strands.map((s: any): [string, any] => [s.id, s]),
    );
    const programIds = [
      ...new Set([
        ...subjects.map((s: any) => s.program_id).filter(Boolean),
        ...levels.map((l: any) => l.program_id).filter(Boolean),
        ...courses.map((c: any) => c.program_id).filter(Boolean),
        ...strands.map((s: any) => s.program_id).filter(Boolean),
      ]),
    ];
    const programs =
      programIds.length > 0
        ? await client.program.findMany({
            where: { id: { in: programIds } },
            select: { id: true, type: true, name: true, school_year_id: true },
          })
        : [];
    const programById = new Map<string, any>(
      programs.map((p: any): [string, any] => [p.id, p]),
    );
    const programTypeById = new Map<string, string>(
      programs.map((p: any): [string, string] => [p.id, p.type]),
    );
    const liveName = (row: any): string | null =>
      !row || row.deleted_at ? null : (row.name ?? null);

    for (const s of subjects) {
      const level = s.level_id ? levelById.get(s.level_id) : undefined;
      const course = s.course_id ? courseById.get(s.course_id) : undefined;
      const strand = s.strand_id ? strandById.get(s.strand_id) : undefined;
      const programId =
        s.program_id ??
        level?.program_id ??
        course?.program_id ??
        strand?.program_id ??
        null;
      if (!programId) continue;
      const programType = programTypeById.get(programId) ?? null;
      if (!programType) continue;
      out.set(s.id, {
        name: s.name,
        programType,
        levelName: liveName(level),
        courseName: liveName(course),
        strandName: liveName(strand),
        programId,
        programName: programById.get(programId)?.name ?? null,
        levelId: s.level_id,
        courseId: s.course_id,
        strandId: s.strand_id,
        deletedAt: s.deleted_at,
        schoolYearId:
          level?.school_year_id ??
          course?.school_year_id ??
          strand?.school_year_id ??
          programById.get(programId)?.school_year_id ??
          null,
      });
    }
    return out;
  }

  /** Global teachable keys held by one educator. */
  findGlobalKeys(orgId: string, educatorId: string, tx?: PrismaTx) {
    return (tx ?? this.db).educatorTeachableSubject.findMany({
      where: { org_id: orgId, educator_id: educatorId },
      select: {
        subject_key: true,
        display_name: true,
        program_type: true,
        level_name: true,
        course_name: true,
        strand_name: true,
      },
      orderBy: { display_name: 'asc' },
    });
  }

  /**
   * Educators holding any of the given global keys, with profile context.
   * ONE query for the whole key set. `activeOnly` mirrors the two existing
   * consumers: the generator excludes non-active educators, the manual
   * "who can teach" lookup keeps every non-deleted educator.
   */
  findGlobalEducatorsByKeys(
    orgId: string,
    keys: string[],
    opts?: { activeOnly?: boolean },
  ) {
    if (keys.length === 0) return Promise.resolve([]);
    return this.db.educatorTeachableSubject.findMany({
      where: {
        org_id: orgId,
        subject_key: { in: keys },
        educator: {
          is: {
            role: 'educator',
            deleted_at: null,
            ...(opts?.activeOnly ? { status: 'active' } : {}),
          },
        },
      },
      select: {
        subject_key: true,
        educator_id: true,
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

  /** Upserts global keys (first write wins on labels; keys are stable). */
  async upsertGlobalKeys(
    orgId: string,
    educatorId: string,
    entries: Array<{ key: string } & SubjectKeyParts & { displayName: string }>,
    tx: PrismaTx,
  ): Promise<void> {
    for (const e of entries) {
      await tx.educatorTeachableSubject.upsert({
        where: {
          org_id_educator_id_subject_key: {
            org_id: orgId,
            educator_id: educatorId,
            subject_key: e.key,
          },
        },
        update: {
          display_name: e.displayName,
          program_type: e.programType ?? '',
          level_name: e.levelName ?? '',
          course_name: e.courseName ?? '',
          strand_name: e.strandName ?? '',
        },
        create: {
          org_id: orgId,
          educator_id: educatorId,
          subject_key: e.key,
          display_name: e.displayName,
          program_type: e.programType ?? '',
          level_name: e.levelName ?? '',
          course_name: e.courseName ?? '',
          strand_name: e.strandName ?? '',
        },
      });
    }
  }

  /** Deletes global keys of one educator (untick semantics). */
  async deleteGlobalKeys(
    orgId: string,
    educatorId: string,
    keys: string[],
    tx: PrismaTx,
  ): Promise<void> {
    if (keys.length === 0) return;
    await tx.educatorTeachableSubject.deleteMany({
      where: { org_id: orgId, educator_id: educatorId, subject_key: { in: keys } },
    });
  }

  /**
   * Deletes global keys across ALL educators (orphan pruning on subject
   * hard-delete). The caller verifies no live subject carries the key first.
   */
  async deleteGlobalKeysByKey(
    orgId: string,
    keys: string[],
    tx: PrismaTx,
  ): Promise<void> {
    if (keys.length === 0) return;
    await tx.educatorTeachableSubject.deleteMany({
      where: { org_id: orgId, subject_key: { in: keys } },
    });
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

  /**
   * Replaces the slot picks for the given subjects (one row per subject).
   * Every subject must already be linked to the educator — the caller
   * validates that, so a section can never dangle off an unlinked subject.
   * `section_ids` is derived as the sections with >= 1 pick, so the legacy
   * "handles" column can never drift from the slots JSON. Upsert: picks are
   * created when they are saved, so a key with no picks row yet gets one.
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
        const data = {
          section_ids: clean
            .filter((s) => s.slots.length > 0)
            .map((s) => s.sectionId),
          section_slots: clean,
        };
        return this.db.educatorSubject.upsert({
          where: {
            educator_id_subject_id: {
              educator_id: educatorId,
              subject_id: a.subjectId,
            },
          },
          update: { ...data, org_id: orgId },
          create: {
            org_id: orgId,
            educator_id: educatorId,
            subject_id: a.subjectId,
            ...data,
          },
        });
      }),
    );
  }

  /**
   * Replaces the educator's slot picks for ONE school year's subjects, for
   * the atomic bundle write. Subjects in `rows` get rows (with slots or
   * empty); every other link OF THAT YEAR is dropped — other years are
   * untouched, because eligibility is global now and picks are per year.
   * Must run inside the bundle transaction.
   */
  async replaceYearPicks(
    orgId: string,
    educatorId: string,
    yearSubjectIds: string[],
    rows: SubjectSlotAssignment[],
    tx: PrismaTx,
  ): Promise<void> {
    await tx.educatorSubject.deleteMany({
      where: {
        org_id: orgId,
        educator_id: educatorId,
        subject_id: { in: yearSubjectIds },
      },
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
   * ONE query for the whole scope (plus one batched key-part load) — the
   * alternative is an N+1 per subject.
   *
   * Eligibility is GLOBAL: each subject id resolves to its normalized key
   * and educators holding that key are eligible for every same-keyed subject
   * id in the year. Suspended/dropped/soft-deleted educators are excluded
   * here so they can never be auto-assigned, even though their links are
   * retained.
   */
  async getEligibleEducatorsBySubject(
    orgId: string,
    subjectIds: string[],
  ): Promise<Map<string, string[]>> {
    const out = new Map<string, string[]>();
    if (subjectIds.length === 0) return out;

    const parts = await this.subjectKeyParts(orgId, subjectIds);
    const keyById = new Map<string, string>();
    for (const id of subjectIds) {
      const p = parts.get(id);
      if (p) keyById.set(id, buildSubjectKey(p));
    }
    if (keyById.size === 0) return out;

    const rows = await this.findGlobalEducatorsByKeys(
      orgId,
      [...new Set(keyById.values())],
      { activeOnly: true },
    );
    const educatorsByKey = new Map<string, string[]>();
    for (const r of rows) {
      const list = educatorsByKey.get(r.subject_key) ?? [];
      list.push(r.educator_id);
      educatorsByKey.set(r.subject_key, list);
    }
    for (const [id, key] of keyById) {
      const list = educatorsByKey.get(key);
      if (list) out.set(id, list);
    }
    return out;
  }

  /**
   * Educators who can teach one subject. Used by manual class create.
   *
   * Resolved through the global key: any educator holding the subject's key
   * can teach it, in any year the subject exists.
   *
   * The public educator code (EDU-XXXX) lives in `Profile.metadata`, a JSON
   * blob, so it is read defensively rather than selected as a column.
   */
  async findEducatorsForSubject(orgId: string, subjectId: string) {
    const parts = await this.subjectKeyParts(orgId, [subjectId]);
    const p = parts.get(subjectId);
    if (!p) return [];
    const rows = await this.findGlobalEducatorsByKeys(orgId, [
      buildSubjectKey(p),
    ]);
    return rows.map((r) => ({
      educator: {
        id: r.educator.id,
        status: r.educator.status,
        profile: r.educator.profile,
      },
    }));
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
   * Sections by id across ALL school years, with level names. Unlike the
   * year-scoped resolution, soft-deleted rows are INCLUDED (their names are
   * still displayable) — only physically-missing ids are absent from the
   * map, so the global subjects tab never loses a section to year scoping.
   * Batched: one sections query plus one levels query, never one per row.
   */
  async sectionsByIds(
    orgId: string,
    sectionIds: string[],
  ): Promise<Map<string, { name: string; levelName: string | null }>> {
    const out = new Map<string, { name: string; levelName: string | null }>();
    const unique = [...new Set(sectionIds)];
    if (unique.length === 0) return out;
    const sections = await this.db.section.findMany({
      where: { org_id: orgId, id: { in: unique } },
      select: { id: true, name: true, level_id: true },
    });
    const levelIds = [...new Set(sections.map((s) => s.level_id))];
    const levels =
      levelIds.length > 0
        ? await this.db.level.findMany({
            where: { id: { in: levelIds } },
            select: { id: true, name: true, deleted_at: true },
          })
        : [];
    const levelById = new Map(levels.map((l) => [l.id, l]));
    for (const s of sections) {
      const level = levelById.get(s.level_id);
      out.set(s.id, {
        name: s.name,
        levelName: !level || level.deleted_at ? null : (level.name ?? null),
      });
    }
    return out;
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
