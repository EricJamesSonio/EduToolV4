import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  EducatorSubjectRepository,
  parseSectionSlots,
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

/** Case/whitespace-insensitive comparison key. */
const norm = (s: string): string => s.trim().toLowerCase();

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
      return {
        id: s.id,
        name: s.name,
        programId: s.program_id,
        programName: s.program?.name ?? null,
        programType: s.program?.type ?? null,
        levelId: s.level_id,
        // An archived parent renders as no context rather than as a live one.
        levelName: s.level?.deleted_at ? null : (s.level?.name ?? null),
        courseId: s.course_id,
        courseName: s.course?.deleted_at ? null : (s.course?.name ?? null),
        strandId: s.strand_id,
        strandName: s.strand?.deleted_at ? null : (s.strand?.name ?? null),
        sectionIds: Array.isArray(r.section_ids) ? [...r.section_ids] : [],
        sectionSlots: parseSectionSlots(r.section_slots),
      };
    });
  }

  /** GET /educators/:id/subjects */
  async listForEducator(orgId: string, educatorId: string) {
    await this.repo.assertEducator(orgId, educatorId);
    return EducatorSubjectService.map(
      await this.repo.findByEducator(orgId, educatorId),
    );
  }

  /** PUT /educators/:id/subjects — replaces the whole set. */
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

    const count = await this.repo.replaceSet(orgId, educatorId, unique);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subjects_replaced',
        entityType: 'educator',
        entityId: educatorId,
        metadata: { count },
      })
      .catch(() => {});

    return { count };
  }

  /**
   * PUT /educators/:id/subject-slots — replaces the weekly slot picks for the
   * given subjects. Slots are 1-based count positions (slot 1..S of the
   * subject's sessions-per-week), never days or times.
   *
   * Rules, in order: the educator exists; every subject is in this org AND
   * already linked (tick the subject first); every subject is in the given
   * school year; every section is in this org AND sits on the subject's
   * level; every slot position exists (1..S); no listed pair is held by
   * another educator (409, one educator per pair); the proposed picks plus
   * existing classes fit the educator's weekly capacity (400 with numbers).
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

    const linked = new Set(await this.repo.findSubjectIds(orgId, educatorId));
    const unlinked = subjectIds.filter((id) => !linked.has(id));
    if (unlinked.length > 0) {
      throw new BadRequestException(
        'Add the subject to teachable subjects before assigning slots to it.',
      );
    }

    const yearSubjects = await this.subjectsInYear(orgId, schoolYearId);
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

    // Capacity: proposed picks (plus this educator's other links in the year)
    // plus existing classes must fit the weekly capacity. Numbers, not vibes.
    const parts = await this.loadCapacityParts(orgId, educatorId, schoolYearId);
    const proposedMin = this.pickedMinutes(clean, required);
    const otherMin = this.pickedMinutes(otherLinks, required);
    const usedMin = proposedMin + otherMin + parts.existingMin;
    if (usedMin > parts.capacityMin) {
      throw new BadRequestException(
        `Over capacity: ${formatHours(usedMin)} of ${formatHours(parts.capacityMin)} weekly capacity ` +
          `(${formatHours(parts.existingMin)} existing classes + ${formatHours(proposedMin + otherMin)} picks).`,
      );
    }

    await this.repo.setSlots(orgId, educatorId, clean);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subject_slots_set',
        entityType: 'educator',
        entityId: educatorId,
        metadata: { count: clean.length, pickedMin: proposedMin },
      })
      .catch(() => {});

    return { updated: clean.length };
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
  ): Promise<
    Array<{ subjectId: string; sections: Array<{ sectionId: string; slots: number[] }> }>
  > {
    const excluded = new Set(excludeSubjectIds);
    const links = await this.repo.findByEducator(orgId, educatorId);
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

  /** True when the educator may teach the subject (has a link). */
  async canTeach(orgId: string, educatorId: string, subjectId: string) {
    const ids = await this.repo.findSubjectIds(orgId, educatorId);
    return ids.includes(subjectId);
  }

  /**
   * Copies teachable subjects from one school year to another.
   *
   * Subjects are recreated per year, so ids never carry over. Each link is
   * matched on normalized name + program type + parent names (level, then
   * course/strand). Anything unmatched is REPORTED, never guessed.
   */
  async carryOver(
    orgId: string,
    fromSchoolYearId: string,
    toSchoolYearId: string,
    educatorIds: string[] | undefined,
    actorId: string,
  ) {
    if (fromSchoolYearId === toSchoolYearId) {
      throw new BadRequestException(
        'Choose a different school year to copy into.',
      );
    }

    const educatorWhere = {
      org_id: orgId,
      role: 'educator' as const,
      deleted_at: null,
      ...(educatorIds?.length ? { id: { in: educatorIds } } : {}),
    };

    // Everything for the scope is loaded up front. Doing it per educator or per
    // subject would be an N+1 across a whole school year's faculty.
    const [links, educators, fromSubjects, toSubjects, fromSections, toSections] =
      await Promise.all([
        // Prisma 5 relation filters use the `is:` form for to-one relations.
        this.db.educatorSubject.findMany({
          where: { org_id: orgId, educator: { is: educatorWhere } },
          select: {
            educator_id: true,
            subject_id: true,
            section_ids: true,
            section_slots: true,
          },
        }),
        this.db.account.findMany({
          where: educatorWhere,
          select: { id: true },
        }),
        this.subjectsInYear(orgId, fromSchoolYearId),
        this.subjectsInYear(orgId, toSchoolYearId),
        this.sectionsInYear(orgId, fromSchoolYearId),
        this.sectionsInYear(orgId, toSchoolYearId),
      ]);

    // Build the match index for the TARGET year once.
    const targetIndex = new Map<string, string>();
    for (const s of toSubjects.values()) {
      targetIndex.set(EducatorSubjectService.subjectKey(s), s.id);
    }
    const targetSectionIndex = new Map<string, string>();
    for (const [id, s] of toSections) {
      targetSectionIndex.set(EducatorSubjectService.sectionKey(s), id);
    }

    const unmatched: Array<{
      educatorId: string;
      subjectName: string;
      reason: string;
    }> = [];
    const byEducator = new Map<string, Set<string>>();
    // educator -> target subject -> target section -> carried slot positions
    const carriedSlots = new Map<
      string,
      Map<string, Map<string, Set<number>>>
    >();

    // Legacy rows (section_ids with no slots JSON) expand to every position
    // of the SOURCE subject's weekly count, so the carry is still exact.
    const legacySubjectIds = [
      ...new Set(
        links
          .filter(
            (l) =>
              (l.section_ids?.length ?? 0) > 0 &&
              parseSectionSlots(l.section_slots).length === 0,
          )
          .map((l) => l.subject_id),
      ),
    ];
    const cfg = await this.orgScheduleConfig.getByOrg(orgId);
    const slot = cfg.slotDuration || 30;
    const fromLevels =
      legacySubjectIds.length > 0
        ? await this.repo.subjectLevels(orgId, legacySubjectIds)
        : new Map();
    const legacyPositions = new Map<string, number[]>();
    for (const [id, info] of fromLevels) {
      const resolved = resolveSessionRequirement(
        {
          sessionsPerWeek: info.sessionsPerWeek,
          sessionMinutes: info.sessionMinutes,
          sessionDurations: info.sessionDurations,
        },
        info.programType,
        slot,
      );
      legacyPositions.set(
        id,
        Array.from({ length: resolved.sessionsPerWeek }, (_, i) => i + 1),
      );
    }

    for (const link of links) {
      const source = fromSubjects.get(link.subject_id);
      if (!source) continue; // link points outside the "from" year

      const targetId = targetIndex.get(
        EducatorSubjectService.subjectKey(source),
      );
      if (!targetId) {
        unmatched.push({
          educatorId: link.educator_id,
          subjectName: source.name,
          reason: 'No equivalent subject in the target year',
        });
        continue;
      }

      const set = byEducator.get(link.educator_id) ?? new Set<string>();
      set.add(targetId);
      byEducator.set(link.educator_id, set);

      // Explicit picks, plus legacy whole-pair rows expanded above.
      const sourcePicks = new Map<string, number[]>();
      for (const p of parseSectionSlots(link.section_slots)) {
        sourcePicks.set(p.sectionId, p.slots);
      }
      for (const sectionId of link.section_ids ?? []) {
        if (!sourcePicks.has(sectionId)) {
          sourcePicks.set(
            sectionId,
            legacyPositions.get(link.subject_id) ?? [],
          );
        }
      }

      for (const [sectionId, slots] of sourcePicks) {
        if (slots.length === 0) continue;
        const fromSection = fromSections.get(sectionId);
        if (!fromSection) continue; // section deleted since
        const targetSectionId = targetSectionIndex.get(
          EducatorSubjectService.sectionKey(fromSection),
        );
        if (!targetSectionId) {
          unmatched.push({
            educatorId: link.educator_id,
            subjectName: source.name,
            reason: `Section "${fromSection.name}" has no equivalent section in the target year`,
          });
          continue;
        }
        let perSubject = carriedSlots.get(link.educator_id);
        if (!perSubject) {
          perSubject = new Map<string, Map<string, Set<number>>>();
          carriedSlots.set(link.educator_id, perSubject);
        }
        const perSection =
          perSubject.get(targetId) ?? new Map<string, Set<number>>();
        const picked = perSection.get(targetSectionId) ?? new Set<number>();
        for (const n of slots) picked.add(n);
        perSection.set(targetSectionId, picked);
        perSubject.set(targetId, perSection);
      }
    }

    let created = 0;
    for (const [educatorId, subjectIds] of byEducator) {
      const res = await this.repo.addMany(orgId, educatorId, [...subjectIds]);
      created += res.count;
    }

    // Slot picks merge (union) with whatever the target year already has —
    // carry-over is additive, like addMany with skipDuplicates above. Pairs
    // already held by someone else are skipped and reported, never taken.
    const carriedTargetSubjects = [
      ...new Set(
        [...carriedSlots.values()].flatMap((perSubject) => [...perSubject.keys()]),
      ),
    ];
    const holderIndex = new Map<
      string,
      { educatorId: string; educatorName: string | null }
    >();
    if (carriedTargetSubjects.length > 0) {
      const held = await this.repo.getAssignmentsBySubject(
        orgId,
        carriedTargetSubjects,
      );
      for (const [subjectId, claims] of held) {
        for (const c of claims) {
          if (!(c.slots.length > 0 || c.wholePair)) continue;
          holderIndex.set(`${subjectId}:${c.sectionId}`, {
            educatorId: c.educatorId,
            educatorName: c.educatorName,
          });
        }
      }
    }

    // Own legacy rows (section_ids with no slots entry) expand to every
    // position of the TARGET subject's count, or the replace below would
    // silently wipe coverage the educator already had.
    const targetLevels =
      carriedTargetSubjects.length > 0
        ? await this.repo.subjectLevels(orgId, carriedTargetSubjects)
        : new Map();
    const targetPositions = new Map<string, number>();
    for (const [id, info] of targetLevels) {
      const resolved = resolveSessionRequirement(
        {
          sessionsPerWeek: info.sessionsPerWeek,
          sessionMinutes: info.sessionMinutes,
          sessionDurations: info.sessionDurations,
        },
        info.programType,
        slot,
      );
      targetPositions.set(id, resolved.sessionsPerWeek);
    }

    let sectionsCarried = 0;
    for (const [educatorId, perSubject] of carriedSlots) {
      const current = await this.repo.findByEducator(orgId, educatorId);
      const currentBySubject = new Map(
        current.map((r) => {
          const picks = new Map(
            parseSectionSlots(r.section_slots).map((p) => [
              p.sectionId,
              new Set(p.slots),
            ]),
          );
          const positions = targetPositions.get(r.subject.id) ?? 0;
          for (const sectionId of r.section_ids ?? []) {
            if (!picks.has(sectionId) && positions > 0) {
              picks.set(
                sectionId,
                new Set(
                  Array.from({ length: positions }, (_, i) => i + 1),
                ),
              );
            }
          }
          return [r.subject.id, picks] as const;
        }),
      );
      const merged: Array<{
        subjectId: string;
        sections: Array<{ sectionId: string; slots: number[] }>;
      }> = [];
      for (const [subjectId, perSection] of perSubject) {
        const existing = currentBySubject.get(subjectId) ?? new Map();
        const sections: Array<{ sectionId: string; slots: number[] }> = [];
        for (const [sectionId, picked] of perSection) {
          const holder = holderIndex.get(`${subjectId}:${sectionId}`);
          if (holder && holder.educatorId !== educatorId) {
            unmatched.push({
              educatorId,
              subjectName: toSubjects.get(subjectId)?.name ?? subjectId,
              reason: `Section is already handled by ${holder.educatorName ?? 'another educator'} in the target year`,
            });
            continue;
          }
          const union = new Set([...(existing.get(sectionId) ?? []), ...picked]);
          if (union.size > 0) {
            sections.push({
              sectionId,
              slots: [...union].sort((a, b) => a - b),
            });
            sectionsCarried += 1;
          }
        }
        if (sections.length > 0) merged.push({ subjectId, sections });
      }
      // Nothing carried (everything skipped as held) means nothing to write —
      // an empty replace would wipe nothing, but the call is pure noise.
      if (merged.length > 0) {
        await this.repo.setSlots(orgId, educatorId, merged);
      }
    }

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'educator_subjects_carried_over',
        entityType: 'educator',
        entityId: fromSchoolYearId,
        metadata: {
          fromSchoolYearId,
          toSchoolYearId,
          created,
          sectionsCarried,
          unmatched: unmatched.length,
        },
      })
      .catch(() => {});

    return {
      created,
      sectionsCarried,
      educatorsProcessed: educators.length,
      unmatched,
    };
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
      where: { org_id: orgId },
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

  /**
   * Carry-over match key: name + program type + parent names.
   *
   * Level name is included deliberately — the same subject name exists at many
   * levels, and matching on name alone would attach the wrong one.
   */
  private static subjectKey(s: CarrySubject): string {
    return [
      norm(s.name),
      norm(s.programType),
      norm(s.levelName ?? ''),
      norm(s.courseName ?? ''),
      norm(s.strandName ?? ''),
    ].join('|');
  }

  /**
   * Section match key: name + level name. Same section name exists at many
   * levels, so the level disambiguates.
   */
  private static sectionKey(s: { name: string; levelName: string | null }): string {
    return [norm(s.name), norm(s.levelName ?? '')].join('|');
  }
}
