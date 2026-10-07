// components/assign-row/helpers.ts
import type { AxiosError } from "axios"
import {
  addDaysToCalendarDate,
  calendarDateOf,
} from "@/utils/datetime.util"

export const errMsg = (e: unknown): string =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong."

/**
 * TICK-INFRA-017: normalise any date the backend returns into YYYY-MM-DD.
 * Tolerant of legacy 16:00Z rows (which a plain slice(0, 10) mislabels by a
 * day); date-only strings pass through untouched.
 */
export const toDateInput = (iso?: string | null): string => {
  if (!iso) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  try {
    return calendarDateOf(iso)
  } catch {
    return ""
  }
}

export const fmtLocalDate = (d: Date): string => {
  const y = String(d.getFullYear())
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

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