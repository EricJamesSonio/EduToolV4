// frontend/src/api/admin/program-calendar.api.ts

import client from "@/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HolidaySeed {
  key:          string;
  title:        string;
  month:        number;
  day:          number;
  description?: string;
  isDefault:    boolean;
  enabled:      boolean;
  isMovable?:   boolean;
}

export interface CustomHoliday {
  title:        string;
  date:         string;
  description?: string;
}

export interface HolidayConfig {
  schoolYearId:   string;
  holidays:       HolidaySeed[];
  customHolidays: CustomHoliday[];
}

export interface CalendarBreak {
  id?:         string;
  label:       string;
  startDate:   string;
  endDate:     string;
  orderIndex?: number;
}

export interface CalendarTerm {
  id:         string;
  label:      string;
  startDate:  string;
  endDate:    string;
  orderIndex: number;
}

export interface ProgramCalendar {
  id:           string;
  orgId:        string;
  schoolYearId: string;
  programId:    string;
  startDate:    string;
  endDate:      string;
  notes:        string | null;
  createdAt:    string;
  updatedAt:    string;
  breaks:       CalendarBreak[];
  terms:        CalendarTerm[];
}

export interface SaveHolidayConfigRequest {
  schoolYearId:    string;
  enabledKeys:     string[];
  customHolidays?: CustomHoliday[];
}

export interface SeedHolidaysRequest {
  schoolYearId: string;
  year:         number;
}

export interface CreateProgramCalendarRequest {
  schoolYearId: string;
  programId:    string;
  startDate:    string;
  endDate:      string;
  notes?:       string;
  breaks?:      Omit<CalendarBreak, "id" | "orderIndex">[];
}

export interface UpdateProgramCalendarRequest {
  startDate?: string;
  endDate?:   string;
  notes?:     string;
  breaks?:    Omit<CalendarBreak, "id" | "orderIndex">[];
}

// ── Unwrap helper — every response is { success: true, data: T } ──────────────

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

function unwrap<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const programCalendarApi = {
  // ── Holiday config ─────────────────────────────────────────────────────────

  getHolidayConfig: async (schoolYearId: string): Promise<HolidayConfig> => {
    const res = await client.get<ApiResponse<HolidayConfig>>(
      "/program-calendars/holidays",
      { params: { schoolYearId } },
    );
    return unwrap(res);  // { success, data: { schoolYearId, holidays, customHolidays } }
  },

  saveHolidayConfig: async (data: SaveHolidayConfigRequest): Promise<HolidayConfig> => {
    const res = await client.post<ApiResponse<HolidayConfig>>(
      "/program-calendars/holidays",
      data,
    );
    return unwrap(res);
  },

  seedHolidays: async (data: SeedHolidaysRequest): Promise<{ seeded: number }> => {
    const res = await client.post<ApiResponse<{ seeded: number }>>(
      "/program-calendars/holidays/seed",
      data,
    );
    return unwrap(res);
  },

  // ── Program calendars ──────────────────────────────────────────────────────

  getAll: async (params: {
    schoolYearId?: string;
    programId?:    string;
  }): Promise<ProgramCalendar[]> => {
    const res = await client.get<ApiResponse<ProgramCalendar[]>>(
      "/program-calendars",
      { params },
    );
    return unwrap(res);
  },

  getByProgram: async (
    programId:    string,
    schoolYearId: string,
  ): Promise<ProgramCalendar | null> => {
    try {
      const res = await client.get<ApiResponse<ProgramCalendar>>(
        "/program-calendars/by-program",
        { params: { programId, schoolYearId } },
      );
      return unwrap(res);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  create: async (data: CreateProgramCalendarRequest): Promise<ProgramCalendar> => {
    const res = await client.post<ApiResponse<ProgramCalendar>>(
      "/program-calendars",
      data,
    );
    return unwrap(res);
  },

  update: async (
    id:   string,
    data: UpdateProgramCalendarRequest,
  ): Promise<ProgramCalendar> => {
    const res = await client.patch<ApiResponse<ProgramCalendar>>(
      `/program-calendars/${id}`,
      data,
    );
    return unwrap(res);
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/program-calendars/${id}`);
  },

  getTerms: async (
    programId:    string,
    schoolYearId: string,
  ): Promise<CalendarTerm[]> => {
    const res = await client.get<ApiResponse<CalendarTerm[]>>(
      "/program-calendars/terms",
      { params: { programId, schoolYearId } },
    );
    return unwrap(res);
  },
};