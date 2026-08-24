/**
 * schedule.util.ts
 *
 * Keeps a single, deterministic set of candidate weekly slots so the seed
 * never generates two classes for the same educator (or section) that
 * collide in time. Conflicts inside the same school year are what the
 * runtime API forbids. Used by both seedClasses (initial allocation) and
 * repairScheduleConflicts (post-hoc reconciliation).
 */

import { pick, shuffleArray } from './random.util';

export const SCHEDULE_WEEKDAYS = [0, 1, 2, 3, 4];
export const SCHEDULE_TIME_WINDOWS: Array<{ start: string; end: string }> = [
  { start: '07:00', end: '08:00' },
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
];

export interface ScheduleSlotKey {
  weekday: number;
  start: string;
  end: string;
}

export function scheduleKey(
  weekday: number,
  start: string,
  end: string,
): string {
  return `${weekday}|${start}|${end}`;
}

/** Extract "HH:MM" from a Date for stable slot keys. */
export function timeOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Build a Date anchored to the school-year start (consistent with seed style). */
export function scheduleDate(hhmm: string, anchor?: Date): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = anchor ? new Date(anchor) : new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export type UsedMap = Map<string, Set<string>>;

export function usedAdd(map: UsedMap, id: string, key: string): void {
  if (!map.has(id)) map.set(id, new Set<string>());
  map.get(id)!.add(key);
}

export function isUsed(map: UsedMap, id: string, key: string): boolean {
  return map.get(id)?.has(key) ?? false;
}

/** Find a free weekly slot for the given educator + optional section. */
export function findFreeSlot(
  educatorId: string,
  sectionId: string | null,
  educatorUsed: UsedMap,
  sectionUsed: UsedMap,
  excluded: string[] = [],
): (ScheduleSlotKey & { key: string }) | null {
  const free: Array<ScheduleSlotKey & { key: string }> = [];
  for (const weekday of SCHEDULE_WEEKDAYS) {
    for (const t of SCHEDULE_TIME_WINDOWS) {
      const key = scheduleKey(weekday, t.start, t.end);
      if (isUsed(educatorUsed, educatorId, key)) continue;
      if (sectionId && isUsed(sectionUsed, sectionId, key)) continue;
      if (excluded.includes(key)) continue;
      free.push({ weekday, start: t.start, end: t.end, key });
    }
  }
  return free.length ? pick(free) : null;
}

/** Allocate a free slot for any eligible educator (shuffled order for variety). */
export function allocateScheduleSlot(
  educatorIds: string[],
  sectionId: string | null,
  educatorUsed: UsedMap,
  sectionUsed: UsedMap,
): { educator: string; slot: ScheduleSlotKey & { key: string } } | null {
  const ids = shuffleArray([...educatorIds]);
  for (const educator of ids) {
    const slot = findFreeSlot(educator, sectionId, educatorUsed, sectionUsed);
    if (slot) return { educator, slot };
  }
  return null;
}
