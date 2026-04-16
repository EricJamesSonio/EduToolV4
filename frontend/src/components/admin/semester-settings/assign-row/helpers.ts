// components/assign-row/helpers.ts
import type { AxiosError } from "axios"

export const errMsg = (e: unknown): string =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong."

export const toDateInput = (iso?: string | null): string =>
  iso ? iso.slice(0, 10) : ""

export const addOneDay = (dateStr: string): string => {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ""
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}