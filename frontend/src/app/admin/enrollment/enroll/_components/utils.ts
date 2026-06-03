import type { ClassSchedule } from "@/types/admin/class.types";

export function formatSchedule(schedules: ClassSchedule[]): string {
  if (!schedules || schedules.length === 0) return "No schedule";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return schedules.map(s =>
    `${weekdays[s.weekday]} ${s.startTime}–${s.endTime}`
  ).join(", ");
}
