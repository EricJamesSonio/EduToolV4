import client from "@/api/client";
import type { AcademicCalendar, CalendarEventType } from "@/types/admin/calendar.types";

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

export interface CalendarEventResponse extends AcademicCalendar {
  warning: string | null;
}

export const academicCalendarApi = {
  getAll: async (schoolYearId: string): Promise<AcademicCalendar[]> => {
    const res = await client.get<AcademicCalendar[]>("/academic-calendar", {
      params: { schoolYearId },
    });
    return res.data;
  },
  create: async (data: CreateCalendarEventRequest): Promise<CalendarEventResponse> => {
    const res = await client.post<CalendarEventResponse>("/academic-calendar", data);
    return res.data;
  },
  update: async (id: string, data: UpdateCalendarEventRequest): Promise<CalendarEventResponse> => {
    const res = await client.patch<CalendarEventResponse>(`/academic-calendar/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await client.delete(`/academic-calendar/${id}`);
  },
};