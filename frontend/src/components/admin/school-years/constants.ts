import type { CalendarEventType } from "@/types/admin/calendar.types";

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  holiday:       "Holiday",
  no_class_day:  "No Class Day",
  exam_week:     "Exam Week",
  special_event: "Special Event",
};

export type Tab = "overview" | "enrollment" | "programs";

export type ProgramDetailTab =
  | "levels"
  | "courses"
  | "strands"
  | "subjects"
  | "enrollment";