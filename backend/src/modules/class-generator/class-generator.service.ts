import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { ClassOccupancyService } from '../class/class-occupancy.service';
import { ClassService } from '../class/class.service';
import {
  findConflicts,
  type OccupiedSlot,
} from '../class/class-conflict.util';
import { resolveSessionRequirement } from '../subject/subject-session-defaults';
import { intersectWeekdays } from '../educator/educator-schedule-profile.repository';
import {
  EducatorSubjectRepository,
  type SubjectSlotClaim,
} from '../educator/educator-subject.repository';
// A VALUE import, not `import type`: emitDecoratorMetadata needs the runtime
// token so Nest can inject this. See schedule-window.provider.ts.
import { OrgScheduleConfigProvider } from '../org-schedule-config/schedule-window.provider';
import {
  toMinutes,
  getFreeMinuteRanges,
} from '../org-schedule-config/schedule-window.util';

export interface GenerateRequest {
  orgId: string;
  schoolYearId: string;
  programIds: string[];
  semesterId: string;
  /** Optional subset of section ids. Omit/empty = every section in scope. */
  sectionIds?: string[];
  /** Optional narrowing to courses/strands inside the departments. */
  courseIds?: string[];
  strandIds?: string[];
  /** Optional educator allowlist. Omit/empty = every active educator. */
  educatorIds?: string[];
  /** Optional narrowing of the daily window, e.g. '08:00' to '15:00'. */
  windowStart?: string;
  windowEnd?: string;
  /** Cap on generated items, so one bad run cannot flood the org. */
  maxItems?: number;
}

export interface RosterEducator {
  educatorId: string;
  name: string | null;
  useCustomAvailability: boolean;
  effectiveWeekdays: number[];
  /** Subject ids (in the requested school year) this educator can teach. */
  teachableSubjectIds: string[];
  /** Sections this educator handles, keyed by subject id. */
  sectionsBySubject: Record<string, string[]>;
  /** Weekly slot positions picked per section, keyed by subject then section. */
  slotsBySubject: Record<string, Record<string, number[]>>;
}

export interface RosterResult {
  educators: RosterEducator[];
  activeWeekdays: number[];
}

/** One section × subject pair the generator believes is needed. */
export interface DemandItem {
  sectionId: string;
  sectionName: string;
  levelId: string;
  levelName: string;
  subjectId: string;
  subjectName: string;
  educatorId: string | null;
  educatorName: string | null;
  sessionsPerWeek: number;
  /** Resolved base session length. See SubjectResponse.sessionMinutes. */
  sessionMinutes: number;
  /** Resolved length of each weekly position, in order. */
  sessionDurations: number[];
  slots: { weekday: number; startMin: number; endMin: number }[];
  warnings: string[];
  /** Set when the item could not be placed at all. */
  unplacedReason?: string;
}

export type GeneratorReadinessSeverity = 'blocking' | 'warning';

export type GeneratorReadinessEntityType =
  | 'program'
  | 'subject'
  | 'section'
  | 'educator';

export interface GeneratorReadinessEntity {
  id: string;
  name: string;
  type: GeneratorReadinessEntityType;
}

export interface GeneratorReadinessIssue {
  code: string;
  severity: GeneratorReadinessSeverity;
  message: string;
  count?: number;
  entities?: GeneratorReadinessEntity[];
  ref?: { type: GeneratorReadinessEntityType; id: string; name: string };
}

export interface ReadinessReport {
  ok: boolean;
  activeWeekdays: number[];
  warnings: string[];
  blockers: string[];
  issues: GeneratorReadinessIssue[];
}

/** Detail lists are capped like the school-year readiness endpoint. */
const MAX_READINESS_ENTITIES = 10;

export interface GenerateResult {
  items: DemandItem[];
  readiness: ReadinessReport;
  placedCount: number;
  unplacedCount: number;
}

const DEFAULT_MAX_ITEMS = 200;
/** Beyond this a session cannot fit a plausible school day; skip the subject. */
const MAX_SESSION_MINUTES = 180;

@Injectable()
export class ClassGeneratorService {
  constructor(
    private readonly db: DatabaseService,
    private readonly occupancy: ClassOccupancyService,
    private readonly orgScheduleConfig: OrgScheduleConfigProvider,
    /** Used only to persist committed plans, so they inherit every rule. */
    private readonly classService: ClassService,
    /** Subject -> eligible educators, in one query for the whole scope. */
    private readonly educatorSubjects: EducatorSubjectRepository,
  ) {}

  /**
   * Cheap check for the UI to show BEFORE the admin builds a plan: what is
   * configured, and what is missing. Read-only.
   */
  async readiness(req: GenerateRequest): Promise<ReadinessReport> {
    if (req.programIds.length === 0) {
      throw new BadRequestException('Select at least one department.');
    }
    const cfg = await this.orgScheduleConfig.getByOrg(req.orgId);
    const slot = cfg.slotDuration || 30;
    const scope = await this.loadScope(req, slot);
    const occupied = await this.occupancy.load({
      orgId: req.orgId,
      schoolYearId: req.schoolYearId,
      scope: 'school-year',
    });
    return this.buildReadiness(scope, cfg, req, occupied);
  }

