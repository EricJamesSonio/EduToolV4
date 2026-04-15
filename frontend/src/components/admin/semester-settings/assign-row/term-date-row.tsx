// components/assign-row/term-date-row.tsx
"use client"

import { Input } from "@/components/ui/input"
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

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 p-2 border rounded">
      <Label className="text-[10px]">
        {term.semesterName} · {term.name}
      </Label>

      <Input
        type="date"
        className="h-7 text-xs"
        value={startDate}
        min={minStart || syMin}
        max={syMax}
        onChange={(e) => onDateChange(term.id, "startDate", e.target.value)}
      />

      <Input
        type="date"
        className="h-7 text-xs"
        value={endDate}
        min={startDate || syMin}
        max={syMax}
        onChange={(e) => onDateChange(term.id, "endDate", e.target.value)}
      />
    </div>
  )
}