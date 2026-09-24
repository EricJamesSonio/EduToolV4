import { pick, shuffleArray } from './random.util';

export const SCHEDULE_WEEKDAYS = [0, 1, 2, 3, 4];

export interface ScheduleTimeWindow {
  start: string;
  end: string;
}

export interface SeedScheduleConfig {
  start_time: string;
  end_time: string;
  slot_duration: number;
}

export interface ScheduleSlotKey {
  weekday: number;
  start: string;
  end: string;
}

const toMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const fromMin = (n: number): string =>
  `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

export function buildScheduleWindows(cfg: SeedScheduleConfig): ScheduleTimeWindow[] {
  const block = Math.ceil(60 / cfg.slot_duration) * cfg.slot_duration;
  const out: ScheduleTimeWindow[] = [];
  for (let s = toMin(cfg.start_time); s + block <= toMin(cfg.end_time); s += block) {
    out.push({ start: fromMin(s), end: fromMin(s + block) });
  }
  return out;
}

export function scheduleKey(
  weekday: number,
  start: string,
  end: string,
): string {
  return `${weekday}|${start}|${end}`;
}

export function timeOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

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

export function findFreeSlot(
  educatorId: string,
  sectionId: string | null,
  educatorUsed: UsedMap,
  sectionUsed: UsedMap,
  windows: ScheduleTimeWindow[],
  excluded: string[] = [],
): (ScheduleSlotKey & { key: string }) | null {
  const free: Array<ScheduleSlotKey & { key: string }> = [];
  for (const weekday of SCHEDULE_WEEKDAYS) {
    for (const t of windows) {
      const key = scheduleKey(weekday, t.start, t.end);
      if (isUsed(educatorUsed, educatorId, key)) continue;
      if (sectionId && isUsed(sectionUsed, sectionId, key)) continue;
      if (excluded.includes(key)) continue;
      free.push({ weekday, start: t.start, end: t.end, key });
    }
  }
  return free.length ? pick(free) : null;
}

export function allocateScheduleSlot(
  educatorIds: string[],
  sectionId: string | null,
  educatorUsed: UsedMap,
  sectionUsed: UsedMap,
  windows: ScheduleTimeWindow[],
): { educator: string; slot: ScheduleSlotKey & { key: string } } | null {
  const ids = shuffleArray([...educatorIds]);
  for (const educator of ids) {
    const slot = findFreeSlot(educator, sectionId, educatorUsed, sectionUsed, windows);
    if (slot) return { educator, slot };
  }
  return null;
}