  /**
   * Builds a plan WITHOUT writing anything. The UI previews this, the admin
   * approves, and only then is `commit` called with the same inputs.
   *
   * Read-only by construction, so an admin can preview repeatedly and freely.
   */
  async preview(req: GenerateRequest): Promise<GenerateResult> {
    if (req.programIds.length === 0) {
      throw new BadRequestException('Select at least one department.');
    }

    const cfg = await this.orgScheduleConfig.getByOrg(req.orgId);
    const activeWeekdays = cfg.activeWeekdays ?? [0, 1, 2, 3, 4, 5, 6];
    const slot = cfg.slotDuration || 30;
    const blockedRanges = (cfg.breaks ?? []).map((b) => ({
      startMin: toMinutes(b.start),
      endMin: toMinutes(b.end),
      label: b.label,
    }));

    // Free ranges come from the org window with breaks already removed, so a
    // lunch is never proposed in the first place. Optionally narrowed by the
    // admin's own window.
    const freeRanges = getFreeMinuteRanges({
      startTime: req.windowStart ?? cfg.startTime,
      endTime: req.windowEnd ?? cfg.endTime,
      slotDuration: slot,
      activeWeekdays,
      breaks: cfg.breaks,
    });

    const scope = await this.loadScope(req, slot);
    const occupied = await this.occupancy.load({
      orgId: req.orgId,
      schoolYearId: req.schoolYearId,
      scope: 'school-year',
    });
    const readiness = this.buildReadiness(scope, cfg, req, occupied);

    // Existing bookings PLUS everything placed earlier in this run. Without
    // the second part the batch would be planned against stale availability
    // and would collide with itself.
    const working: OccupiedSlot[] = occupied.map((o) => ({ ...o }));

    const items: DemandItem[] = [];

    for (const subject of scope.subjects) {
      for (const section of scope.sections) {
        if (section.level_id !== subject.level_id) continue;

        // One resolved truth per subject, shared with readiness + capacity.
        // Falls back to inline resolution for subjects outside the year map
        // (e.g. a crafted program scope); identical inputs, identical result.
        const cached = scope.yearRequirements.get(subject.id);
        const requirement = cached
          ? {
              sessionsPerWeek: cached.positions,
              sessionMinutes: cached.minutes,
              durations: cached.durations,
            }
          : resolveSessionRequirement(
              {
                sessionsPerWeek: subject.sessions_per_week,
                sessionMinutes: subject.session_minutes,
                sessionDurations: subject.session_durations,
              },
              subject.program?.type ?? null,
              slot,
            );

        const item = this.buildItem(
          section,
          subject,
          requirement.sessionsPerWeek,
          requirement.sessionMinutes,
          requirement.durations,
          activeWeekdays,
        );

        // Report, don't silently drop: with free-write lengths an admin can
        // set 4h on a subject and would otherwise wonder why it never appears.
        // Per-position lengths mean the LONGEST session is the binding
        // constraint, not the base.
        const longestSession = Math.max(...requirement.durations);
        if (longestSession > MAX_SESSION_MINUTES) {
          item.unplacedReason = `Needs ${longestSession}m per session, over the ${MAX_SESSION_MINUTES}m placement limit. Shorten it in the subject's weekly sessions.`;
          items.push(item);
          continue;
        }

        // Strict demand with slot positions: a pair generates only when ONE
        // educator holds every weekly position (slot 1..S). Legacy
        // whole-pair rows count as holding all positions. Claims outside the
        // run scope (another section filter) simply do not appear here.
        const pairClaims = (scope.assignmentsBySubject.get(subject.id) ?? [])
          .filter((c) => c.sectionId === section.id);

        if (pairClaims.length === 0) {
          const deselectedHold = (
            scope.assignmentsBySubjectAll?.get(subject.id) ?? []
          ).some((c) => c.sectionId === section.id);
          item.unplacedReason = deselectedHold
            ? `Every educator assigned to ${subject.name} for ${section.name} is deselected. Re-select them or assign slots to a selected educator.`
            : `No educator is assigned to ${subject.name} for ${section.name}. Assign slots on the educator's page.`;
          items.push(item);
          continue;
        }

        // Defensive grouping: exclusivity is enforced on write, but legacy
        // data may predate it. Most positions wins; earliest claim breaks
        // ties; the rest are named rather than silently dropped.
        const positionsOf = (c: (typeof pairClaims)[number]): Set<number> => {
          if (c.wholePair) {
            return new Set(
              Array.from(
                { length: requirement.sessionsPerWeek },
                (_, i) => i + 1,
              ),
            );
          }
          return new Set(
            c.slots.filter(
              (n) => n >= 1 && n <= requirement.sessionsPerWeek,
            ),
          );
        };
        const byEducator = new Map<
          string,
          { name: string | null; positions: Set<number>; earliest: number }
        >();
        for (const c of pairClaims) {
          const entry = byEducator.get(c.educatorId) ?? {
            name: c.educatorName,
            positions: new Set<number>(),
            earliest: c.createdAt.getTime(),
          };
          for (const n of positionsOf(c)) entry.positions.add(n);
          entry.earliest = Math.min(entry.earliest, c.createdAt.getTime());
          if (!entry.name) entry.name = c.educatorName;
          byEducator.set(c.educatorId, entry);
        }
        const ranked = [...byEducator.entries()].sort(
          (a, b) =>
            b[1].positions.size - a[1].positions.size ||
            a[1].earliest - b[1].earliest,
        );
        const [holderId, holder] = ranked[0];
        if (ranked.length > 1) {
          const names = ranked
            .slice(1)
            .map(([, e]) => e.name ?? 'Another educator');
          item.warnings.push(
            `${names.join(', ')} also hold(s) this pair from before exclusivity; ${holder.name ?? 'the earliest hold'} is used.`,
          );
        }

        if (holder.positions.size < requirement.sessionsPerWeek) {
          item.educatorId = holderId;
          item.educatorName =
            holder.name ?? scope.educatorName.get(holderId) ?? null;
          item.unplacedReason =
            `Only ${holder.positions.size} of ${requirement.sessionsPerWeek} weekly slots ` +
            `of ${subject.name} for ${section.name} are assigned to ${item.educatorName ?? 'an educator'}. Assign the rest on their page.`;
          items.push(item);
          continue;
        }

        const educatorId = holderId;
        item.educatorId = educatorId;
        item.educatorName =
          holder.name ?? scope.educatorName.get(holderId) ?? null;
        const days = scope.customAvailability.has(educatorId)
          ? intersectWeekdays(
              scope.availability.get(educatorId) ?? [],
              activeWeekdays,
            )
          : activeWeekdays;

        if (days.length === 0) {
          item.unplacedReason = `${item.educatorName ?? 'The assigned educator'} has no available school days. Adjust their availability.`;
          items.push(item);
          continue;
        }

        const chosen = this.placeSlots({
          educatorId,
          sectionId: section.id,
          required: requirement.sessionsPerWeek,
          durations: requirement.durations,
          days,
          freeRanges,
          working,
          activeWeekdays,
          blockedRanges,
        });

        // Partial placement is worse than none: it would create a class
        // whose shape does not match its declared requirement.
        if (chosen.length < requirement.sessionsPerWeek) {
          item.unplacedReason = 'No free slot on an available school day.';
          items.push(item);
          continue;
        }

        item.slots = chosen;

        for (const s of chosen) {
          working.push({
            classId: `pending:${section.id}:${subject.id}`,
            weekday: s.weekday,
            startMin: s.startMin,
            endMin: s.endMin,
            educatorId,
            sectionId: section.id,
            roomId: null,
          });
        }
        items.push(item);
      }
    }

    const capped = items.slice(0, req.maxItems ?? DEFAULT_MAX_ITEMS);
    if (items.length > capped.length) {
      readiness.warnings.push(
        `Plan truncated to ${capped.length} of ${items.length} items by the per-request cap.`,
      );
    }

    return {
      items: capped,
      readiness,
      placedCount: capped.filter((i) => !i.unplacedReason).length,
      unplacedCount: capped.filter((i) => i.unplacedReason).length,
    };
  }

