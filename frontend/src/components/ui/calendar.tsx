"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type CalendarView = "days" | "months" | "years"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  month: controlledMonth,
  defaultMonth,
  onMonthChange,
  ...props
}: DayPickerProps) {
  const [view, setView] = React.useState<CalendarView>("days")
  const [viewDate, setViewDate] = React.useState<Date>(
    controlledMonth ?? defaultMonth ?? new Date()
  )
  const [yearRangeStart, setYearRangeStart] = React.useState(
    () => viewDate.getFullYear() - 6
  )

  const goToMonth = (next: Date) => {
    setViewDate(next)
    onMonthChange?.(next)
  }

  const handlePickYear = (year: number) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1))
    setView("months")
  }

  const handlePickMonth = (monthIndex: number) => {
    goToMonth(new Date(viewDate.getFullYear(), monthIndex, 1))
    setView("days")
  }

  return (
    <div className={cn("p-2 w-[280px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between h-8 px-1 mb-1">
        {view === "days" && (
          <button
            type="button"
            onClick={() =>
              goToMonth(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
            }
            className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "text-muted-foreground")}
          >
            <ChevronLeft className="size-3.5" />
          </button>
        )}
        {view === "years" && (
          <button
            type="button"
            onClick={() => setYearRangeStart((y) => y - 12)}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "text-muted-foreground")}
          >
            <ChevronLeft className="size-3.5" />
          </button>
        )}
        {view === "months" && <span className="size-6" />}

        <button
          type="button"
          onClick={() => setView(view === "years" ? "months" : "years")}
          className="text-xs font-medium text-foreground hover:bg-muted rounded-[var(--radius-sm)] px-2 py-1 transition-colors"
        >
          {view === "days" && `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
          {view === "months" && viewDate.getFullYear()}
          {view === "years" && `${yearRangeStart} – ${yearRangeStart + 11}`}
        </button>

        {view === "days" && (
          <button
            type="button"
            onClick={() =>
              goToMonth(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
            }
            className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "text-muted-foreground")}
          >
            <ChevronRight className="size-3.5" />
          </button>
        )}
        {view === "years" && (
          <button
            type="button"
            onClick={() => setYearRangeStart((y) => y + 12)}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }), "text-muted-foreground")}
          >
            <ChevronRight className="size-3.5" />
          </button>
        )}
        {view === "months" && <span className="size-6" />}
      </div>

      {/* Years view */}
      {view === "years" && (
        <div className="grid grid-cols-3 gap-1 py-1">
          {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handlePickYear(year)}
              className={cn(
                "text-xs py-2 rounded-[var(--radius-sm)] hover:bg-muted transition-colors",
                year === viewDate.getFullYear()
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-foreground"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Months view */}
      {view === "months" && (
        <div className="grid grid-cols-3 gap-1 py-1">
          {MONTH_NAMES.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => handlePickMonth(i)}
              className={cn(
                "text-xs py-2.5 rounded-[var(--radius-sm)] hover:bg-muted transition-colors",
                i === viewDate.getMonth()
                  ? "bg-primary text-primary-foreground hover:bg-primary"
                  : "text-foreground"
              )}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {/* Days view */}
      {view === "days" && (
        <DayPicker
          showOutsideDays={showOutsideDays}
          month={viewDate}
          onMonthChange={goToMonth}
          components={{ Nav: () => null }}
          classNames={{
            months: "flex flex-col",
            month: "flex flex-col gap-1 !w-fit",
            month_caption: "hidden",
            month_grid: "!w-fit border-collapse",
            weekdays: "!bg-transparent",
            weekday:
              "!p-0 !border-0 !text-center text-muted-foreground w-9 h-7 font-normal text-[0.65rem] uppercase align-middle",
            day: "!p-0 !border-0 relative text-center text-xs size-9",
            day_button: cn(
              "size-9 rounded-[var(--radius-sm)] p-0 font-normal text-foreground text-xs",
              "hover:bg-muted transition-colors",
              "aria-selected:opacity-100"
            ),
            range_start:
              "bg-primary/10 rounded-l-[var(--radius-sm)] [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
            range_end:
              "bg-primary/10 rounded-r-[var(--radius-sm)] [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
            range_middle:
              "bg-primary/10 [&>button]:bg-transparent [&>button]:hover:bg-primary/20 [&>button]:rounded-none",
            selected: "[&>button]:bg-primary [&>button]:text-primary-foreground",
            today: "[&>button]:border [&>button]:border-primary",
            outside: "text-muted-foreground/40",
            disabled: "text-muted-foreground/30 opacity-50",
            hidden: "invisible",
            ...classNames,
          }}
          {...props}
        />
      )}
    </div>
  )
}

export { Calendar }