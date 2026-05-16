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

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

// ── Unwrap helper ─────────────────────────────────────────────────────────────

function unwrap<T>(res: { data: ApiResponse<T> | T }): T {
  const d = res.data as ApiResponse<T>;
  return d?.data !== undefined ? d.data : (res.data as T);
}

// ── API ───────────────────────────────────────────────────────────────────────

export const programCalendarApi = {
  // ── Holiday config ─────────────────────────────────────────────────────────

  getHolidayConfig: async (schoolYearId: string): Promise<HolidayConfig> => {
    const res = await client.get("/program-calendars/holidays", {
      params: { schoolYearId },
    });
    // Backend returns { schoolYearId, holidays: [...], customHolidays: [...] }
    // directly (not wrapped in ApiResponse)
    return res.data as HolidayConfig;
  },

  saveHolidayConfig: async (data: SaveHolidayConfigRequest): Promise<HolidayConfig> => {
    const res = await client.post("/program-calendars/holidays", data);
    return res.data as HolidayConfig;
  },

  seedHolidays: async (data: SeedHolidaysRequest): Promise<{ seeded: number }> => {
    const res = await client.post("/program-calendars/holidays/seed", data);
    return res.data as { seeded: number };
  },

  // ── Program calendars ──────────────────────────────────────────────────────

  getAll: async (params: {
    schoolYearId?: string;
    programId?:    string;
  }): Promise<ProgramCalendar[]> => {
    const res = await client.get("/program-calendars", { params });
    return unwrap<ProgramCalendar[]>(res);
  },

  /**
   * Returns null if no calendar exists yet for this program (404).
   * Components should treat null as "not set up yet".
   */
  getByProgram: async (
    programId:    string,
    schoolYearId: string,
  ): Promise<ProgramCalendar | null> => {
    try {
      const res = await client.get("/program-calendars/by-program", {
        params: { programId, schoolYearId },
      });
      return unwrap<ProgramCalendar>(res);
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  create: async (data: CreateProgramCalendarRequest): Promise<ProgramCalendar> => {
    const res = await client.post("/program-calendars", data);
    return unwrap<ProgramCalendar>(res);
  },

  update: async (
    id:   string,
    data: UpdateProgramCalendarRequest,
  ): Promise<ProgramCalendar> => {
    const res = await client.patch(`/program-calendars/${id}`, data);
    return unwrap<ProgramCalendar>(res);
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/program-calendars/${id}`);
  },

  getTerms: async (
    programId:    string,
    schoolYearId: string,
  ): Promise<CalendarTerm[]> => {
    const res = await client.get("/program-calendars/terms", {
      params: { programId, schoolYearId },
    });
    return unwrap<CalendarTerm[]>(res);
  },
};