  /**
   * Greedily places one slot per weekly position, each at ITS OWN length.
   *
   * `durations[i]` is the length of position i, so a 3x/week subject with
   * [60, 60, 120] gets two 60m meetings and one 2h meeting. The list is
   * consumed in order as slots are picked, which is what ties a length to a
   * position rather than to the order a day happened to be tried.
   *
   * For a uniform subject every entry is identical, so this is exactly the
   * old fixed-duration behaviour.
   *
   * Prefers spreading across DISTINCT days first: a class meeting five times a
   * week should not meet twice on a Tuesday. That is both realistic and leaves
   * room for anything added later. Only when there are more sessions than
   * available days does it fall back to doubling up.
   */
  private placeSlots(args: {
    educatorId: string;
    sectionId: string;
    required: number;
    /** Length per weekly position. Must be at least `required` long. */
    durations: number[];
    days: number[];
    freeRanges: { startMin: number; endMin: number }[];
    working: OccupiedSlot[];
    activeWeekdays: number[];
    blockedRanges: { startMin: number; endMin: number; label: string }[];
  }): { weekday: number; startMin: number; endMin: number }[] {
    const picked: { weekday: number; startMin: number; endMin: number }[] = [];
    const usedDays = new Set<number>();

    // Defensive: a short list would place `undefined`-length sessions. Falling
    // back to the LAST entry keeps placement total rather than throwing.
    const durationFor = (position: number): number =>
      args.durations[position] ?? args.durations[args.durations.length - 1];

    const tryDay = (weekday: number, allowRepeat: boolean): boolean => {
      if (usedDays.has(weekday) && !allowRepeat) return false;
      const duration = durationFor(picked.length);
      for (const range of args.freeRanges) {
        for (
          let start = range.startMin;
          start + duration <= range.endMin;
          start += 30
        ) {
          const candidate = {
            weekday,
            startMin: start,
            endMin: start + duration,
            roomId: null,
          };
          const conflicts = findConflicts(
            candidate,
            {
              educatorId: args.educatorId,
              sectionId: args.sectionId,
              activeWeekdays: args.activeWeekdays,
              blockedRanges: args.blockedRanges,
            },
            args.working,
          );
          if (conflicts.length > 0) continue;

          picked.push({ weekday, startMin: start, endMin: start + duration });
          usedDays.add(weekday);
          return true;
        }
      }
      return false;
    };

    // Pass 1: one meeting per distinct day.
    for (const day of args.days) {
      if (picked.length >= args.required) break;
      tryDay(day, false);
    }
    // Pass 2: only when more sessions are needed than there are days.
    if (picked.length < args.required) {
      for (const day of args.days) {
        if (picked.length >= args.required) break;
        tryDay(day, true);
      }
    }
    return picked;
  }

