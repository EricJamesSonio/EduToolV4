"use client";

import { useState } from "react";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type PeriodMode = "day" | "week" | "month";

export interface PeriodFilterValue {
  mode: PeriodMode;
  anchor: Date;
}

export interface PeriodBounds {
  start: Date;
  end: Date;
}

const MODE_OPTIONS: { mode: PeriodMode; label: string }[] = [
  { mode: "day", label: "Daily" },
  { mode: "week", label: "Weekly" },
  { mode: "month", label: "Monthly" },
];

const PICKER_HINTS: Record<PeriodMode, string> = {
  day: "Select a date",
  week: "Select a week",
  month: "Select a month",
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function isPeriodMode(value: string): value is PeriodMode {
  return MODE_OPTIONS.some((option) => option.mode === value);
}

export function createDefaultPeriod(): PeriodFilterValue {
  return { mode: "month", anchor: new Date() };
}

export function resolvePeriodBounds(value: PeriodFilterValue): PeriodBounds {
  if (value.mode === "day") {
    return { start: value.anchor, end: value.anchor };
  }
  if (value.mode === "week") {
    return {
      start: startOfWeek(value.anchor, { weekStartsOn: 1 }),
      end: endOfWeek(value.anchor, { weekStartsOn: 1 }),
    };
  }
  return {
    start: startOfMonth(value.anchor),
    end: endOfMonth(value.anchor),
  };
}

export function describePeriod(value: PeriodFilterValue): string {
  const bounds = resolvePeriodBounds(value);
  if (value.mode === "day") return format(bounds.start, "MMM d, yyyy");
  if (value.mode === "week") {
    return `${format(bounds.start, "MMM d")} - ${format(bounds.end, "MMM d, yyyy")}`;
  }
  return format(bounds.start, "MMMM yyyy");
}

function shortLabel(value: PeriodFilterValue): string {
  const bounds = resolvePeriodBounds(value);
  if (value.mode === "day") return format(bounds.start, "MMM d, yyyy");
  if (value.mode === "week") {
    return `${format(bounds.start, "MMM d")} - ${format(bounds.end, "MMM d")}`;
  }
  return format(bounds.start, "MMM yyyy");
}

interface MonthPickerProps {
  value: PeriodFilterValue;
  year: number;
  onYearChange: (year: number) => void;
  onPick: (monthIndex: number) => void;
}

function MonthPicker({
  value,
  year,
  onYearChange,
  onPick,
}: MonthPickerProps): React.JSX.Element {
  const anchorYear = value.anchor.getFullYear();
  const anchorMonth = value.anchor.getMonth();

  return (
    <div className="w-[280px] p-2">
      <div className="mb-1 flex h-8 items-center justify-between px-1">
        <button
          type="button"
          aria-label="Previous year"
          onClick={() => onYearChange(year - 1)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            "text-muted-foreground",
          )}
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <span className="text-xs font-medium text-foreground">{year}</span>
        <button
          type="button"
          aria-label="Next year"
          onClick={() => onYearChange(year + 1)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-xs" }),
            "text-muted-foreground",
          )}
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 py-1">
        {MONTH_LABELS.map((label, index) => {
          const isSelected = year === anchorYear && index === anchorMonth;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onPick(index)}
              className={cn(
                "rounded-sm py-2.5 text-xs transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DashboardPeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
}

export function DashboardPeriodFilter({
  value,
  onChange,
}: DashboardPeriodFilterProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(value.anchor.getFullYear());
  const selectedMode = MODE_OPTIONS.find((option) => option.mode === value.mode);
  const bounds = resolvePeriodBounds(value);

  const handleOpenChange = (next: boolean): void => {
    if (next) setPickerYear(value.anchor.getFullYear());
    setOpen(next);
  };

  const handlePickMonth = (monthIndex: number): void => {
    onChange({ mode: "month", anchor: new Date(pickerYear, monthIndex, 1) });
    setOpen(false);
  };

  const handlePickWeek = (range: DateRange | undefined, clicked: Date): void => {
    const picked = clicked ?? range?.from;
    if (!picked) return;
    onChange({ mode: "week", anchor: picked });
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value.mode}
        onValueChange={(next) => {
          if (next && isPeriodMode(next)) {
            onChange({ mode: next, anchor: value.anchor });
          }
        }}
      >
        <SelectTrigger className="h-9 w-32 text-sm">
          <span className="truncate">{selectedMode?.label ?? "Monthly"}</span>
        </SelectTrigger>
        <SelectContent
          side="bottom"
          sideOffset={8}
          align="end"
          alignItemWithTrigger={false}
          className="min-w-32"
        >
          {MODE_OPTIONS.map((option) => (
            <SelectItem key={option.mode} value={option.mode} className="text-sm">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-label={PICKER_HINTS[value.mode]}
              title={describePeriod(value)}
              className="h-9 gap-2 px-3"
            >
              <CalendarIcon />
              <span className="hidden text-sm sm:inline">{shortLabel(value)}</span>
            </Button>
          }
        />
        <PopoverContent align="end" className="w-auto gap-0 p-0">
          <p className="px-3 pb-0 pt-2.5 text-xs font-medium text-muted-foreground">
            {PICKER_HINTS[value.mode]}
          </p>

          {value.mode === "day" && (
            <Calendar
              key="day"
              mode="single"
              selected={value.anchor}
              onSelect={(date) => {
                if (date) {
                  onChange({ mode: "day", anchor: date });
                  setOpen(false);
                }
              }}
              defaultMonth={value.anchor}
            />
          )}

          {value.mode === "week" && (
            <Calendar
              key="week"
              mode="range"
              weekStartsOn={1}
              selected={{ from: bounds.start, to: bounds.end }}
              onSelect={handlePickWeek}
              defaultMonth={value.anchor}
            />
          )}

          {value.mode === "month" && (
            <MonthPicker
              value={value}
              year={pickerYear}
              onYearChange={setPickerYear}
              onPick={handlePickMonth}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}