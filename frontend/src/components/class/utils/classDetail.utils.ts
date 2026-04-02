import type { Class } from "@/types/admin/class.types";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function formatSchedule(schedules: Class["schedules"] | undefined): string {
  if (!schedules?.length) return "—";
  return schedules
    .map((s) => `${WEEKDAY_LABELS[s.weekday]} ${s.startTime}–${s.endTime}`)
    .join(", ");
}