  /**
   * Everything the generator needs for the scope, read in a few queries.
   *
   * Eligibility and assignments load YEAR-wide (not program-filtered): an
   * educator's capacity counts picks in every department, and a claim map is
   * still correct when read for one subject at a time. Callers only ever look
   * up in-scope subjects, so the superset never leaks across programs.
   */
  private async loadScope(req: GenerateRequest, slot: number) {
    const sectionWhere = {
      org_id: req.orgId,
      school_year_id: req.schoolYearId,
      deleted_at: null,
      level: { program_id: { in: req.programIds } },
      // A selected id outside the scope (wrong year, department, or org)
      // simply matches nothing — never an error, never another org's data.
      ...(req.sectionIds && req.sectionIds.length > 0
        ? { id: { in: req.sectionIds } }
        : {}),
      ...(req.courseIds && req.courseIds.length > 0
        ? { course_id: { in: req.courseIds } }
        : {}),
      ...(req.strandIds && req.strandIds.length > 0
        ? { strand_id: { in: req.strandIds } }
        : {}),
    };
    const educatorWhere = {
      org_id: req.orgId,
      role: 'educator' as const,
      status: 'active' as const,
      deleted_at: null,
    };

    const [sections, subjects, profiles, educators] = await Promise.all([
      this.db.section.findMany({
        where: sectionWhere,
        select: {
          id: true,
          name: true,
          level_id: true,
          capacity: true,
          level: { select: { id: true, name: true } },
        },
      }),
      this.db.subject.findMany({
        where: {
          org_id: req.orgId,
          deleted_at: null,
          level: { program_id: { in: req.programIds } },
          ...(req.courseIds && req.courseIds.length > 0
            ? { course_id: { in: req.courseIds } }
            : {}),
          ...(req.strandIds && req.strandIds.length > 0
            ? { strand_id: { in: req.strandIds } }
            : {}),
        },
        select: {
          id: true,
          name: true,
          level_id: true,
          sessions_per_week: true,
          session_minutes: true,
          session_durations: true,
          program: { select: { type: true } },
        },
      }),
      this.db.educatorScheduleProfile.findMany({
        where: { org_id: req.orgId },
        select: {
          educator_id: true,
          use_custom_availability: true,
          available_weekdays: true,
        },
      }),
      this.db.account.findMany({
        where: educatorWhere,
        select: { id: true, profile: { select: { full_name: true } } },
      }),
    ]);

    // Second pass: eligibility, assignments, and session requirements are
    // keyed by subject id. Year-wide (not program-filtered) so capacity math
    // sees every pick; callers look up in-scope subjects only. Batched
    // round-trips beat one per subject.
    const yearSubjectRows = await this.db.subject.findMany({
      where: { org_id: req.orgId, deleted_at: null, level: { school_year_id: req.schoolYearId } },
      select: { id: true },
    });
    const yearSubjectIds = yearSubjectRows.map((s) => s.id);
    const [eligibleBySubject, assignmentsBySubject, sessionFields] =
      yearSubjectIds.length > 0
        ? await Promise.all([
            this.educatorSubjects.getEligibleEducatorsBySubject(
              req.orgId,
              yearSubjectIds,
            ),
            this.educatorSubjects.getAssignmentsBySubject(
              req.orgId,
              yearSubjectIds,
            ),
            this.educatorSubjects.subjectLevels(req.orgId, yearSubjectIds),
          ])
        : [new Map(), new Map(), new Map()];
    // One resolved truth for weekly positions + minutes, shared by preview
    // placement, coverage math, and readiness.
    const yearRequirements = new Map<
      string,
      { positions: number; minutes: number; durations: number[] }
    >();
    for (const [id, info] of sessionFields) {
      const resolved = resolveSessionRequirement(
        {
          sessionsPerWeek: info.sessionsPerWeek,
          sessionMinutes: info.sessionMinutes,
          sessionDurations: info.sessionDurations,
        },
        info.programType,
        slot,
      );
      yearRequirements.set(id, {
        positions: resolved.sessionsPerWeek,
        minutes: resolved.sessionMinutes,
        durations: resolved.durations,
      });
    }

    const availability = new Map<string, number[]>();
    const customAvailability = new Set<string>();
    for (const p of profiles) {
      availability.set(p.educator_id, p.available_weekdays ?? []);
      if (p.use_custom_availability) customAvailability.add(p.educator_id);
    }

    const educatorName = new Map<string, string | null>();
    for (const e of educators) {
      educatorName.set(e.id, e.profile?.full_name ?? null);
    }

    // Educator allowlist: deselected educators are excluded from placement
    // entirely. Snapshots of the unfiltered maps are kept so readiness and
    // preview can tell "no educator at all" apart from "educators exist but
    // are all deselected". Omit/empty = everyone stays selected.
    const selectedEducatorIds =
      req.educatorIds && req.educatorIds.length > 0
        ? [...new Set(req.educatorIds)]
        : null;
    const selectedSet = selectedEducatorIds
      ? new Set(selectedEducatorIds)
      : null;
    const eligibleBySubjectAll = selectedSet
      ? new Map(
          [...eligibleBySubject].map(([k, v]) => [k, [...v]] as [string, string[]]),
        )
      : null;
    const assignmentsBySubjectAll = selectedSet
      ? new Map(
          [...assignmentsBySubject].map(
            ([k, v]) => [k, [...v]] as [string, typeof v],
          ),
        )
      : null;
    if (selectedSet) {
      for (const [subjectId, educatorIds] of eligibleBySubject) {
        eligibleBySubject.set(
          subjectId,
          educatorIds.filter((id) => selectedSet.has(id)),
        );
      }
      for (const [subjectId, claims] of assignmentsBySubject) {
        assignmentsBySubject.set(
          subjectId,
          claims.filter((c) => selectedSet.has(c.educatorId)),
        );
      }
    }
    const allEducatorIds = educators.map((e) => e.id);
    const deselectedEducatorIds = selectedSet
      ? allEducatorIds.filter((id) => !selectedSet.has(id))
      : [];

    return {
      sections,
      subjects,
      eligibleBySubject,
      assignmentsBySubject,
      eligibleBySubjectAll,
      assignmentsBySubjectAll,
      selectedEducatorIds,
      deselectedEducatorIds,
      yearRequirements,
      availability,
      customAvailability,
      educatorName,
      allEducatorIds,
    };
  }

