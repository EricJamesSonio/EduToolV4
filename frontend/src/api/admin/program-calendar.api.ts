// frontend/src/api/admin/program-calendar.api.ts

import client from "@/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HolidaySeed {
  key:         string;
  title:       string;
  month:       number;
  day:         number;
  description?: string;
  isDefault:   boolean;
  enabled:     boolean;
}

export interface CustomHoliday {
  title:        string;
  date:         string; // ISO date string
  description?: string;
}

export interface HolidayConfig {
  schoolYearId:   string;
  holidays:       HolidaySeed[];
  customHolidays: CustomHoliday[];
}

export interface CalendarBreak {
  id?:        string;
  label:      string;
  startDate:  string;
  endDate:    string;
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

// ── Requests ──────────────────────────────────────────────────────────────────

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

// ── API ───────────────────────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const programCalendarApi = {
  // ── Holiday config ───────────────────────────────────────────────────────

  getHolidayConfig: async (schoolYearId: string): Promise<HolidayConfig> => {
    const res = await client.get<HolidayConfig>("/program-calendars/holidays", {
      params: { schoolYearId },
    });
    // Backend returns directly (not wrapped in ApiResponse for this endpoint)
    return res.data;
  },

  saveHolidayConfig: async (data: SaveHolidayConfigRequest): Promise<HolidayConfig> => {
    const res = await client.post<HolidayConfig>("/program-calendars/holidays", data);
    return res.data;
  },

  seedHolidays: async (data: SeedHolidaysRequest): Promise<{ seeded: number }> => {
    const res = await client.post<{ seeded: number }>(
      "/program-calendars/holidays/seed",
      data,
    );
    return res.data;
  },

  // ── Program calendars ─────────────────────────────────────────────────────

  getAll: async (params: {
    schoolYearId?: string;
    programId?:    string;
  }): Promise<ProgramCalendar[]> => {
    const res = await client.get<ApiResponse<ProgramCalendar[]>>(
      "/program-calendars",
      { params },
    );
    return res.data.data ?? (res.data as unknown as ProgramCalendar[]);
  },

  getByProgram: async (
    programId:    string,
    schoolYearId: string,
  ): Promise<ProgramCalendar> => {
    const res = await client.get<ApiResponse<ProgramCalendar>>(
      "/program-calendars/by-program",
      { params: { programId, schoolYearId } },
    );
    return res.data.data ?? (res.data as unknown as ProgramCalendar);
  },

  create: async (data: CreateProgramCalendarRequest): Promise<ProgramCalendar> => {
    const res = await client.post<ApiResponse<ProgramCalendar>>(
      "/program-calendars",
      data,
    );
    return res.data.data ?? (res.data as unknown as ProgramCalendar);
  },

  update: async (
    id:   string,
    data: UpdateProgramCalendarRequest,
  ): Promise<ProgramCalendar> => {
    const res = await client.patch<ApiResponse<ProgramCalendar>>(
      `/program-calendars/${id}`,
      data,
    );
    return res.data.data ?? (res.data as unknown as ProgramCalendar);
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
    return res.data.data ?? (res.data as unknown as CalendarTerm[]);
  },
};