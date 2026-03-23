// src/modules/academic-calendar/entity/academic-calendar.entity.ts

export type CalendarEventType =
  | 'holiday'
  | 'no_class_day'
  | 'exam_week'
  | 'special_event';

export class AcademicCalendarEntity {
  id: string;
  orgId: string;
  schoolYearId: string;
  title: string;
  type: CalendarEventType;
  startDate: Date;
  endDate: Date;
  description: string | null;
  isRetroactive: boolean; // true if created with a past date — for warning only
  createdAt: Date;
}