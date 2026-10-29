import type { Class } from "@/types/admin/class.types";
import { formatHhmmForDisplay } from "@/utils/scheduleTime.utils";

export interface ClassSlot {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface SchedulableClass {
  classId: string;
  subjectId?: string;
  subjectName: string | null;
  semesterId: string;
  sectionName?: string | null;
  educatorName?: string | null;
  schedules: ClassSlot[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function toMin(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function slotsOverlap(a: ClassSlot, b: ClassSlot): boolean {
  if (a.weekday !== b.weekday) return false;
  return toMin(a.startTime) < toMin(b.endTime) && toMin(a.endTime) > toMin(b.startTime);
}

/** Two classes conflict only inside the same semester. */
export function classesConflict(a: SchedulableClass, b: SchedulableClass): boolean {
  if (a.classId === b.classId) return false;
  if (a.semesterId !== b.semesterId) return false;
  return a.schedules.some((sa) => b.schedules.some((sb) => slotsOverlap(sa, sb)));
}

export function findClassConflicts<T extends SchedulableClass>(items: T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (classesConflict(items[i], items[j])) pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

/** "Mon 7:00 AM - 8:30 AM, Wed 7:00 AM - 8:30 AM" */
export function formatClassSlots(schedules: ClassSlot[]): string {
  if (schedules.length === 0) return "No schedule yet";
  return [...schedules]
    .sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.weekday) - DAY_ORDER.indexOf(b.weekday) ||
        toMin(a.startTime) - toMin(b.startTime),
    )
    .map(
      (s) =>
        `${DAY_LABELS[s.weekday]} ${formatHhmmForDisplay(s.startTime)} - ${formatHhmmForDisplay(s.endTime)}`,
    )
    .join(", ");
}

/** Adapts request class views to the shape the shared schedule grid renders. */
export function toScheduleClasses(items: SchedulableClass[]): Class[] {
  return items.map(
    (c) =>
      ({
        id: c.classId,
        subjectId: c.subjectId ?? "",
        subjectName: c.subjectName,
        sectionName: c.sectionName ?? null,
        semesterId: c.semesterId,
        schedules: c.schedules.map((s, i) => ({
          id: `${c.classId}:${s.weekday}:${s.startTime}:${i}`,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }) as unknown as Class,
  );
}