// components/assign-row/term-dates-panel.tsx
"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TermDateRow } from "./term-date-row"
import type { TermDatesMap, TermWithSemester } from "./types"
import { toDateInput } from "./helpers"

interface TermDatesPanelProps {
  allTerms: TermWithSemester[]
  termDates: TermDatesMap
  isValid: boolean
  savingDates: boolean
  syMin: string
  syMax: string
  onDateChange: (termId: string, field: "startDate" | "endDate", value: string) => void
  onSave: () => void
  onCancel: () => void
}

export function TermDatesPanel({
  allTerms,
  termDates,
  isValid,
  savingDates,
  syMin,
  syMax,
  onDateChange,
  onSave,
  onCancel,
}: TermDatesPanelProps) {
  return (
    <div className="ml-7 border bg-muted/30 p-3 space-y-3 rounded-md">
      {/* Header */}
      <div className="flex justify-between">
        <p className="text-xs text-muted-foreground">Set term dates</p>
        {!isValid && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertCircle className="h-3 w-3" />
            Missing dates
          </div>
        )}
      </div>

      {/* Term rows */}
      <div className="space-y-2">
        {allTerms.map((term, idx) => {
          const d = termDates[term.id] ?? { startDate: "", endDate: "" }
          const prevEndDate = idx > 0 ? (termDates[allTerms[idx - 1].id]?.endDate ?? "") : ""

          return (
            <TermDateRow
              key={term.id}
              term={term}
              startDate={d.startDate}
              endDate={d.endDate}
              prevEndDate={prevEndDate}
              syMin={syMin}
              syMax={syMax}
              onDateChange={onDateChange}
            />
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={savingDates || !isValid}>
          {savingDates ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}