// frontend/src/components/admin/academic-calendar/BreakEditor.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CalendarBreak } from "@/api/admin/program-calendar.api";

interface Props {
  breaks:   CalendarBreak[];
  onChange: (breaks: CalendarBreak[]) => void;
}

export function BreakEditor({ breaks, onChange }: Props) {
  function addBreak() {
    onChange([
      ...breaks,
      { label: `Break ${breaks.length + 1}`, startDate: "", endDate: "" },
    ]);
  }

  function update(idx: number, field: keyof CalendarBreak, value: string) {
    onChange(breaks.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  }

  function remove(idx: number) {
    onChange(breaks.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {breaks.map((b, idx) => (
        <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Input
              value={b.label}
              onChange={(e) => update(idx, "label", e.target.value)}
              placeholder="Break label"
              className="h-7 text-xs w-40 border-0 bg-transparent p-0 font-medium focus-visible:ring-0"
            />
            <button
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
                onChange={(e) => update(idx, "startDate", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End</label>
              <Input
                type="date"
                value={b.endDate}
                onChange={(e) => update(idx, "endDate", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addBreak}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Plus className="h-3 w-3" /> Add Break
      </button>
    </div>
  );
}