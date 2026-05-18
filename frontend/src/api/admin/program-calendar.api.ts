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

/** Org-global — not scoped to any school year */
export interface HolidayConfig {
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

export interface CalendarHoliday {
  id:          string;
  holidayKey:  string | null;
  title:       string;
  date:        string;
  description: string | null;
  type:        "system" | "custom";
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
  holidays:     CalendarHoliday[]; // inherited from OrgHolidayConfig at creation/re-sync
}

// ── Requests ──────────────────────────────────────────────────────────────────

/** No schoolYearId — config is org-global */
export interface SaveHolidayConfigRequest {
  enabledKeys:     string[];
  customHolidays?: CustomHoliday[];
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

// ── Unwrap — every response is { success: true, data: T } ────────────────────

interface ApiResponse<T> { success: boolean; data: T; }
function unwrap<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const programCalendarApi = {
  // ── Holiday base config (org-global) ──────────────────────────────────────

  /** Get the org's global holiday config — not scoped to any school year */
  getHolidayConfig: async (): Promise<HolidayConfig> => {
    const res = await client.get<ApiResponse<HolidayConfig>>(
      "/program-calendars/holidays",
    );
    return unwrap(res);
  },

  /**
   * Save the org's global holiday config.
   * Backend automatically re-syncs ProgramCalendarHoliday rows for ALL
   * existing program calendars in the org.
   */
  saveHolidayConfig: async (
    data: SaveHolidayConfigRequest,
  ): Promise<HolidayConfig & { synced: number }> => {
    const res = await client.post<ApiResponse<HolidayConfig & { synced: number }>>(
      "/program-calendars/holidays",
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

  /** Returns null if no calendar exists yet for this program (404) */
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