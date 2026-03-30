import client from "@/api/client";
import type { CalendarEvent } from "@/types/admin/calendar.types";

export type CalendarEventType =
  | "holiday"
  | "no_class_day"
  | "exam_week"
  | "special_event";

export interface CreateCalendarEventRequest {
  schoolYearId: string;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  type?: CalendarEventType;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export const academicCalendarApi = {
  getAll: async (schoolYearId: string): Promise<CalendarEvent[]> => {
    const res = await client.get<{ success: boolean; data: CalendarEvent[] }>(
      "/academic-calendar",
      { params: { schoolYearId } }
    );
    return res.data.data;
  },

  create: async (data: CreateCalendarEventRequest): Promise<CalendarEvent> => {
    const res = await client.post<{ success: boolean; data: CalendarEvent }>(
      "/academic-calendar",
      data
    );
    return res.data.data;
  },

  update: async (id: string, data: UpdateCalendarEventRequest): Promise<CalendarEvent> => {
    const res = await client.patch<{ success: boolean; data: CalendarEvent }>(
      `/academic-calendar/${id}`,
      data
    );
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/academic-calendar/${id}`);
  },
};