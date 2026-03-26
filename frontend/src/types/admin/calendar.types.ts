export type CalendarEventType =
  | "holiday"
  | "no_class_day"
  | "exam_week"
  | "special_event";

export interface CalendarEvent {
  id: string;
  schoolYearId: string;
  date: string;
  type: CalendarEventType;
  title: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicCalendar {
  schoolYearId: string;
  events: CalendarEvent[];
}