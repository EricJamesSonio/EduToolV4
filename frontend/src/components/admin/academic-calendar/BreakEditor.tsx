// frontend/src/components/admin/academic-calendar/BreakEditor.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CalendarBreak } from "@/api/admin/program-calendar.api";

interface Props {
  breaks:        CalendarBreak[];
  onChange:      (breaks: CalendarBreak[]) => void;
  calendarStart: string;
  calendarEnd:   string;
}

function toLocalDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return toLocalDateString(d);
}

export function BreakEditor({ breaks, onChange, calendarStart, calendarEnd }: Props) {
  const [blockedMsg, setBlockedMsg] = useState("");
  const lastIdx = breaks.length - 1;
  const isLockedStart = (idx: number) => idx === 0 && breaks.length > 0;
  const isLockedEnd   = (idx: number) => idx === lastIdx && breaks.length > 0;

  function addBreak() {
    clearBlocked();
    let startVal = "";
    let endVal   = "";
    if (breaks.length === 0) {
      // First break: start = calendar start, end = empty (user fills)
      startVal = calendarStart;
    } else {
      // Subsequent break: start = day after previous break end
      const prevEnd = breaks[breaks.length - 1].endDate;
      startVal = prevEnd ? nextDay(prevEnd) : "";
    }
    onChange([
      ...breaks,
      { label: `Break ${breaks.length + 1}`, startDate: startVal, endDate: endVal },
    ]);
  }

  function update(idx: number, field: keyof CalendarBreak, value: string) {
    const updated = breaks.map((b, i) => (i === idx ? { ...b, [field]: value } : b));

    // Auto-advance next break start when this break's end changes
    if (field === "endDate") {
      for (let i = idx + 1; i < updated.length; i++) {
        const prevEnd = updated[i - 1].endDate;
        if (prevEnd) {
          updated[i] = { ...updated[i], startDate: nextDay(prevEnd) };
        }
      }
      // Last break end always = calendarEnd (locked in the view, but we auto-set)
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], endDate: calendarEnd };
      }
    }

    onChange(updated);
  }

  function remove(idx: number) {
    // Enforce a minimum of two breaks — block when only two exist.
    if (breaks.length <= 2) {
      setBlockedMsg("A minimum of two breaks is required. You cannot remove a break when only two exist.");
      return;
    }
    setBlockedMsg("");
    onChange(breaks.filter((_, i) => i !== idx));
  }

  function clearBlocked() {
    if (blockedMsg) setBlockedMsg("");
  }

  return (
    <div className="space-y-2">
      {breaks.map((b, idx) => {
        const lockStart = isLockedStart(idx);
        const lockEnd   = isLockedEnd(idx);

        return (
          <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Input
                value={b.label}
                onChange={(e) => { clearBlocked(); update(idx, "label", e.target.value); }}
                placeholder="Break label"
                className="h-7 text-xs w-40 border-0 bg-transparent p-0 font-medium focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start</label>
                <Input
                  type="date"
                  value={b.startDate}
                  onChange={(e) => { clearBlocked(); update(idx, "startDate", e.target.value); }}
                  className={`h-8 text-xs ${lockStart ? "opacity-50 pointer-events-none" : ""}`}
                  readOnly={lockStart}
                  tabIndex={lockStart ? -1 : undefined}
                />
                {lockStart && (
                  <p className="text-[10px] text-muted-foreground/60 not-interactive">Locked to calendar start</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End</label>
                <Input
                  type="date"
                  value={b.endDate}
                  onChange={(e) => { clearBlocked(); update(idx, "endDate", e.target.value); }}
                  className={`h-8 text-xs ${lockEnd ? "opacity-50 pointer-events-none" : ""}`}
                  readOnly={lockEnd}
                  tabIndex={lockEnd ? -1 : undefined}
                />
                {lockEnd && (
                  <p className="text-[10px] text-muted-foreground/60 not-interactive">Locked to calendar end</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {blockedMsg && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
          <p className="text-xs text-destructive">{blockedMsg}</p>
        </div>
      )}
      <button
        type="button"
        onClick={addBreak}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Plus className="h-3 w-3" /> Add Break
      </button>
    </div>
  );
}