  /**
   * Explains what is missing BEFORE the admin commits to anything.
   *
   * Structured like the school-year readiness endpoint (code / severity /
   * entities) so the UI can link each gap straight to the page that fixes it.
   * Only genuinely impossible states block; everything else is a warning —
   * the plan still builds for whatever IS assigned, and each unplaced item
   * says why.
   */
  private buildReadiness(
    scope: Awaited<ReturnType<ClassGeneratorService['loadScope']>>,
    cfg: Awaited<ReturnType<OrgScheduleConfigProvider['getByOrg']>>,
    req: GenerateRequest,
    occupied: OccupiedSlot[],
  ): ReadinessReport {
    const activeWeekdays = cfg.activeWeekdays ?? [0, 1, 2, 3, 4, 5, 6];
    const issues: GeneratorReadinessIssue[] = [];
    const warnings: string[] = [];
    const blockers: string[] = [];

    const educatorName = (id: string): string =>
      scope.educatorName.get(id) ?? id.slice(0, 8);
    const cappedEntities = <T extends GeneratorReadinessEntity>(
      list: T[],
    ): T[] => list.slice(0, MAX_READINESS_ENTITIES);

    if (activeWeekdays.length === 0) {
      issues.push({
        code: 'no_active_weekdays',
        severity: 'blocking',
        message: 'The school has no active weekdays configured.',
      });
    }
    if (scope.allEducatorIds.length === 0) {
      issues.push({
        code: 'no_educators',
        severity: 'blocking',
        message: 'No active educators in this organization.',
      });
    }
    if (scope.sections.length === 0) {
      issues.push({
        code: 'no_sections',
        severity: 'blocking',
        message:
          req.sectionIds && req.sectionIds.length > 0
            ? 'None of the selected sections belong to the chosen departments for this school year.'
            : 'No sections in the selected departments for this school year.',
      });
    } else if (req.sectionIds && req.sectionIds.length > 0) {
      warnings.push(
        `Limited to ${scope.sections.length} selected section(s).`,
      );
    }
    if (req.courseIds && req.courseIds.length > 0) {
      warnings.push(
        `Scoped to ${req.courseIds.length} selected course(s).`,
      );
    }
    if (req.strandIds && req.strandIds.length > 0) {
      warnings.push(
        `Scoped to ${req.strandIds.length} selected strand(s).`,
      );
    }
    if (scope.subjects.length === 0) {
      issues.push({
        code: 'no_subjects',
        severity: 'blocking',
        message: 'No subjects in the selected departments.',
      });
    }

    // Per-educator availability, teachable coverage, and slot coverage —
    // all derivable from the already-loaded scope, no extra queries.
    // Covered positions per in-scope pair (subject -> section -> positions).
    // Legacy whole-pair holds expand to the full weekly count.
    const inScopeSectionIds = new Set(scope.sections.map((s) => s.id));
    const pairCovered = new Map<string, Map<string, Set<number>>>();
    const holderSections = new Set<string>();
    for (const [subjectId, claims] of scope.assignmentsBySubject) {
      const positions = scope.yearRequirements.get(subjectId)?.positions ?? 0;
      if (positions === 0) continue;
      for (const c of claims) {
        if (!inScopeSectionIds.has(c.sectionId)) continue;
        const covered: Set<number> = c.wholePair
          ? new Set<number>(
              Array.from({ length: positions }, (_, i) => i + 1),
            )
          : new Set<number>(
              c.slots.filter((n) => n >= 1 && n <= positions),
            );
        if (covered.size === 0) continue;
        holderSections.add(c.sectionId);
        let perSection = pairCovered.get(subjectId);
        if (!perSection) {
          perSection = new Map<string, Set<number>>();
          pairCovered.set(subjectId, perSection);
        }
        // Exclusivity is enforced on write; first (earliest) hold wins here.
        if (!perSection.has(c.sectionId)) {
          perSection.set(c.sectionId, covered);
        }
      }
    }

    const teachableByEducator = new Map<string, Set<string>>();
    for (const [subjectId, educatorIds] of scope.eligibleBySubject) {
      for (const id of educatorIds) {
        const set = teachableByEducator.get(id) ?? new Set<string>();
        set.add(subjectId);
        teachableByEducator.set(id, set);
      }
    }

    // Educator checks run against the SELECTED set when an allowlist is
    // present: a deselected educator is "excluded", not "subject-less".
    // Deselection itself is reported separately below.
    const consideredEducators = scope.selectedEducatorIds ?? scope.allEducatorIds;

    const educatorsNoSubjects = consideredEducators.filter(
      (id) => !(teachableByEducator.get(id)?.size ?? 0),
    );
    if (educatorsNoSubjects.length > 0) {
      issues.push({
        code: 'educator_no_subjects',
        severity: 'warning',
        message: `${educatorsNoSubjects.length} educator(s) have no teachable subjects and will sit out generation.`,
        count: educatorsNoSubjects.length,
        entities: cappedEntities(
          educatorsNoSubjects.map((id) => ({
            id,
            name: educatorName(id),
            type: 'educator' as const,
          })),
        ),
      });
    }

    const educatorsNoDays = consideredEducators.filter((id) => {
      const days = scope.customAvailability.has(id)
        ? intersectWeekdays(scope.availability.get(id) ?? [], activeWeekdays)
        : [...activeWeekdays];
      return days.length === 0;
    });
    if (educatorsNoDays.length > 0) {
      issues.push({
        code: 'educator_no_days',
        severity: 'warning',
        message: `${educatorsNoDays.length} educator(s) have no available school day and cannot be placed.`,
        count: educatorsNoDays.length,
        entities: cappedEntities(
          educatorsNoDays.map((id) => ({
            id,
            name: educatorName(id),
            type: 'educator' as const,
          })),
        ),
      });
    }

    // With an educator allowlist, subjects whose educators are all
    // deselected are reported as scope_no_coverage below instead — telling
    // the admin "nobody teaches this" would send them to the wrong fix.
    const subjectsNoEducator = scope.subjects.filter(
      (s) =>
        (scope.eligibleBySubject.get(s.id)?.length ?? 0) === 0 &&
        (scope.eligibleBySubjectAll == null ||
          (scope.eligibleBySubjectAll.get(s.id)?.length ?? 0) === 0),
    );
    if (subjectsNoEducator.length > 0) {
      issues.push({
        code: 'subject_no_educator',
        severity: 'warning',
        message: `${subjectsNoEducator.length} subject(s) have no educator set to teach them and will stay unplaced.`,
        count: subjectsNoEducator.length,
        entities: cappedEntities(
          subjectsNoEducator.map((s) => ({
            id: s.id,
            name: s.name,
            type: 'subject' as const,
          })),
        ),
      });
    }

    // Deselected educators: named so the admin knows the exclusion is
    // deliberate, not a missing assignment.
    if (scope.deselectedEducatorIds.length > 0) {
      issues.push({
        code: 'educator_excluded',
        severity: 'warning',
        message: `${scope.deselectedEducatorIds.length} educator(s) deselected and excluded from generation.`,
        count: scope.deselectedEducatorIds.length,
        entities: cappedEntities(
          scope.deselectedEducatorIds.map((id) => ({
            id,
            name: educatorName(id),
            type: 'educator' as const,
          })),
        ),
      });
    }

    // Coverage gap caused by the selection itself: educators exist for these
    // subjects org-wide, but none of them is selected. Distinct from
    // subject_no_educator (nobody at all), so the fix is obvious: re-select.
    const noCoverageSubjects =
      scope.eligibleBySubjectAll != null
        ? scope.subjects.filter(
            (s) =>
              (scope.eligibleBySubject.get(s.id)?.length ?? 0) === 0 &&
              (scope.eligibleBySubjectAll?.get(s.id)?.length ?? 0) > 0,
          )
        : [];
    if (noCoverageSubjects.length > 0) {
      issues.push({
        code: 'scope_no_coverage',
        severity: 'warning',
        message: `${noCoverageSubjects.length} subject(s) have educators, but all of them are deselected, so they will stay unplaced.`,
        count: noCoverageSubjects.length,
        entities: cappedEntities(
          noCoverageSubjects.map((s) => ({
            id: s.id,
            name: s.name,
            type: 'subject' as const,
          })),
        ),
      });
    }

    const coveredPositionsOf = (subjectId: string): number => {
      let total = 0;
      for (const set of pairCovered.get(subjectId)?.values() ?? []) {
        total += set.size;
      }
      return total;
    };
    const subjectsNoSlots = scope.subjects.filter(
      (s) =>
        (scope.eligibleBySubject.get(s.id)?.length ?? 0) > 0 &&
        coveredPositionsOf(s.id) === 0,
    );
    if (subjectsNoSlots.length > 0) {
      issues.push({
        code: 'subject_no_slots',
        severity: 'warning',
        message: `${subjectsNoSlots.length} subject(s) have educators but no weekly slots assigned, so they generate nothing.`,
        count: subjectsNoSlots.length,
        entities: cappedEntities(
          subjectsNoSlots.map((s) => ({
            id: s.id,
            name: s.name,
            type: 'subject' as const,
          })),
        ),
      });
    }

    const sectionsUnclaimed = scope.sections.filter(
      (sec) => !holderSections.has(sec.id),
    );
    if (sectionsUnclaimed.length > 0 && scope.subjects.length > 0) {
      issues.push({
        code: 'section_no_assignment',
        severity: 'warning',
        message: `${sectionsUnclaimed.length} section(s) have no assigned subject pair and will get no classes.`,
        count: sectionsUnclaimed.length,
        entities: cappedEntities(
          sectionsUnclaimed.map((sec) => ({
            id: sec.id,
            name: sec.name,
            type: 'section' as const,
          })),
        ),
      });
    }

    // Partially picked pairs: positions nobody holds yet.
    let openPositions = 0;
    const gappedSubjects = new Set<string>();
    for (const [subjectId, perSection] of pairCovered) {
      const positions =
        scope.yearRequirements.get(subjectId)?.positions ?? 0;
      for (const covered of perSection.values()) {
        const missing = positions - covered.size;
        if (missing > 0) {
          openPositions += missing;
          gappedSubjects.add(subjectId);
        }
      }
    }
    if (openPositions > 0) {
      const gapped = scope.subjects.filter((s) => gappedSubjects.has(s.id));
      issues.push({
        code: 'slots_unassigned',
        severity: 'warning',
        message: `${openPositions} weekly slot(s) still have no educator across ${gapped.length} subject(s).`,
        count: openPositions,
        entities: cappedEntities(
          gapped.map((s) => ({
            id: s.id,
            name: s.name,
            type: 'subject' as const,
          })),
        ),
      });
    }

    // Educators already over capacity (picks year-wide + live classes vs the
    // schedule window). Save-time validation blocks new over-picks; this
    // surfaces drift from classes created afterwards.
    const perDayMin = getFreeMinuteRanges({
      startTime: cfg.startTime,
      endTime: cfg.endTime,
      slotDuration: cfg.slotDuration || 30,
      activeWeekdays: cfg.activeWeekdays,
      breaks: cfg.breaks,
    }).reduce((n, r) => n + (r.endMin - r.startMin), 0);
    const existingByEducator = new Map<string, number>();
    for (const o of occupied) {
      existingByEducator.set(
        o.educatorId,
        (existingByEducator.get(o.educatorId) ?? 0) + (o.endMin - o.startMin),
      );
    }
    const pickedByEducator = new Map<string, number>();
    for (const [subjectId, claims] of scope.assignmentsBySubject) {
      const req = scope.yearRequirements.get(subjectId);
      if (!req) continue;
      for (const c of claims) {
        // Weekly load is the SUM of the picked positions' own lengths, not
        // `positions * base` — with mixed durations those differ, and using the
        // base would under-report (or over-report) an educator's real load.
        const pickedSlots = c.wholePair
          ? req.durations.slice(0, req.positions)
          : c.slots
              .filter((n) => n >= 1 && n <= req.positions)
              .map((n) => req.durations[n - 1] ?? req.minutes);
        pickedByEducator.set(
          c.educatorId,
          (pickedByEducator.get(c.educatorId) ?? 0) + pickedSlots.reduce((a, b) => a + b, 0),
        );
      }
    }
    const effectiveDays = new Map<string, number[]>();
    for (const id of consideredEducators) {
      effectiveDays.set(
        id,
        scope.customAvailability.has(id)
          ? intersectWeekdays(scope.availability.get(id) ?? [], activeWeekdays)
          : [...activeWeekdays],
      );
    }
    const overCapacity = consideredEducators.filter((id) => {
      const capacity = (effectiveDays.get(id)?.length ?? 0) * perDayMin;
      const used =
        (pickedByEducator.get(id) ?? 0) + (existingByEducator.get(id) ?? 0);
      return capacity > 0 && used > capacity;
    });
    if (overCapacity.length > 0) {
      issues.push({
        code: 'educator_over_capacity',
        severity: 'warning',
        message: `${overCapacity.length} educator(s) are over weekly capacity (picks plus live classes exceed their available time).`,
        count: overCapacity.length,
        entities: cappedEntities(
          overCapacity.map((id) => ({
            id,
            name: educatorName(id),
            type: 'educator' as const,
          })),
        ),
      });
    }

    for (const issue of issues) {
      if (issue.severity === 'blocking') blockers.push(issue.message);
      else warnings.push(issue.message);
    }

    // The school-year conflict scope means a Semester 1 class already blocks the
    // same educator/section/time in Semester 2. Surfaced, not silently ignored.
    warnings.push(
      'Conflicts are checked across the whole school year, so existing classes in another semester will still block these slots.',
    );

    return {
      ok: blockers.length === 0,
      activeWeekdays,
      warnings,
      blockers,
      issues,
    };
  }

