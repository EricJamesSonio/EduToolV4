import type { Class } from "@/types/admin/class.types";
import { formatSchedule as formatScheduleShared } from "@/utils/classes.utils";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function formatSchedule(schedules: Class["schedules"] | undefined): string {
  return formatScheduleShared(schedules);
}