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
import { EducatorSubjectRepository } from '../educator/educator-subject.repository';
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
  /** Optional narrowing of the daily window, e.g. '08:00' to '15:00'. */
  windowStart?: string;
  windowEnd?: string;
  /** Cap on generated items, so one bad run cannot flood the org. */
  maxItems?: number;
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
  sessionMinutes: number;
  slots: { weekday: number; startMin: number; endMin: number }[];
  warnings: string[];
  /** Set when the item could not be placed at all. */
  unplacedReason?: string;
}

export interface ReadinessReport {
  ok: boolean;
  activeWeekdays: number[];
  warnings: string[];
  blockers: string[];
}

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
    const activeWeekdays = cfg.activeWeekdays ?? [0, 1, 2, 3, 4, 5, 6];
    const scope = await this.loadScope(req);
    return this.buildReadiness(scope, activeWeekdays, req);
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

    const scope = await this.loadScope(req);
    const readiness = this.buildReadiness(scope, activeWeekdays, req);

    // Existing bookings PLUS everything placed earlier in this run. Without
    // the second part the batch would be planned against stale availability
    // and would collide with itself.
    const working: OccupiedSlot[] = (
      await this.occupancy.load({
        orgId: req.orgId,
        schoolYearId: req.schoolYearId,
        scope: 'school-year',
      })
    ).map((o) => ({ ...o }));

    const items: DemandItem[] = [];

    for (const subject of scope.subjects) {
      for (const section of scope.sections) {
        if (section.level_id !== subject.level_id) continue;

        const requirement = resolveSessionRequirement(
          {
            sessionsPerWeek: subject.sessions_per_week,
            sessionMinutes: subject.session_minutes,
          },
          subject.program?.type ?? null,
          slot,
        );
        if (requirement.sessionMinutes > MAX_SESSION_MINUTES) continue;

        const item = this.buildItem(
          section,
          subject,
          requirement.sessionsPerWeek,
          requirement.sessionMinutes,
          scope,
          activeWeekdays,
        );

        // Prefer educators set to teach this subject; fall back to any active
        // educator so a fresh org still gets a usable plan (warning, not block).
        const preferred = scope.eligibleBySubject.get(subject.id) ?? [];
        const fallback = scope.allEducatorIds;
        const candidates = preferred.length > 0 ? preferred : fallback;

        // Whenever no one is set to teach this subject, say so — whether or not
        // placement then succeeds. An admin must know the assignment ignored
        // their subject preferences either way.
        if (preferred.length === 0) {
          item.warnings.push(
            'No educator is set to teach this subject; assigned to any available educator.',
          );
        }

        // Scarcest first, so a Tue/Thu-only educator is not consumed by a
        // subject that anyone could have taken.
        candidates.sort(
          (a, b) =>
            (scope.availability.get(a)?.length ?? 99) -
            (scope.availability.get(b)?.length ?? 99),
        );

        let placed = false;
        for (const educatorId of candidates) {
          const days =
            scope.customAvailability.has(educatorId)
              ? intersectWeekdays(
                  scope.availability.get(educatorId) ?? [],
                  activeWeekdays,
                )
              : activeWeekdays;
          if (days.length === 0) continue;

          const chosen = this.placeSlots({
            educatorId,
            sectionId: section.id,
            required: requirement.sessionsPerWeek,
            duration: requirement.sessionMinutes,
            days,
            freeRanges,
            working,
            activeWeekdays,
            blockedRanges,
          });

          // Partial placement is worse than none: it would create a class
          // whose shape does not match its declared requirement.
          if (chosen.length < requirement.sessionsPerWeek) continue;

          item.educatorId = educatorId;
          item.educatorName = scope.educatorName.get(educatorId) ?? null;
          item.slots = chosen;
          placed = true;

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
          break;
        }

        if (!placed) {
          item.unplacedReason =
            candidates.length === 0
              ? 'No active educator to assign.'
              : 'No free slot on an available school day.';
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
   * Greedily places `required` slots of `duration` minutes.
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
    duration: number;
    days: number[];
    freeRanges: { startMin: number; endMin: number }[];
    working: OccupiedSlot[];
    activeWeekdays: number[];
    blockedRanges: { startMin: number; endMin: number; label: string }[];
  }): { weekday: number; startMin: number; endMin: number }[] {
    const picked: { weekday: number; startMin: number; endMin: number }[] = [];
    const usedDays = new Set<number>();

    const tryDay = (weekday: number, allowRepeat: boolean): boolean => {
      if (usedDays.has(weekday) && !allowRepeat) return false;
      for (const range of args.freeRanges) {
        for (
          let start = range.startMin;
          start + args.duration <= range.endMin;
          start += 30
        ) {
          const candidate = {
            weekday,
            startMin: start,
            endMin: start + args.duration,
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

          picked.push({ weekday, startMin: start, endMin: start + args.duration });
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

  /** Everything the generator needs for the scope, read in a few queries. */
  private async loadScope(req: GenerateRequest) {
    const sectionWhere = {
      org_id: req.orgId,
      school_year_id: req.schoolYearId,
      deleted_at: null,
      level: { program_id: { in: req.programIds } },
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
        where: { org_id: req.orgId, level: { program_id: { in: req.programIds } } },
        select: {
          id: true,
          name: true,
          level_id: true,
          sessions_per_week: true,
          session_minutes: true,
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

    // Second pass: eligibility is keyed by subject id, which the first query
    // produced. Two round-trips beat one per subject.
    const eligibleBySubject = await this.educatorSubjects.getEligibleEducatorsBySubject(
      req.orgId,
      subjects.map((s) => s.id),
    );

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

    return {
      sections,
      subjects,
      eligibleBySubject,
      availability,
      customAvailability,
      educatorName,
      allEducatorIds: educators.map((e) => e.id),
    };
  }

  /**
   * Explains what is missing BEFORE the admin commits to anything.
   *
   * Missing optional configuration is a WARNING, not a blocker: a school that
   * has never set teachable subjects should still be able to generate, just
   * without subject preferences. Only genuinely impossible states block.
   */
  private buildReadiness(
    scope: Awaited<ReturnType<ClassGeneratorService['loadScope']>>,
    activeWeekdays: number[],
    req: GenerateRequest,
  ): ReadinessReport {
    const warnings: string[] = [];
    const blockers: string[] = [];

    if (activeWeekdays.length === 0) {
      blockers.push('The school has no active weekdays configured.');
    }
    if (scope.allEducatorIds.length === 0) {
      blockers.push('No active educators in this organization.');
    }
    if (scope.sections.length === 0) {
      blockers.push('No sections in the selected departments for this school year.');
    }
    if (scope.subjects.length === 0) {
      blockers.push('No subjects in the selected departments.');
    }
    if (scope.eligibleBySubject.size === 0) {
      warnings.push(
        'No educator has teachable subjects set. Subjects will be assigned to any available educator.',
      );
    }

    // The school-year conflict scope means a Semester 1 class already blocks the
    // same educator/section/time in Semester 2. Surfaced, not silently ignored.
    warnings.push(
      'Conflicts are checked across the whole school year, so existing classes in another semester will still block these slots.',
    );

    void req;
    return { ok: blockers.length === 0, activeWeekdays, warnings, blockers };
  }

  private buildItem(
    section: { id: string; name: string; level: { id: string; name: string } },
    subject: { id: string; name: string },
    sessionsPerWeek: number,
    sessionMinutes: number,
    scope: Awaited<ReturnType<ClassGeneratorService['loadScope']>>,
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
      educatorId: scope.eligibleBySubject.get(subject.id)?.[0] ?? null,
      educatorName: null,
      sessionsPerWeek,
      sessionMinutes,
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