  /**
   * Who can teach what, for the generate page's roster panel. Read-only.
   *
   * Everything in a few batched queries: year subjects, active educators,
   * schedule profiles, and the subject -> educator eligibility map, inverted
   * here into educator -> subjects. Teachable links are scoped to the school
   * year so a previous year's subjects never show up.
   */
  async roster(orgId: string, schoolYearId: string): Promise<RosterResult> {
    const cfg = await this.orgScheduleConfig.getByOrg(orgId);
    const activeWeekdays = cfg.activeWeekdays ?? [0, 1, 2, 3, 4, 5, 6];

    const [subjects, educators, profiles] = await Promise.all([
      this.db.subject.findMany({
        where: { org_id: orgId, deleted_at: null, level: { school_year_id: schoolYearId } },
        select: { id: true },
      }),
      this.db.account.findMany({
        where: {
          org_id: orgId,
          role: 'educator' as const,
          status: 'active' as const,
          deleted_at: null,
        },
        select: { id: true, profile: { select: { full_name: true } } },
      }),
      this.db.educatorScheduleProfile.findMany({
        where: { org_id: orgId },
        select: {
          educator_id: true,
          use_custom_availability: true,
          available_weekdays: true,
        },
      }),
    ]);

    const subjectIds = subjects.map((s) => s.id);
    const [eligibleBySubject, assignmentsBySubject, sessionFields] =
      subjectIds.length > 0
        ? await Promise.all([
            this.educatorSubjects.getEligibleEducatorsBySubject(
              orgId,
              subjectIds,
            ),
            this.educatorSubjects.getAssignmentsBySubject(orgId, subjectIds),
            this.educatorSubjects.subjectLevels(orgId, subjectIds),
          ])
        : [
            new Map<string, string[]>(),
            new Map<string, SubjectSlotClaim[]>(),
            new Map(),
          ];

    const slot = cfg.slotDuration || 30;
    const positionsOfSubject = new Map<string, number>();
    for (const [id, info] of sessionFields) {
      positionsOfSubject.set(
        id,
        resolveSessionRequirement(
          {
            sessionsPerWeek: info.sessionsPerWeek,
            sessionMinutes: info.sessionMinutes,
            sessionDurations: info.sessionDurations,
          },
          info.programType,
          slot,
        ).sessionsPerWeek,
      );
    }

    const teachable = new Map<string, string[]>();
    for (const [subjectId, educatorIds] of eligibleBySubject) {
      for (const educatorId of educatorIds) {
        const list = teachable.get(educatorId) ?? [];
        list.push(subjectId);
        teachable.set(educatorId, list);
      }
    }
    // educator -> subject -> sections/slots, inverted once for all rows.
    // Legacy whole-pair holds expand to every position of the subject.
    const sectionsByEducator = new Map<string, Map<string, string[]>>();
    const slotsByEducator = new Map<
      string,
      Map<string, Map<string, number[]>>
    >();
    for (const [subjectId, claims] of assignmentsBySubject) {
      const positions = positionsOfSubject.get(subjectId) ?? 0;
      for (const c of claims) {
        let perSubject = sectionsByEducator.get(c.educatorId);
        if (!perSubject) {
          perSubject = new Map<string, string[]>();
          sectionsByEducator.set(c.educatorId, perSubject);
        }
        const picked = perSubject.get(subjectId) ?? [];
        if (!picked.includes(c.sectionId)) picked.push(c.sectionId);
        perSubject.set(subjectId, picked);

        let perSubjectSlots = slotsByEducator.get(c.educatorId);
        if (!perSubjectSlots) {
          perSubjectSlots = new Map<string, Map<string, number[]>>();
          slotsByEducator.set(c.educatorId, perSubjectSlots);
        }
        const perSection =
          perSubjectSlots.get(subjectId) ?? new Map<string, number[]>();
        const slots = c.wholePair
          ? Array.from({ length: positions }, (_, i) => i + 1)
          : [...new Set(c.slots)].sort((a, b) => a - b);
        const merged = new Set([...(perSection.get(c.sectionId) ?? []), ...slots]);
        perSection.set(c.sectionId, [...merged].sort((a, b) => a - b));
        perSubjectSlots.set(subjectId, perSection);
      }
    }

    const profileByEducator = new Map(profiles.map((p) => [p.educator_id, p]));
    const rosterEducators: RosterEducator[] = educators.map((e) => {
      const p = profileByEducator.get(e.id);
      const useCustom = p?.use_custom_availability ?? false;
      const effectiveWeekdays = useCustom
        ? intersectWeekdays(p?.available_weekdays ?? [], activeWeekdays)
        : [...activeWeekdays];
      return {
        educatorId: e.id,
        name: e.profile?.full_name ?? null,
        useCustomAvailability: useCustom,
        effectiveWeekdays: [...effectiveWeekdays].sort((a, b) => a - b),
        teachableSubjectIds: teachable.get(e.id) ?? [],
        sectionsBySubject: Object.fromEntries(
          sectionsByEducator.get(e.id) ?? [],
        ),
        slotsBySubject: Object.fromEntries(
          [...(slotsByEducator.get(e.id) ?? [])].map(([subjectId, perSection]) => [
            subjectId,
            Object.fromEntries(perSection),
          ]),
        ),
      };
    });

    return { educators: rosterEducators, activeWeekdays };
  }

