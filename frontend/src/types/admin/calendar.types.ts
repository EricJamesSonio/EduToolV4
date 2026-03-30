export type CalendarEventType =
  | "holiday"
  | "no_class_day"
  | "exam_week"
  | "special_event";

export interface CalendarEvent {
  id: string;
  org_id: string;
  school_year_id: string;
  title: string;
  type: CalendarEventType;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  warning?: string | null;
}