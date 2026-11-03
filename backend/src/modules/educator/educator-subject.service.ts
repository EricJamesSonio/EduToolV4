import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  EducatorSubjectRepository,
  parseSectionSlots,
  type PrismaTx,
  type TeachableSubjectRow,
} from './educator-subject.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { resolveSessionRequirement } from '../subject/subject-session-defaults';
import { EducatorScheduleProfileService } from './educator-schedule-profile.service';
import { intersectWeekdays } from './educator-schedule-profile.repository';
// VALUE import (not `import type`): emitDecoratorMetadata needs the runtime
// token so Nest can inject it. Same pattern as the schedule-profile service.
import { OrgScheduleConfigProvider } from '../org-schedule-config/schedule-window.provider';
import { getFreeMinuteRanges } from '../org-schedule-config/schedule-window.util';
import { ClassOccupancyService } from '../class/class-occupancy.service';
import {
  buildSubjectKey,
  type SubjectKeyParts,
} from './subject-key.util';

/** 90 -> "1.5h". Capacity messages read in hours, not raw minutes. */
function formatHours(min: number): string {
  return `${(min / 60).toFixed(1)}h`;
}

/**
 * Reads the public educator code out of `Profile.metadata`.
 *
 * That code is stored in a JSON blob, so it must be read defensively: the
 * value may be absent, and Prisma types it as `JsonValue`, not `string`.
 */
function readEducatorCode(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const code = (metadata as Record<string, unknown>).educatorId;
  return typeof code === 'string' ? code : null;
}

interface CarrySubject {
  id: string;
  name: string;
  programType: string;
  levelName: string | null;
  courseName: string | null;
  strandName: string | null;
}

@Injectable()
export class EducatorSubjectService {
  constructor(
    private readonly repo: EducatorSubjectRepository,
    private readonly db: DatabaseService,
    private readonly auditLogService: AuditLogService,
    private readonly orgScheduleConfig: OrgScheduleConfigProvider,
    private readonly scheduleProfiles: EducatorScheduleProfileService,
    private readonly occupancy: ClassOccupancyService,
  ) {}

  private static map(rows: any[]): TeachableSubjectRow[] {
    return rows.map((r) => {
      const s = r.subject;
      const levelName = s.level?.deleted_at ? null : (s.level?.name ?? null);
      const courseName = s.course?.deleted_at
        ? null
        : (s.course?.name ?? null);
      const strandName = s.strand?.deleted_at
        ? null
        : (s.strand?.name ?? null);
      return {
        id: s.id,
        name: s.name,
        programId: s.program_id,
        programName: s.program?.name ?? null,
        programType: s.program?.type ?? null,
        levelId: s.level_id,
        // An archived parent renders as no context rather than as a live one.
        levelName,
        courseId: s.course_id,
        courseName,
        strandId: s.strand_id,
        strandName,
        sectionIds: Array.isArray(r.section_ids) ? [...r.section_ids] : [],
        sectionSlots: parseSectionSlots(r.section_slots),
        sections: [],
        subjectKey: buildSubjectKey({
          name: s.name,
          programType: s.program?.type ?? null,
          levelName,
          courseName,
          strandName,
        }),
      };
    });
  }

  private readonly logger = new Logger(EducatorSubjectService.name);

