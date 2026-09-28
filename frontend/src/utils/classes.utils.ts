export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const DAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export interface SlotInput {
  weekday: number;
  startTime: string;
  endTime: string;
}

interface ScheduleLike {
  weekday: number;
  startTime: string;
  endTime: string;
}

export function timeToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function slotsOverlap(a: SlotInput, b: SlotInput): boolean {
  if (a.weekday !== b.weekday) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseClockMinutes(value: string): number | null {
  if (!value) return null;
  const plain = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (plain) return Number(plain[1]) * 60 + Number(plain[2]);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

function formatMinutes(total: number): string {
  const hours24 = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function formatScheduleLines(
  schedules: ScheduleLike[] | null | undefined,
): string[] {
  if (!schedules?.length) return [];

  const groups = new Map<string, { start: number; end: number; days: Set<number> }>();
  for (const s of schedules) {
    const start = parseClockMinutes(s.startTime);
    const end = parseClockMinutes(s.endTime);
    if (start === null || end === null) continue;
    const key = `${start}-${end}`;
    const group = groups.get(key) ?? { start, end, days: new Set<number>() };
    group.days.add(s.weekday);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      group,
      days: DAY_DISPLAY_ORDER.filter((d) => group.days.has(d)),
    }))
    .filter((item) => item.days.length > 0)
    .sort(
      (a, b) =>
        DAY_DISPLAY_ORDER.indexOf(a.days[0]) - DAY_DISPLAY_ORDER.indexOf(b.days[0]) ||
        a.group.start - b.group.start,
    )
    .map(
      ({ group, days }) =>
        `${days.map((d) => WEEKDAY_LABELS[d]).join(", ")} · ${formatMinutes(group.start)} – ${formatMinutes(group.end)}`,
    );
}

export function formatSchedule(
  schedules: ScheduleLike[] | null | undefined,
): string {
  const lines = formatScheduleLines(schedules);
  return lines.length > 0 ? lines.join("  |  ") : "—";
}