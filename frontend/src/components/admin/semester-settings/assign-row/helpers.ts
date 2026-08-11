// components/assign-row/helpers.ts
import type { AxiosError } from "axios"

export const errMsg = (e: unknown): string =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong."

export const toDateInput = (iso?: string | null): string =>
  iso ? iso.slice(0, 10) : ""

export const fmtLocalDate = (d: Date): string => {
  const y = String(d.getFullYear())
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export const addOneDay = (dateStr: string): string => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!parts) return ""
  const d = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
  if (Number.isNaN(d.getTime())) return ""
  d.setDate(d.getDate() + 1)
  return fmtLocalDate(d)
}