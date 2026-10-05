/**
 * Shared conflict detection for class schedules.
 *
 * Extracted from ClassService, which kept these as private methods that each
 * ran their own query per call. Two problems with that shape:
 *
 *   1. N+1 — checking N candidate slots meant N queries.
 *   2. Not reusable — the generator needs the same rules over hundreds of
 *      proposed slots, and re-implementing them would inevitably drift from
 *      the manual flow.
 *
 * So the rules live here as PURE functions over an in-memory occupancy index,
 * and the index itself is built by ONE query for the whole scope. Manual
 * creation and the generator therefore share a single definition of "conflict".
 *
 * All times are minutes-of-day. `ClassSchedule.start_time`/`end_time` are
 * DateTime columns whose date component is meaningless, so a stored timestamp
 * and a proposed "08:00" must be compared as wall-clock, never as Date.
 */

/** One booked interval, normalized to minutes-of-day. */
export interface OccupiedSlot {
  classId: string;
  weekday: number;
  startMin: number;
  endMin: number;
  educatorId: string;
  sectionId: string | null;
  roomId: string | null;
}

export type ConflictKind = 'educator' | 'section' | 'room' | 'day' | 'break';

export interface SlotConflict {
  kind: ConflictKind;
  /** Human-readable reason, safe to show an admin. */
  message: string;
  /** The already-booked class the conflict is with, when there is one. */
  againstClassId?: string;
}

/**
 * A candidate slot before it is persisted. `sectionId` is null for a class with
 * no section (the schema allows it), which simply skips section checks.
 */
export interface CandidateSlot {
  weekday: number;
  startMin: number;
  endMin: number;
  roomId?: string | null;
}

export interface OccupancyContext {
  educatorId: string;
  sectionId: string | null;
  /** The class being edited; its own slots must not count as conflicts. */
  excludeClassId?: string;
  /** The org's active weekdays; empty/undefined means "no weekday rule". */
  activeWeekdays?: number[];
  /** Break ranges in minutes-of-day. */
  blockedRanges?: { startMin: number; endMin: number; label: string }[];
}

/** True when two same-weekday wall-clock intervals overlap. */
export function slotsOverlap(
  a: { weekday: number; startMin: number; endMin: number },
  b: { weekday: number; startMin: number; endMin: number },
): boolean {
  if (a.weekday !== b.weekday) return false;
  return a.startMin < b.endMin && a.endMin > b.startMin;
}

/** The weekday rule: a day the school does not hold classes. */
export function isDayConflict(
  slot: CandidateSlot,
  activeWeekdays: number[] | undefined,
): SlotConflict | null {
  if (!activeWeekdays || activeWeekdays.length === 0) return null;
  if (activeWeekdays.includes(slot.weekday)) return null;
  return {
    kind: 'day',
    message: `The school does not hold classes on ${WEEKDAY_NAMES[slot.weekday] ?? `weekday ${slot.weekday}`}.`,
  };
}

/** The break rule: a range that intersects an org break, by label. */
export function isBreakConflict(
  slot: CandidateSlot,
  blockedRanges: { startMin: number; endMin: number; label: string }[] | undefined,
): SlotConflict | null {
  for (const b of blockedRanges ?? []) {
    if (slot.startMin < b.endMin && slot.endMin > b.startMin) {
      return {
        kind: 'break',
        message: `This range overlaps the ${b.label} break.`,
      };
    }
  }
  return null;
}

/**
 * The three booking conflicts, evaluated against the preloaded index.
 *
 * Returns EVERY conflict rather than the first, so a caller can explain the
 * whole picture instead of making the admin discover it one save at a time.
 */
export function findConflicts(
  slot: CandidateSlot,
  ctx: OccupancyContext,
  occupied: OccupiedSlot[],
): SlotConflict[] {
  const out: SlotConflict[] = [];

  const day = isDayConflict(slot, ctx.activeWeekdays);
  if (day) out.push(day);
  const brk = isBreakConflict(slot, ctx.blockedRanges);
  if (brk) out.push(brk);

  for (const o of occupied) {
    if (ctx.excludeClassId && o.classId === ctx.excludeClassId) continue;
    if (!slotsOverlap(slot, o)) continue;

    if (o.educatorId === ctx.educatorId) {
      out.push({
        kind: 'educator',
        message: `The educator already has a class on weekday ${slot.weekday} at an overlapping time.`,
        againstClassId: o.classId,
      });
    }
    if (ctx.sectionId && o.sectionId === ctx.sectionId) {
      out.push({
        kind: 'section',
        message: `The section already has a class on weekday ${slot.weekday} at an overlapping time.`,
        againstClassId: o.classId,
      });
    }
    if (slot.roomId && o.roomId === slot.roomId) {
      out.push({
        kind: 'room',
        message: `That room is already booked on weekday ${slot.weekday} at an overlapping time.`,
        againstClassId: o.classId,
      });
    }
  }
  return out;
}

/** Weekday index -> English name, matching the JS `getDay()` numbering. */
export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;