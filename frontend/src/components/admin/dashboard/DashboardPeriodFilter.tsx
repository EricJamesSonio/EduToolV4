"use client";

import { useState } from "react";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface DashboardPeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
}

export function DashboardPeriodFilter({
  value,
  onChange,
}: DashboardPeriodFilterProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const selectedMode = MODE_OPTIONS.find((option) => option.mode === value.mode);

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

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Pick a date"
              title={describePeriod(value)}
            >
              <CalendarIcon />
            </Button>
          }
        />
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value.anchor}
            onSelect={(date) => {
              if (date) {
                onChange({ mode: value.mode, anchor: date });
                setOpen(false);
              }
            }}
            defaultMonth={value.anchor}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}