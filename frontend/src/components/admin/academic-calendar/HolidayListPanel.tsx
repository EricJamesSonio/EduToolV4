"use client";

// frontend/src/components/admin/academic-calendar/HolidayListPanel.tsx

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { cn }     from "@/lib/utils";
import type { HolidaySeed, CustomHoliday } from "@/api/admin/program-calendar.api";

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonthDay(month: number, day: number) {
  return `${MONTH_NAMES[month]} ${day}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Holiday Row ──────────────────────────────────────────────────────────────

function HolidayRow({
  holiday,
  onToggle,
}: {
  holiday:  HolidaySeed & { enabled: boolean };
  onToggle: (key: string, enabled: boolean) => void;
}) {
  return (
    <div
      onClick={() => onToggle(holiday.key, !holiday.enabled)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors select-none",
        holiday.enabled
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
          : "bg-card border-border hover:bg-muted/30",
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 transition-colors",
          holiday.enabled
            ? "bg-emerald-500 border-emerald-500"
            : "border-muted-foreground/40",
        )}
      >
        {holiday.enabled && <Check className="h-3 w-3 text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{holiday.title}</p>
        {holiday.description && (
          <p className="text-xs text-muted-foreground truncate">{holiday.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {formatMonthDay(holiday.month, holiday.day)}
        </span>
        {holiday.isMovable && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">movable</Badge>
        )}
        {holiday.isDefault && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">default</Badge>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface HolidayListPanelProps {
  holidays:       (HolidaySeed & { enabled: boolean })[];
  customHolidays: CustomHoliday[];
  enabledKeys:    Set<string>;
  onToggle:       (key: string, enabled: boolean) => void;
  onAddCustom:    (holiday: CustomHoliday) => void;
  onRemoveCustom: (idx: number) => void;
}

export function HolidayListPanel({
  holidays,
  customHolidays,
  enabledKeys,
  onToggle,
  onAddCustom,
  onRemoveCustom,
}: HolidayListPanelProps) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [newTitle,     setNewTitle]     = useState("");
  const [newDate,      setNewDate]      = useState("");
  const [newDesc,      setNewDesc]      = useState("");

  // Group holidays
  const regularHolidays = holidays.filter((h) => h.isDefault);
  const specialHolidays = holidays.filter((h) => !h.isDefault);

  function submitCustom() {
    if (!newTitle.trim() || !newDate) return;
    onAddCustom({
      title:       newTitle.trim(),
      date:        newDate,
      description: newDesc.trim() || undefined,
    });
    setNewTitle(""); setNewDate(""); setNewDesc("");
    setAddingCustom(false);
  }

  return (
    <div className="space-y-6">
      {/* Regular national holidays */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Regular National Holidays
          </p>
          <span className="text-xs text-muted-foreground">
            ({holidays.filter((h) => h.isDefault && enabledKeys.has(h.key)).length}/{regularHolidays.length} enabled)
          </span>
        </div>
        <div className="space-y-1.5">
          {regularHolidays.map((h) => (
            <HolidayRow key={h.key} holiday={h} onToggle={onToggle} />
          ))}
        </div>
      </div>

      {/* Special / optional holidays */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Special &amp; Optional Holidays
          </p>
          <span className="text-xs text-muted-foreground">
            ({holidays.filter((h) => !h.isDefault && enabledKeys.has(h.key)).length}/{specialHolidays.length} enabled)
          </span>
        </div>
        <div className="space-y-1.5">
          {specialHolidays.map((h) => (
            <HolidayRow key={h.key} holiday={h} onToggle={onToggle} />
          ))}
        </div>
      </div>

      {/* Custom holidays */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom Holidays ({customHolidays.length})
          </p>
          <button
            onClick={() => setAddingCustom(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add Custom
          </button>
        </div>

        {addingCustom && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Foundation Day"
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description (optional)</label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={submitCustom} disabled={!newTitle.trim() || !newDate}>
                Add Holiday
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingCustom(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {customHolidays.length === 0 && !addingCustom ? (
          <p className="text-xs text-muted-foreground py-2">
            No custom holidays added yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {customHolidays.map((ch, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ch.title}</p>
                  {ch.description && (
                    <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(ch.date)}
                </span>
                <button
                  onClick={() => onRemoveCustom(idx)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}