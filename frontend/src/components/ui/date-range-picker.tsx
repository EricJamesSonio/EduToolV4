"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  startDate: string // "YYYY-MM-DD" or ""
  endDate: string // "YYYY-MM-DD" or ""
  onChange: (range: { startDate: string; endDate: string }) => void
  className?: string
  placeholder?: string
}

function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function toDateInput(date: Date | undefined): string {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const range: DateRange | undefined = {
    from: parseLocalDate(startDate),
    to: parseLocalDate(endDate),
  }

  const handleSelect = (next: DateRange | undefined) => {
    onChange({
      startDate: toDateInput(next?.from),
      endDate: toDateInput(next?.to),
    })
    if (next?.from && next?.to) setOpen(false)
  }

  const label =
    range.from && range.to
      ? `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
      : range.from
        ? `${format(range.from, "MMM d, yyyy")} – …`
        : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !range.from && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-1" />
            {label}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={1}
          defaultMonth={range.from}
        />
      </PopoverContent>
    </Popover>
  )d
}