  /**
   * GET /educators/:id/subjects
   *
   * The Subjects tab is GLOBAL: without a year this returns one row per
   * teachable key — same rows, same count, same sections, same ordering no
   * matter which school year is selected. Sections are the UNION of the
   * educator's picks across all years (resolved org-wide, so nothing ever
   * disappears to year scoping); only physically-missing section rows are
   * omitted, never surfaced as ids.
   *
   * With a year this returns the year-scoped picks view instead (one row per
   * year subject with that year's picks) that seeds the modal, the remove
   * flow and the Generated indicator. The client matches the two views with
   * `subjectKey`.
   */
  async listForEducator(
    orgId: string,
    educatorId: string,
    schoolYearId?: string,
  ) {
    await this.repo.assertEducator(orgId, educatorId);
    if (!schoolYearId) return this.listGlobalForEducator(orgId, educatorId);

    const [keys, yearSubjects, yearSections] = await Promise.all([
      this.repo.findGlobalKeys(orgId, educatorId),
      this.subjectsInYear(orgId, schoolYearId),
      this.sectionsInYear(orgId, schoolYearId),
    ]);
    const keySet = new Set(keys.map((k) => k.subject_key));
    const matchedIds = [...yearSubjects.entries()]
      .filter(([, s]) => keySet.has(buildSubjectKey(s)))
      .map(([id]) => id);
    if (matchedIds.length === 0) return [];

    const matched = new Set(matchedIds);
    const picks = new Map(
      EducatorSubjectService.map(
        (await this.repo.findByEducator(orgId, educatorId)).filter((r) =>
          matched.has(r.subject.id),
        ),
      ).map((r) => [r.id, r]),
    );
    // Keys with picks rows render from the row; linked subjects without picks
    // yet render from the subject's display context (links-only state).
    const missingIds = matchedIds.filter((id) => !picks.has(id));
    const parts =
      missingIds.length > 0
        ? await this.repo.subjectKeyParts(orgId, missingIds)
        : new Map();
    const rows: TeachableSubjectRow[] = matchedIds.map(
      (id) =>
        picks.get(id) ?? {
          id,
          name: parts.get(id)?.name ?? yearSubjects.get(id)?.name ?? id,
          programId: parts.get(id)?.programId ?? null,
          programName: null,
          programType: parts.get(id)?.programType ?? null,
          levelId: parts.get(id)?.levelId ?? null,
          levelName: parts.get(id)?.levelName ?? null,
          courseId: parts.get(id)?.courseId ?? null,
          courseName: parts.get(id)?.courseName ?? null,
          strandId: parts.get(id)?.strandId ?? null,
          strandName: parts.get(id)?.strandName ?? null,
          sectionIds: [],
          sectionSlots: [],
          sections: [],
          subjectKey: buildSubjectKey(
            parts.get(id) ?? {
              name: yearSubjects.get(id)?.name ?? id,
              programType: yearSubjects.get(id)?.programType ?? null,
              levelName: yearSubjects.get(id)?.levelName ?? null,
              courseName: yearSubjects.get(id)?.courseName ?? null,
              strandName: yearSubjects.get(id)?.strandName ?? null,
            },
          ),
        },
    );
    const scoped = this.resolveSections(rows, yearSections);
    if (scoped.droppedSections > 0) {
      this.logger.warn(
        `listForEducator omitted ${scoped.droppedSections} unresolvable section(s) ` +
          `for educator ${educatorId} in school year ${schoolYearId}`,
      );
    }
    return scoped.rows.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Global Subjects-tab view: one row per teachable key, stable across every
   * selected year (same rows, same count, same sections, same ordering).
   *
   * Display context comes from a deterministic representative — the smallest
   * live subject id carrying the key — falling back to the key's stored
   * display fields when nothing live carries it (true orphans, pruned on the
   * next subject hard-delete). Sections are the UNION of the educator's picks
   * across all years: same name at two years renders once.
   */
  private async listGlobalForEducator(orgId: string, educatorId: string) {
    const [keys, pickRows, parts] = await Promise.all([
      this.repo.findGlobalKeys(orgId, educatorId),
      this.repo.findByEducator(orgId, educatorId),
      this.repo.subjectKeyParts(orgId),
    ]);
    if (keys.length === 0) return [];
    const keySet = new Set(keys.map((k) => k.subject_key));
    const storedByKey = new Map(keys.map((k) => [k.subject_key, k]));

    // Live subjects per key for the representative display context.
    const liveIdsByKey = new Map<string, string[]>();
    for (const [id, info] of parts) {
      if (info.deletedAt !== null) continue;
      const key = buildSubjectKey(info);
      if (!keySet.has(key)) continue;
      const list = liveIdsByKey.get(key) ?? [];
      list.push(id);
      liveIdsByKey.set(key, list);
    }

    // Picks section ids per key, across all years.
    const sectionIdsByKey = new Map<string, string[]>();
    for (const r of pickRows) {
      const info = parts.get(r.subject.id);
      if (!info) continue;
      const key = buildSubjectKey(info);
      if (!keySet.has(key)) continue;
      const list = sectionIdsByKey.get(key) ?? [];
      list.push(...(r.section_ids ?? []));
      sectionIdsByKey.set(key, list);
    }
    const sectionMap = await this.repo.sectionsByIds(
      orgId,
      [...sectionIdsByKey.values()].flat(),
    );

    const rows: TeachableSubjectRow[] = [];
    for (const key of [...keySet].sort()) {
      const repId = (liveIdsByKey.get(key) ?? []).sort()[0];
      const rep = repId !== undefined ? parts.get(repId) : undefined;
      const stored = storedByKey.get(key);
      const seen = new Set<string>();
      const sections: TeachableSubjectRow['sections'] = [];
      const sectionIds: string[] = [];
      const candidates = (sectionIdsByKey.get(key) ?? [])
        .map((sectionId) => ({ sectionId, info: sectionMap.get(sectionId) }))
        .filter(
          (c): c is { sectionId: string; info: { name: string; levelName: string | null } } =>
            !!c.info,
        )
        .sort(
          (a, b) =>
            a.info.name.localeCompare(b.info.name) ||
            (a.info.levelName ?? '').localeCompare(b.info.levelName ?? '') ||
            a.sectionId.localeCompare(b.sectionId),
        );
      for (const c of candidates) {
        const dedupe = `${c.info.name}|${c.info.levelName ?? ''}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        sectionIds.push(c.sectionId);
        sections.push({
          sectionId: c.sectionId,
          name: c.info.name,
          levelName: c.info.levelName,
          slots: [],
        });
      }
      rows.push({
        id: key,
        name: rep?.name ?? stored?.display_name ?? key,
        programId: rep?.programId ?? null,
        programName: rep?.programName ?? null,
        programType: rep?.programType ?? stored?.program_type ?? null,
        levelId: rep?.levelId ?? null,
        levelName: rep?.levelName ?? stored?.level_name ?? null,
        courseId: rep?.courseId ?? null,
        courseName: rep?.courseName ?? stored?.course_name ?? null,
        strandId: rep?.strandId ?? null,
        strandName: rep?.strandName ?? stored?.strand_name ?? null,
        sectionIds,
        sectionSlots: [],
        sections,
        subjectKey: key,
      });
    }
    return rows;
  }

  /**
   * Resolves each row's section ids against one year's sections, for the
   * year-scoped read. Unresolvable ids are omitted (counted for the log),
   * and slot picks pointing outside the year are dropped with them.
   */
  private resolveSections(
    rows: TeachableSubjectRow[],
    yearSections: Map<string, { name: string; levelName: string | null }>,
  ): { rows: TeachableSubjectRow[]; droppedSections: number } {
    let droppedSections = 0;
    const scoped: TeachableSubjectRow[] = [];
    for (const row of rows) {
      const slotsBySection = new Map(
        row.sectionSlots.map((s) => [s.sectionId, s.slots]),
      );
      const sections: TeachableSubjectRow['sections'] = [];
      for (const sectionId of row.sectionIds) {
        const info = yearSections.get(sectionId);
        if (!info) {
          droppedSections += 1;
          continue;
        }
        sections.push({
          sectionId,
          name: info.name,
          levelName: info.levelName,
          slots: slotsBySection.get(sectionId) ?? [],
        });
      }
      scoped.push({
        ...row,
        sectionIds: sections.map((s) => s.sectionId),
        sectionSlots: row.sectionSlots.filter((s) =>
          yearSections.has(s.sectionId),
        ),
        sections,
      });
    }
    return { rows: scoped, droppedSections };
  }

  /** Year subjects of one educator that are currently linked (by global key). */
  private async linkedSubjectIdsInYear(
    orgId: string,
    educatorId: string,
    yearSubjects: Map<string, CarrySubject>,
    tx?: PrismaTx,
  ): Promise<string[]> {
    const keySet = new Set(
      (await this.repo.findGlobalKeys(orgId, educatorId, tx)).map(
        (k) => k.subject_key,
      ),
    );
    return [...yearSubjects.entries()]
      .filter(([, s]) => keySet.has(buildSubjectKey(s)))
      .map(([id]) => id);
  }

  /**
   * PUT /educators/:id/subjects — replaces the GLOBAL teachable set.
   *
   * The given subject ids resolve to global keys (upserted); keys not in the
   * new set are deleted, along with picks rows whose subject's key was
   * removed — otherwise an unlinked subject would keep invisible picks that
   * resurrect if the key is ever re-added.
   */
  async replaceSet(
    orgId: string,
    educatorId: string,
    subjectIds: string[],
    actorId: string,
  ) {
    await this.repo.assertEducator(orgId, educatorId);

    const unique = [...new Set(subjectIds)];
    // Tenant isolation: every subject must belong to THIS org.
    await this.repo.assertSubjectsInOrg(orgId, unique);
    const parts = await this.repo.subjectKeyParts(orgId, unique);
    const unkeyable = unique.filter((id) => !parts.has(id));
    if (unkeyable.length > 0) {
      throw new BadRequestException(
        'One or more selected subjects cannot be matched to a school year lineage.',
      );
    }
    const newKeys = new Set(unique.map((id) => buildSubjectKey(parts.get(id)!)));

    await this.db.$transaction(async (tx) => {
      const prevKeys = new Set(
        (await this.repo.findGlobalKeys(orgId, educatorId, tx)).map(
          (k) => k.subject_key,
        ),
      );
      await this.repo.upsertGlobalKeys(
        orgId,
        educatorId,
        unique.map((id) => {
          const p = parts.get(id)!;
          return { key: buildSubjectKey(p), displayName: p.name, ...p };
        }),
        tx,
      );
      const removed = [...prevKeys].filter((k) => !newKeys.has(k));
      if (removed.length > 0) {
        await this.repo.deleteGlobalKeys(orgId, educatorId, removed, tx);
        const rows = await this.repo.findByEducator(orgId, educatorId, tx);
        const rowParts = await this.repo.subjectKeyParts(
          orgId,
          rows.map((r) => r.subject.id),
          tx,
        );
        const dropIds = rows
          .filter((r) => {
            const p = rowParts.get(r.subject.id);
            return !p || !newKeys.has(buildSubjectKey(p));
          })
          .map((r) => r.subject.id);
        if (dropIds.length > 0) {
          await tx.educatorSubject.deleteMany({
            where: {
              org_id: orgId,
              educator_id: educatorId,
              subject_id: { in: dropIds },
            },
          });
        }
      }
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subjects_replaced',
        entityType: 'educator',
        entityId: educatorId,
        metadata: { count: unique.length },
      })
      .catch(() => {});

    return { count: unique.length };
  }

  /**
   * PUT /educators/:id/subject-slots — replaces the weekly slot picks for the
   * given subjects. Validation lives in validateSlotAssignments (shared with
   * the bundle endpoint); the over-capacity throw stays here so this
   * endpoint's behavior is unchanged.
   */
  async setSlots(
    orgId: string,
    educatorId: string,
    schoolYearId: string,
    assignments: Array<{
      subjectId: string;
      sections: Array<{ sectionId: string; slots: number[] }>;
    }>,
    actorId: string,
  ) {
    const v = await this.validateSlotAssignments(
      orgId,
      educatorId,
      schoolYearId,
      assignments,
      { requireLinked: true },
    );

    // Capacity: proposed picks (plus this educator's other links in the year)
    // plus existing classes must fit the weekly capacity. Numbers, not vibes.
    const usedMin = v.proposedMin + v.otherMin + v.parts.existingMin;
    if (usedMin > v.parts.capacityMin) {
      throw new BadRequestException(
        `Over capacity: ${formatHours(usedMin)} of ${formatHours(v.parts.capacityMin)} weekly capacity ` +
          `(${formatHours(v.parts.existingMin)} existing classes + ${formatHours(v.proposedMin + v.otherMin)} picks).`,
      );
    }

    await this.repo.setSlots(orgId, educatorId, v.clean);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subject_slots_set',
        entityType: 'educator',
        entityId: educatorId,
        metadata: { count: v.clean.length, pickedMin: v.proposedMin },
      })
      .catch(() => {});

    return { updated: v.clean.length };
  }

  /**
   * PUT /educators/:id/subject-bundle — one atomic save for the teachable
   * modal: upserts the GLOBAL keys for the ticked subjects AND replaces the
   * slot picks for the given school year in a single transaction.
   *
   * Unticking a subject removes its GLOBAL link (it applies to all years),
   * so the modal warns when the subject is used by classes/slots in other
   * years. Picks of other years are never touched: only this year's subject
   * rows are replaced.
   *
   * Runs the union of the link-path and slot-path validations (the shared
   * validator below, plus the link membership rule), then locks, re-verifies
   * the concurrency-sensitive reads inside the transaction, and writes. Any
   * failure leaves both tables untouched.
   */
  async setBundle(
    orgId: string,
    educatorId: string,
    schoolYearId: string,
    subjectIds: string[],
    assignments: Array<{
      subjectId: string;
      sections: Array<{ sectionId: string; slots: number[] }>;
    }>,
    actorId: string,
  ) {
    const uniqueSubjects = [...new Set(subjectIds)];

    // Every assignment must name a listed subject — the bundle equivalent of
    // the slots endpoint's "tick the subject first" rule. Same message.
    const listed = new Set(uniqueSubjects);
    const unlisted = [...new Set(assignments.map((a) => a.subjectId))].filter(
      (id) => !listed.has(id),
    );
    if (unlisted.length > 0) {
      throw new BadRequestException(
        'Add the subject to teachable subjects before assigning slots to it.',
      );
    }

    // Link-path org check over the whole set (assignments are covered again
    // inside the shared validator; checking the union first matches the
    // two-call error precedence: bad link ids report before slot problems).
    await this.repo.assertEducator(orgId, educatorId);
    await this.repo.assertSubjectsInOrg(orgId, uniqueSubjects);

    const v = await this.validateSlotAssignments(
      orgId,
      educatorId,
      schoolYearId,
      assignments,
      { requireLinked: false },
    );

    // Ticked subjects must live in the saved year: their global key is
    // computed from the year's subject. (Assignments are year-checked inside
    // the shared validator; links-only ticks need the same rule here.)
    const outsideYear = uniqueSubjects.filter((id) => !v.yearSubjects.has(id));
    if (outsideYear.length > 0) {
      throw new BadRequestException(
        'One or more selected subjects do not belong to this school year.',
      );
    }

    const pairs = v.clean.flatMap((a) =>
      a.sections
        .filter((s) => s.slots.length > 0)
        .map((s) => ({ subjectId: a.subjectId, sectionId: s.sectionId })),
    );

    const written = await this.db.$transaction(async (tx) => {
      await this.repo.acquireBundleLocks(tx, educatorId, pairs);

      // Concurrency re-verification on fresh in-transaction reads: a pair
      // claimed (or an educator link changed) after the pre-check aborts
      // here instead of double-booking. Occupancy (live classes) is read
      // pre-transaction — class creation races with slot assignment the same
      // way it does for the slots endpoint today.
      for (const a of v.clean) {
        for (const sec of a.sections) {
          if (sec.slots.length === 0) continue;
          const holder = await this.repo.findSectionHolder(
            orgId,
            a.subjectId,
            sec.sectionId,
            educatorId,
            tx,
          );
          if (holder) {
            throw new ConflictException(
              `Section "${v.sections.get(sec.sectionId)?.name ?? sec.sectionId}" of "${v.levels.get(a.subjectId)?.name ?? a.subjectId}" is already assigned to ${holder.educatorName ?? 'another educator'}.`,
            );
          }
        }
      }

      const freshOther = await this.linksExcept(
        orgId,
        educatorId,
        uniqueSubjects,
        v.yearSubjects,
        tx,
      );
      // Fresh links may name subjects the pre-check never priced (they
      // appeared after it). Price them too, or the recompute silently
      // undercounts — the exact hole this check exists to close.
      let required = v.required;
      const unpriced = [...new Set(freshOther.map((l) => l.subjectId))].filter(
        (id) => !required.has(id),
      );
      if (unpriced.length > 0) {
        const freshLevels = await this.repo.subjectLevels(orgId, unpriced);
        required = new Map([
          ...required,
          ...this.resolveRequirements(freshLevels, v.parts.slot),
        ]);
      }
      const freshOtherMin = this.pickedMinutes(freshOther, required);
      const usedMin = v.proposedMin + freshOtherMin + v.parts.existingMin;
      if (usedMin > v.parts.capacityMin) {
        throw new BadRequestException(
          `Over capacity: ${formatHours(usedMin)} of ${formatHours(v.parts.capacityMin)} weekly capacity ` +
            `(${formatHours(v.parts.existingMin)} existing classes + ${formatHours(v.proposedMin + freshOtherMin)} picks).`,
        );
      }

      // Global keys: upsert ticked, delete keys that were linked in this
      // year but are now unticked. Keys of other years are invisible to this
      // modal and therefore never touched here.
      const tickedKeys = new Map(
        uniqueSubjects.map((id) => [id, buildSubjectKey(v.yearSubjects.get(id)!)]),
      );
      await this.repo.upsertGlobalKeys(
        orgId,
        educatorId,
        uniqueSubjects.map((id) => {
          const carry = v.yearSubjects.get(id)!;
          return {
            key: tickedKeys.get(id)!,
            displayName: carry.name,
            ...carry,
          };
        }),
        tx,
      );
      const prevLinked = await this.linkedSubjectIdsInYear(
        orgId,
        educatorId,
        v.yearSubjects,
        tx,
      );
      // Two same-keyed subjects in one year share one link: an unticked
      // subject must not delete a key a ticked subject still needs.
      const tickedKeySet = new Set(tickedKeys.values());
      const removedKeys = prevLinked
        .filter((id) => !listed.has(id))
        .map((id) => buildSubjectKey(v.yearSubjects.get(id)!))
        .filter((k) => !tickedKeySet.has(k));
      if (removedKeys.length > 0) {
        await this.repo.deleteGlobalKeys(orgId, educatorId, removedKeys, tx);
      }

      await this.repo.replaceYearPicks(
        orgId,
        educatorId,
        [...v.yearSubjects.keys()],
        uniqueSubjects.map((subjectId) => ({
          subjectId,
          sections:
            v.clean.find((a) => a.subjectId === subjectId)?.sections ?? [],
        })),
        tx,
      );
      return { updated: v.clean.length, pickedMin: v.proposedMin };
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subject_bundle_set',
        entityType: 'educator',
        entityId: educatorId,
        metadata: {
          count: uniqueSubjects.length,
          updated: written.updated,
          pickedMin: written.pickedMin,
        },
      })
      .catch(() => {});

    return { count: uniqueSubjects.length, ...written };
  }

  /**
   * Shared slot-assignment validation for setSlots and setBundle — the union
   * lives here once, so the two endpoints cannot drift. Returns everything
   * the caller needs to finish (capacity inputs, cleaned assignments); the
   * over-capacity throw stays with the caller, because the bundle re-checks
   * capacity inside its transaction on fresh reads.
   *
   * Rules, in order: the educator exists; every subject is in this org (and,
   * with requireLinked, already linked — tick the subject first); every
   * subject is in the given school year; every section is in this org AND
   * sits on the subject's level; every slot position exists (1..S); no listed
   * pair is held by another educator (409, one educator per pair).
   */
  private async validateSlotAssignments(
    orgId: string,
    educatorId: string,
    schoolYearId: string,
    assignments: Array<{
      subjectId: string;
      sections: Array<{ sectionId: string; slots: number[] }>;
    }>,
    opts: { requireLinked: boolean },
  ) {
    await this.repo.assertEducator(orgId, educatorId);

    const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
    const sectionIds = [
      ...new Set(assignments.flatMap((a) => a.sections.map((s) => s.sectionId))),
    ];
    await this.repo.assertSubjectsInOrg(orgId, subjectIds);

    const sections = await this.repo.sectionsWithLevels(orgId, sectionIds);
    const missing = sectionIds.filter((id) => !sections.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(
        'One or more selected sections do not exist in this organization.',
      );
    }

    const yearSubjects = await this.subjectsInYear(orgId, schoolYearId);

    if (opts.requireLinked) {
      // Linked means holding the GLOBAL key (picks rows alone don't grant
      // teachability anymore). Resolved without year scoping: a linked
      // subject saved for the wrong year must report the YEAR problem, not
      // a missing link.
      const [parts, keySet] = await Promise.all([
        this.repo.subjectKeyParts(orgId, subjectIds),
        this.repo
          .findGlobalKeys(orgId, educatorId)
          .then((keys) => new Set(keys.map((k) => k.subject_key))),
      ]);
      const unlinked = subjectIds.filter((id) => {
        const p = parts.get(id);
        return !p || !keySet.has(buildSubjectKey(p));
      });
      if (unlinked.length > 0) {
        throw new BadRequestException(
          'Add the subject to teachable subjects before assigning slots to it.',
        );
      }
    }
    const outsideYear = subjectIds.filter((id) => !yearSubjects.has(id));
    if (outsideYear.length > 0) {
      throw new BadRequestException(
        'One or more selected subjects do not belong to this school year.',
      );
    }

    const cfg = await this.orgScheduleConfig.getByOrg(orgId);
    const slot = cfg.slotDuration || 30;
    // Requirements cover the proposed subjects AND this educator's other
    // links in the year, so capacity counts every pick exactly once.
    const otherLinks = await this.linksExcept(orgId, educatorId, subjectIds, yearSubjects);
    const allIds = [
      ...new Set([
        ...subjectIds,
        ...otherLinks.map((l) => l.subjectId),
      ]),
    ];
    const levels = await this.repo.subjectLevels(orgId, allIds);
    for (const id of subjectIds) {
      if (!levels.has(id)) {
        throw new NotFoundException(
          'One or more selected subjects do not exist in this organization.',
        );
      }
    }
    const required = this.resolveRequirements(levels, slot);
    for (const a of assignments) {
      const info = levels.get(a.subjectId);
      const req = required.get(a.subjectId);
      if (!info || !req) continue; // guarded above; tsc narrowing
      for (const sec of a.sections) {
        const section = sections.get(sec.sectionId);
        if (
          !section ||
          info.levelId == null ||
          section.levelId !== info.levelId
        ) {
          throw new BadRequestException(
            `Section "${section?.name ?? sec.sectionId}" does not belong to the level of "${info.name}".`,
          );
        }
        const clean = [...new Set(sec.slots)].sort((x, y) => x - y);
        const bad = clean.find((n) => n < 1 || n > req.positions);
        if (bad !== undefined) {
          throw new BadRequestException(
            `"${info.name}" meets ${req.positions}x per week — position ${bad} does not exist.`,
          );
        }
      }
    }

    // One educator per pair: a second claim is rejected, naming the holder.
    // One lookup per pair; pairs per save are few.
    for (const a of assignments) {
      for (const sec of a.sections) {
        if (sec.slots.length === 0) continue;
        const holder = await this.repo.findSectionHolder(
          orgId,
          a.subjectId,
          sec.sectionId,
          educatorId,
        );
        if (holder) {
          throw new ConflictException(
            `Section "${sections.get(sec.sectionId)?.name ?? sec.sectionId}" of "${levels.get(a.subjectId)?.name ?? a.subjectId}" is already assigned to ${holder.educatorName ?? 'another educator'}.`,
          );
        }
      }
    }

    const clean = assignments.map((a) => ({
      subjectId: a.subjectId,
      sections: a.sections.map((s) => ({
        sectionId: s.sectionId,
        slots: [...new Set(s.slots)].sort((x, y) => x - y),
      })),
    }));

    // Capacity inputs — the over-capacity throw stays with the caller (see
    // method docblock): setSlots throws here on pre-transaction data, the
    // bundle re-checks inside its transaction on fresh reads.
    const parts = await this.loadCapacityParts(orgId, educatorId, schoolYearId);
    const proposedMin = this.pickedMinutes(clean, required);
    const otherMin = this.pickedMinutes(otherLinks, required);

    return {
      subjectIds,
      clean,
      required,
      yearSubjects,
      sections,
      levels,
      otherLinks,
      parts,
      proposedMin,
      otherMin,
    };
  }

  /**
   * GET /educators/:id/capacity — weekly capacity breakdown for the
   * assignment UI: what the schedule allows, what classes already take, what
   * picks take, and what is left.
   */
  async capacity(orgId: string, educatorId: string, schoolYearId: string) {
    await this.repo.assertEducator(orgId, educatorId);
    const parts = await this.loadCapacityParts(orgId, educatorId, schoolYearId);
    const yearSubjects = await this.subjectsInYear(orgId, schoolYearId);
    const links = await this.repo.findByEducator(orgId, educatorId);
    const mine = links
      .filter((r) => yearSubjects.has(r.subject.id))
      .map((r) => ({
        subjectId: r.subject.id,
        sections: parseSectionSlots(r.section_slots).map((s) => ({
          sectionId: s.sectionId,
          slots: s.slots,
        })),
      }));
    const pickedMin = this.pickedMinutes(
      mine,
      await this.requirementsFor(orgId, mine.map((m) => m.subjectId)),
    );
    return {
      capacityMin: parts.capacityMin,
      existingMin: parts.existingMin,
      pickedMin,
      remainingMin: Math.max(0, parts.capacityMin - parts.existingMin - pickedMin),
      effectiveWeekdays: parts.effectiveWeekdays,
      windowStart: parts.windowStart,
      windowEnd: parts.windowEnd,
      slotDuration: parts.slot,
    };
  }

  /**
   * Minutes for one set of slot picks. Positions outside 1..S never count —
   * stale picks from before a subject's count changed cannot inflate load.
   *
   * Sums each picked position's OWN length, not `count * base`: with mixed
   * per-session durations those differ, and under-counting here would let an
   * educator silently pass the capacity guard they are being protected from.
   */
  private pickedMinutes(
    assignments: Array<{
      subjectId: string;
      sections: Array<{ sectionId: string; slots: number[] }>;
    }>,
    required: Map<string, { positions: number; minutes: number; durations: number[] }>,
  ): number {
    let total = 0;
    for (const a of assignments) {
      const req = required.get(a.subjectId);
      if (!req) continue;
      // Keyed by section so the same slot on two sections counts twice, while
      // a repeated slot within one section still counts once.
      const positions = new Map<string, number>();
      for (const sec of a.sections) {
        for (const n of sec.slots) {
          if (n >= 1 && n <= req.positions) positions.set(`${sec.sectionId}:${n}`, n);
        }
      }
      for (const slotPosition of positions.values()) {
        total += req.durations[slotPosition - 1] ?? req.minutes;
      }
    }
    return total;
  }

  /** Resolved weekly requirement for each subject id. */
  private resolveRequirements(
    levels: Map<
      string,
      {
        programType: string | null;
        sessionsPerWeek: number | null;
        sessionMinutes: number | null;
        sessionDurations: number[];
      }
    >,
    slot: number,
  ): Map<string, { positions: number; minutes: number; durations: number[] }> {
    const out = new Map<
      string,
      { positions: number; minutes: number; durations: number[] }
    >();
    for (const [id, info] of levels) {
      const resolved = resolveSessionRequirement(
        {
          sessionsPerWeek: info.sessionsPerWeek,
          sessionMinutes: info.sessionMinutes,
          sessionDurations: info.sessionDurations,
        },
        info.programType,
        slot,
      );
      out.set(id, {
        positions: resolved.sessionsPerWeek,
        minutes: resolved.sessionMinutes,
        durations: resolved.durations,
      });
    }
    return out;
  }

  /** This educator's links outside the proposed set, as slot assignments. */
  private async linksExcept(
    orgId: string,
    educatorId: string,
    excludeSubjectIds: string[],
    yearSubjects: Map<string, { id: string }>,
    tx?: PrismaTx,
  ): Promise<
    Array<{ subjectId: string; sections: Array<{ sectionId: string; slots: number[] }> }>
  > {
    const excluded = new Set(excludeSubjectIds);
    const links = await this.repo.findByEducator(orgId, educatorId, tx);
    return links
      .filter((r) => !excluded.has(r.subject.id) && yearSubjects.has(r.subject.id))
      .map((r) => ({
        subjectId: r.subject.id,
        sections: parseSectionSlots(r.section_slots).map((s) => ({
          sectionId: s.sectionId,
          slots: s.slots,
        })),
      }));
  }

  /** Resolved weekly requirement per subject id. */
  private async requirementsFor(
    orgId: string,
    subjectIds: string[],
  ): Promise<Map<string, { positions: number; minutes: number; durations: number[] }>> {
    const cfg = await this.orgScheduleConfig.getByOrg(orgId);
    const slot = cfg.slotDuration || 30;
    const levels = await this.repo.subjectLevels(orgId, [...new Set(subjectIds)]);
    return this.resolveRequirements(levels, slot);
  }

  /** Capacity + existing load shared by setSlots validation and capacity(). */
  private async loadCapacityParts(
    orgId: string,
    educatorId: string,
    schoolYearId: string,
  ) {
    const [cfg, profile] = await Promise.all([
      this.orgScheduleConfig.getByOrg(orgId),
      this.scheduleProfiles.get(orgId, educatorId),
    ]);
    const slot = cfg.slotDuration || 30;
    const freeRanges = getFreeMinuteRanges({
      startTime: cfg.startTime,
      endTime: cfg.endTime,
      slotDuration: slot,
      activeWeekdays: cfg.activeWeekdays,
      breaks: cfg.breaks,
    });
    const perDayMin = freeRanges.reduce((n, r) => n + (r.endMin - r.startMin), 0);
    // Narrowed to this educator's live classes in the year: only their own
    // bookings can conflict with new picks.
    const occupied = await this.occupancy.load({
      orgId,
      schoolYearId,
      educatorId,
      scope: 'school-year',
    });
    const existingMin = occupied.reduce((n, o) => n + (o.endMin - o.startMin), 0);
    return {
      slot,
      windowStart: cfg.startTime,
      windowEnd: cfg.endTime,
      effectiveWeekdays: profile.effectiveWeekdays,
      capacityMin: profile.effectiveWeekdays.length * perDayMin,
      existingMin,
    };
  }

  /** GET /subjects/:id/educators — who can teach this subject. */
  async listEducatorsForSubject(orgId: string, subjectId: string) {
    const rows = await this.repo.findEducatorsForSubject(orgId, subjectId);
    return rows.map((r) => ({
      id: r.educator.id,
      status: r.educator.status,
      fullName: r.educator.profile?.full_name ?? null,
      // The public educator code lives in the Profile metadata JSON blob.
      educatorId: readEducatorCode(r.educator.profile?.metadata),
    }));
  }

  /** True when the educator may teach the subject (holds its global key). */
  async canTeach(orgId: string, educatorId: string, subjectId: string) {
    const parts = await this.repo.subjectKeyParts(orgId, [subjectId]);
    const p = parts.get(subjectId);
    if (!p) return false;
    const key = buildSubjectKey(p);
    const keys = await this.repo.findGlobalKeys(orgId, educatorId);
    return keys.some((k) => k.subject_key === key);
  }

  /**
   * GET /educators/:id/subjects/usage?schoolYearId=
   * For the teachable modal's untick confirm: per year-linked subject, where
   * ELSE (other years) it is used by this educator's classes or slot picks.
   * Only subjects with other-year usage are returned.
   */
  async subjectUsage(orgId: string, educatorId: string, schoolYearId: string) {
    await this.repo.assertEducator(orgId, educatorId);
    const yearSubjects = await this.subjectsInYear(orgId, schoolYearId);
    const linkedIds = await this.linkedSubjectIdsInYear(
      orgId,
      educatorId,
      yearSubjects,
    );
    if (linkedIds.length === 0) return [];
    const yearSubjectIds = new Set(yearSubjects.keys());

    const [years, rows, otherClasses] = await Promise.all([
      this.db.schoolYear.findMany({
        where: { org_id: orgId, id: { not: schoolYearId } },
        select: { id: true, name: true },
      }),
      this.repo.findByEducator(orgId, educatorId),
      // Other years use different subject ids, so classes are matched by key
      // below — not by subject id.
      this.db.class.groupBy({
        by: ['subject_id', 'school_year_id'],
        where: {
          org_id: orgId,
          educator_id: educatorId,
          school_year_id: { not: schoolYearId },
        },
        _count: { _all: true },
      }),
    ]);
    const yearNameById = new Map(years.map((y) => [y.id, y.name]));

    const linkedKeyById = new Map<string, string>();
    for (const id of linkedIds) {
      const s = yearSubjects.get(id);
      if (s) linkedKeyById.set(id, buildSubjectKey(s));
    }
    const linkedIdsByKey = new Map<string, string[]>();
    for (const [id, key] of linkedKeyById) {
      const list = linkedIdsByKey.get(key) ?? [];
      list.push(id);
      linkedIdsByKey.set(key, list);
    }
    // Keys of everything that could carry other-year usage: other-year class
    // subjects plus picks rows from outside this year.
    const otherSubjectIds = [
      ...new Set([
        ...otherClasses.map((c) => c.subject_id),
        ...rows
          .map((r) => r.subject.id)
          .filter((id) => !yearSubjectIds.has(id)),
      ]),
    ];
    const otherParts =
      otherSubjectIds.length > 0
        ? await this.repo.subjectKeyParts(orgId, otherSubjectIds)
        : new Map();
    const otherKeyOf = (subjectId: string): string | null => {
      const p = otherParts.get(subjectId);
      return p ? buildSubjectKey(p) : null;
    };

    type YearUse = {
      schoolYearId: string;
      schoolYearName: string;
      classCount: number;
      hasPicks: boolean;
    };
    const useBySubject = new Map<string, Map<string, YearUse>>();
    const useOf = (subjectId: string, yearId: string): YearUse => {
      let perSubject = useBySubject.get(subjectId);
      if (!perSubject) {
        perSubject = new Map();
        useBySubject.set(subjectId, perSubject);
      }
      let use = perSubject.get(yearId);
      if (!use) {
        use = {
          schoolYearId: yearId,
          schoolYearName: yearNameById.get(yearId) ?? yearId,
          classCount: 0,
          hasPicks: false,
        };
        perSubject.set(yearId, use);
      }
      return use;
    };
    for (const c of otherClasses) {
      const key = otherKeyOf(c.subject_id);
      if (!key) continue;
      for (const linkedId of linkedIdsByKey.get(key) ?? []) {
        useOf(linkedId, c.school_year_id).classCount += c._count._all;
      }
    }
    for (const r of rows) {
      if (yearSubjectIds.has(r.subject.id)) continue;
      const info = otherParts.get(r.subject.id);
      const key = info ? buildSubjectKey(info) : null;
      // Links-only rows (no sections/slots picked) are not usage — but the
      // row's year still identifies where the shared link reaches.
      const hasPicks =
        (r.section_ids ?? []).length > 0 ||
        parseSectionSlots(r.section_slots).some((s) => s.slots.length > 0);
      if (!key || !hasPicks || !info?.schoolYearId) continue;
      if (info.schoolYearId === schoolYearId) continue;
      for (const linkedId of linkedIdsByKey.get(key) ?? []) {
        useOf(linkedId, info.schoolYearId).hasPicks = true;
      }
    }

    return [...useBySubject.entries()].map(([subjectId, perYear]) => ({
      subjectId,
      subjectName: yearSubjects.get(subjectId)?.name ?? subjectId,
      otherYears: [...perYear.values()],
    }));
  }

  /**
   * Year-independent key parts for subjects, for cross-domain callers (the
   * subject delete path) that must not reach into the educator tables.
   */
  async keyPartsFor(orgId: string, subjectIds: string[], tx?: PrismaTx) {
    return this.repo.subjectKeyParts(orgId, subjectIds, tx);
  }

  /**
   * POST /educators/:id/subject-keys/remove — removes GLOBAL teachable keys,
   * in every year at once. Picks rows whose subject carries a removed key go
   * with them (same orphan rule as replaceSet); other years' unrelated picks
   * are untouched. This is what the Subjects tab's Remove button calls: the
   * year-scoped bundle cannot remove a key that has no subject in its year.
   */
  async removeKeys(
    orgId: string,
    educatorId: string,
    keys: string[],
    actorId: string,
  ) {
    await this.repo.assertEducator(orgId, educatorId);
    const unique = [...new Set(keys.map((k) => k.trim()).filter(Boolean))];

    await this.db.$transaction(async (tx) => {
      await this.repo.deleteGlobalKeys(orgId, educatorId, unique, tx);
      const rows = await this.repo.findByEducator(orgId, educatorId, tx);
      if (rows.length === 0) return;
      const parts = await this.repo.subjectKeyParts(
        orgId,
        rows.map((r) => r.subject.id),
        tx,
      );
      const removed = new Set(unique);
      const dropIds = rows
        .filter((r) => {
          const p = parts.get(r.subject.id);
          return !!p && removed.has(buildSubjectKey(p));
        })
        .map((r) => r.subject.id);
      if (dropIds.length > 0) {
        await tx.educatorSubject.deleteMany({
          where: {
            org_id: orgId,
            educator_id: educatorId,
            subject_id: { in: dropIds },
          },
        });
      }
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subject_keys_removed',
        entityType: 'educator',
        entityId: educatorId,
        metadata: { count: unique.length },
      })
      .catch(() => {});

    return { removed: unique.length };
  }

  /**
   * Prunes a global key after its subject was hard-deleted: when NO
   * non-deleted subject anywhere in the org still carries the key, every
   * educator's row for it is deleted in the same transaction. A subject that
   * merely lacks the key's subject in ONE year keeps its link — nothing to
   * clean up, nothing breaks. Archiving never prunes (restore must work).
   */
  async pruneOrphanedSubjectKey(
    tx: PrismaTx,
    orgId: string,
    parts: SubjectKeyParts,
  ): Promise<void> {
    const key = buildSubjectKey(parts);
    const all = await this.repo.subjectKeyParts(orgId, undefined, tx);
    const alive = [...all.values()].some(
      (p) => p.deletedAt === null && buildSubjectKey(p) === key,
    );
    if (!alive) {
      await this.repo.deleteGlobalKeysByKey(orgId, [key], tx);
    }
  }

  /**
   * All sections of one school year with their level names, for matching
   * section assignments across years. Sections are recreated per year like
   * subjects, so ids never carry over — name + level does the matching.
   */
  private async sectionsInYear(
    orgId: string,
    schoolYearId: string,
  ): Promise<Map<string, { name: string; levelName: string | null }>> {
    const [sections, levels] = await Promise.all([
      this.db.section.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true, level_id: true },
      }),
      this.db.level.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true },
      }),
    ]);
    const levelNameById = new Map(levels.map((l) => [l.id, l.name]));
    const out = new Map<string, { name: string; levelName: string | null }>();
    for (const s of sections) {
      out.set(s.id, {
        name: s.name,
        levelName: levelNameById.get(s.level_id) ?? null,
      });
    }
    return out;
  }

  /**
   * All subjects belonging to one school year, keyed by id.
   *
   * A subject joins a year through whichever parent it hangs off (program,
   * level, course or strand), because `Subject` has no `school_year_id` of its
   * own. All parents load in a few batched queries, not one per parent.
   */
  private async subjectsInYear(
    orgId: string,
    schoolYearId: string,
  ): Promise<Map<string, CarrySubject>> {
    const [programs, levels, courses, strands] = await Promise.all([
      this.db.program.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId },
        select: { id: true, type: true },
      }),
      this.db.level.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true, program_id: true },
      }),
      this.db.course.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true, program_id: true },
      }),
      this.db.strand.findMany({
        where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
        select: { id: true, name: true, program_id: true },
      }),
    ]);

    const programTypeById = new Map(programs.map((p) => [p.id, p.type]));

    // Each parent resolves to the program that owns it, which is what actually
    // decides the school year a subject belongs to.
    const parentProgramIds = [
      ...levels.map((l) => [l.id, l.program_id] as const),
      ...courses.map((c) => [c.id, c.program_id] as const),
      ...strands.map((s) => [s.id, s.program_id] as const),
    ];
    const programIdByParent = new Map(parentProgramIds);
    const parentProgramId = (parentId: string | null): string | null =>
      parentId ? (programIdByParent.get(parentId) ?? null) : null;

    const nameOf = (
      rows: Array<{ id: string; name: string }>,
      id: string | null,
    ): string | null => (id ? (rows.find((r) => r.id === id)?.name ?? null) : null);

    const subjects = await this.db.subject.findMany({
      where: { org_id: orgId, deleted_at: null },
      select: {
        id: true,
        name: true,
        program_id: true,
        level_id: true,
        course_id: true,
        strand_id: true,
      },
    });

    const out = new Map<string, CarrySubject>();
    for (const s of subjects) {
      const programId =
        s.program_id ??
        parentProgramId(s.level_id) ??
        parentProgramId(s.course_id) ??
        parentProgramId(s.strand_id);
      if (!programId) continue;

      const programType = programTypeById.get(programId);
      if (!programType) continue; // parent belongs to another year, or is gone

      out.set(s.id, {
        id: s.id,
        name: s.name,
        programType,
        levelName: nameOf(levels, s.level_id),
        courseName: nameOf(courses, s.course_id),
        strandName: nameOf(strands, s.strand_id),
      });
    }
    return out;
  }
}
