// components/assign-row/helpers.ts
import type { AxiosError } from "axios"
import {
  addDaysToCalendarDate,
  normalizeDateInput,
} from "@/utils/datetime.util"

export const errMsg = (e: unknown): string =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong."

/**
 * TICK-INFRA-017: normalise any date the backend returns into YYYY-MM-DD
 * (tolerant of legacy 16:00Z rows — see normalizeDateInput).
 */
export const toDateInput = (iso?: string | null): string =>
  normalizeDateInput(iso)

/**
 * TICK-INFRA-017: the day after a "YYYY-MM-DD" string. Pure calendar math —
 * the old new Date()/setDate()/toISOString() version returned the WRONG day
 * in every zone east of UTC (Manila included).
 */
export const addOneDay = (dateStr: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return ""
  try {
    return addDaysToCalendarDate(dateStr, 1)
  } catch {
    return ""
  }
}