  private buildItem(
    section: { id: string; name: string; level: { id: string; name: string } },
    subject: { id: string; name: string },
    sessionsPerWeek: number,
    sessionMinutes: number,
    sessionDurations: number[],
    activeWeekdays: number[],
  ): DemandItem {
    const warnings: string[] = [];
    if (sessionsPerWeek > activeWeekdays.length) {
      warnings.push(
        `Needs ${sessionsPerWeek} meetings but only ${activeWeekdays.length} school day(s) are open; some days will repeat.`,
      );
    }
    return {
      sectionId: section.id,
      sectionName: section.name,
      levelId: section.level.id,
      levelName: section.level.name,
      subjectId: subject.id,
      subjectName: subject.name,
      // Strict demand: only the placement step below may set the educator,
      // from the pair's earliest claim. Guessing here would show an educator
      // on items that were never actually assigned to anyone.
      educatorId: null,
      educatorName: null,
      sessionsPerWeek,
      sessionMinutes,
      sessionDurations,
      slots: [],
      warnings,
    };
  }

  /**
   * Writes the approved plan.
   *
   * Each item is created through `ClassService.create` rather than written
   * directly, so the generated classes inherit every invariant the manual flow
   * enforces: the org schedule window, active weekdays, breaks, educator/
   * section/room conflicts, the one-class-per-(section, subject, semester)
   * rule, grading-scheme auto-apply, attendance session generation and the
   * audit log. Re-implementing those writes here would inevitably drift.
   *
   * Re-validated at commit time rather than trusting the preview: the world may
   * have changed between the admin looking at it and clicking approve.
   */
  async commit(
    req: GenerateRequest,
    actorId: string,
  ): Promise<{ created: number; skipped: { reason: string; detail: string }[] }> {
    const plan = await this.preview(req);
    const created: string[] = [];
    const skipped: { reason: string; detail: string }[] = [];

    for (const item of plan.items) {
      if (item.unplacedReason || !item.educatorId) {
        skipped.push({
          reason: 'unplaced',
          detail: `${item.subjectName} — ${item.sectionName}: ${item.unplacedReason ?? 'no educator'}`,
        });
        continue;
      }

      try {
        await this.classService.create(
          req.orgId,
          {
            subjectId: item.subjectId,
            educatorId: item.educatorId,
            sectionId: item.sectionId,
            schoolYearId: req.schoolYearId,
            semesterId: req.semesterId,
            schedules: item.slots.map((s) => ({
              weekday: s.weekday,
              startTime: minutesToHhmm(s.startMin),
              endTime: minutesToHhmm(s.endMin),
            })),
          } as never,
          actorId,
        );
        created.push(item.subjectId);
      } catch (err) {
        // One bad item must not abandon the rest of the batch. The admin sees
        // exactly which ones did not land and why.
        skipped.push({
          reason: 'error',
          detail: `${item.subjectName} — ${item.sectionName}: ${
            (err as Error)?.message ?? 'unknown error'
          }`,
        });
      }
    }

    return { created: created.length, skipped };
  }
}

function minutesToHhmm(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
