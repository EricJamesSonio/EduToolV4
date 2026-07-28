"use client";

// frontend/src/components/admin/academic-calendar/HolidayCalendarGrid.tsx
// Reusable visual calendar grid. Shows holidays marked on dates.
// Clicking a day opens a popover to enable/disable or add a custom holiday.

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, X } from "lucide-react";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { cn }      from "@/lib/utils";
import type { HolidaySeed, CustomHoliday } from "@/api/admin/program-calendar.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarkedDay {
  date:      Date;
  label:     string;
  type:      "system" | "custom";
  key?:      string;   // system holiday key
  enabled:   boolean;
  isMovable?: boolean;
}

interface DayCell {
  date:    Date;
  inMonth: boolean;
  marks:   MarkedDay[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function buildCells(year: number, month: number): DayCell[] {
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startPad  = firstDay.getDay(); // 0=Sun
  const cells: DayCell[] = [];

  // Prev month padding
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, inMonth: false, marks: [] });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true, marks: [] });
  }
  // Next month padding to fill 6 rows
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), inMonth: false, marks: [] });
  }
  return cells;
}

// ─── Day Popover ──────────────────────────────────────────────────────────────

function DayPopover({
  date,
  marks,
  onToggle,
  onAddCustom,
  onClose,
}: {
  date:        Date;
  marks:       MarkedDay[];
  onToggle:    (key: string, enabled: boolean) => void;
  onAddCustom: (holiday: CustomHoliday) => void;
  onClose:     () => void;
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customTitle,  setCustomTitle]  = useState("");
  const [customDesc,   setCustomDesc]   = useState("");

  const dateStr = date.toLocaleDateString("en-PH", {
    weekday: "long", month: "long", day: "numeric",
  });

  function toLocalDateString(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function submitCustom() {
    if (!customTitle.trim()) return;
    onAddCustom({
      title:       customTitle.trim(),
      date:        toLocalDateString(date),
      description: customDesc.trim() || undefined,
    });
    setCustomTitle(""); setCustomDesc(""); setAddingCustom(false);
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1.5 w-64
                 rounded-lg border bg-popover shadow-lg p-3 space-y-3 text-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-xs leading-tight">{dateStr}</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Existing marks */}
      {marks.length > 0 && (
        <div className="space-y-1.5">
          {marks.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              {m.type === "system" && m.key ? (
                <button
                  onClick={() => onToggle(m.key!, !m.enabled)}
                  className={cn(
                    "flex items-center gap-1.5 flex-1 text-left rounded px-2 py-1 text-xs transition-colors",
                    m.enabled
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border shrink-0",
                      m.enabled ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40",
                    )}
                  >
                    {m.enabled && <Check className="h-2.5 w-2.5 text-white" />}
                  </span>
                  <span className="truncate">{m.label}</span>
                  {m.isMovable && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">movable</Badge>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 flex-1 rounded px-2 py-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                  <span className="w-4 h-4 rounded-full bg-blue-400 shrink-0" />
                  <span className="truncate">{m.label}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">custom</Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add custom */}
      {!addingCustom ? (
        <button
          onClick={() => setAddingCustom(true)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> Add custom holiday
        </button>
      ) : (
        <div className="space-y-2">
          <Input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Holiday title"
            className="h-7 text-xs"
            autoFocus
          />
          <Input
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="Description (optional)"
            className="h-7 text-xs"
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-6 text-xs px-2" onClick={submitCustom} disabled={!customTitle.trim()}>
              Add
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setAddingCustom(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────

interface HolidayCalendarGridProps {
  /** Year to display */
  year: number;
  /** System holidays with enabled status */
  holidays:       HolidaySeed[];
  /** Custom holidays added by admin */
  customHolidays: CustomHoliday[];
  /** Called when a system holiday is toggled */
  onToggleHoliday:  (key: string, enabled: boolean) => void;
  /** Called when admin adds a custom holiday from a day cell */
  onAddCustom:      (holiday: CustomHoliday) => void;
}

export function HolidayCalendarGrid({
  year,
  holidays,
  customHolidays,
  onToggleHoliday,
  onAddCustom,
}: HolidayCalendarGridProps) {
  const [month,       setMonth]       = useState(new Date().getMonth());
  const [openDayKey,  setOpenDayKey]  = useState<string | null>(null);

  // Build a map: "YYYY-MM-DD" → MarkedDay[]
  const marksMap = useMemo(() => {
    const map = new Map<string, MarkedDay[]>();

    function addMark(date: Date, mark: MarkedDay) {
      const key = date.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(mark);
    }

    // System holidays
    for (const h of holidays) {
      const date = new Date(year, h.month - 1, h.day);
      addMark(date, {
        date,
        label:     h.title,
        type:      "system",
        key:       h.key,
        enabled:   h.enabled,
        isMovable: h.isMovable,
      });
    }

    // Custom holidays
    for (const ch of customHolidays) {
      const date = new Date(ch.date);
      addMark(date, {
        date,
        label:   ch.title,
        type:    "custom",
        enabled: true,
      });
    }

    return map;
  }, [holidays, customHolidays, year]);

  const cells = useMemo(() => {
    const raw = buildCells(year, month);
    return raw.map((cell) => {
      const key = cell.date.toISOString().slice(0, 10);
      return { ...cell, marks: marksMap.get(key) ?? [] };
    });
  }, [year, month, marksMap]);

  const today = new Date();

  function prevMonth() {
    setMonth((m) => (m === 0 ? 11 : m - 1));
    setOpenDayKey(null);
  }
  function nextMonth() {
    setMonth((m) => (m === 11 ? 0 : m + 1));
    setOpenDayKey(null);
  }

  return (
    <div className="rounded-xl border bg-card select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground rounded-t-xl">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-base font-semibold text-primary-foreground not-interactive">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2 border-b bg-muted/10 text-xs text-muted-foreground not-interactive">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Enabled holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Disabled holiday
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" /> Custom
        </span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-primary/10">
        {WEEKDAY_HEADERS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-primary not-interactive"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const dayKey  = cell.date.toISOString().slice(0, 10);
          const isToday = isSameDay(cell.date, today);
          const isOpen  = openDayKey === dayKey;

          const enabledMarks  = cell.marks.filter((m) => m.enabled);
          const disabledMarks = cell.marks.filter((m) => !m.enabled && m.type === "system");

          return (
            <div
              key={idx}
              className={cn(
                "relative min-h-[72px] border-b border-r p-1.5 cursor-pointer transition-colors",
                !cell.inMonth && "bg-muted/20",
                cell.inMonth  && "hover:bg-muted/30",
                isOpen        && "bg-primary/5 ring-1 ring-inset ring-primary/30",
              )}
              onClick={() => setOpenDayKey(isOpen ? null : dayKey)}
            >
              {/* Day number */}
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1",
                  !cell.inMonth && "text-muted-foreground/40",
                  cell.inMonth  && "text-foreground",
                  isToday       && "bg-primary text-primary-foreground",
                )}
              >
                {cell.date.getDate()}
              </span>

              {/* Holiday dots / labels */}
              <div className="space-y-0.5">
                {enabledMarks.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "truncate rounded px-1 text-[10px] leading-4 font-medium",
                      m.type === "custom"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
                    )}
                  >
                    {m.label}
                  </div>
                ))}
                {disabledMarks.length > 0 && enabledMarks.length === 0 && (
                  <div className="truncate rounded px-1 text-[10px] leading-4 text-muted-foreground/50 bg-muted/40">
                    {disabledMarks[0].label}
                  </div>
                )}
              </div>

              {/* Popover */}
              {isOpen && (
                <DayPopover
                  date={cell.date}
                  marks={cell.marks}
                  onToggle={(key, enabled) => {
                    onToggleHoliday(key, enabled);
                    setOpenDayKey(null);
                  }}
                  onAddCustom={(ch) => {
                    onAddCustom(ch);
                    setOpenDayKey(null);
                  }}
                  onClose={() => setOpenDayKey(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}