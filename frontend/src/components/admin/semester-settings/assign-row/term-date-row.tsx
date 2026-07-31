// components/assign-row/term-date-row.tsx
"use client"

import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import type { TermWithSemester } from "./types"
import { addOneDay } from "./helpers"

interface TermDateRowProps {
  term: TermWithSemester
  startDate: string
  endDate: string
  prevEndDate: string
  syMin: string
  syMax: string
  onDateChange: (termId: string, field: "startDate" | "endDate", value: string) => void
}

function parseISOToDate(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function TermDateRow({
  term,
  startDate,
  endDate,
  prevEndDate,
  syMin,
  syMax,
  onDateChange,
}: TermDateRowProps) {
  const minStart = prevEndDate ? addOneDay(prevEndDate) : syMin
  const minStartDate = parseISOToDate(minStart)
  const maxDate = parseISOToDate(syMax)
  const minEndDate = parseISOToDate(startDate) ?? minStartDate

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 p-2 border rounded items-end">
      <Label className="text-[10px] not-interactive self-center">
        {term.semesterName} · {term.name}
      </Label>

      <div className="w-[150px]">
        <DatePicker
          value={startDate}
          onChange={(v) => onDateChange(term.id, "startDate", v)}
          placeholder="Start date"
          disabled={(date) =>
            (minStartDate ? date < minStartDate : false) ||
            (maxDate ? date > maxDate : false)
          }
        />
      </div>

      <div className="w-[150px]">
        <DatePicker
          value={endDate}
          onChange={(v) => onDateChange(term.id, "endDate", v)}
          placeholder="End date"
          disabled={(date) =>
            (minEndDate ? date < minEndDate : false) ||
            (maxDate ? date > maxDate : false)
          }
        />
      </div>
    </div>
  )
}