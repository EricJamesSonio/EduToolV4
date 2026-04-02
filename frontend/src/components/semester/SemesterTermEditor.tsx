"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import type { TermInput } from "@/api/admin/semester.api";
import { cn } from "@/lib/utils";

const TERM_SUGGESTIONS = ["Prelim", "Midterm", "Pre-Finals", "Finals"];

function addOneDay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ─── Term Name Input with suggestion dropdown ─────────────────────────────────

function TermNameInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = TERM_SUGGESTIONS.filter(
    (s) => !value || s.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <div className="flex">
        <Input
          placeholder="e.g. Prelim, Midterm"
          value={value}
          disabled={disabled}
          className="h-8 text-sm rounded-r-none border-r-0"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "h-8 px-1.5 border border-l-0 rounded-r-md bg-background hover:bg-muted transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 w-full rounded-md border bg-popover shadow-md py-1">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                value === s && "bg-accent/50 font-medium"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SemesterTermEditorProps {
  terms: TermInput[];
  semesterStartDate: string;
  semesterEndDate: string;
  onChange: (terms: TermInput[]) => void;
  errors?: Record<number, string[]>;
  disabled?: boolean;
}

export function SemesterTermEditor({
  terms,
  semesterStartDate,
  semesterEndDate,
  onChange,
  errors = {},
  disabled = false,
}: SemesterTermEditorProps) {
  const update = (index: number, patch: Partial<TermInput>) => {
    onChange(terms.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const add = () => {
    const last = terms[terms.length - 1];
    const smartStart = last?.endDate
      ? addOneDay(last.endDate)
      : semesterStartDate;
    // Clamp endDate so it's never before smartStart
    const smartEnd = semesterEndDate > smartStart ? semesterEndDate : smartStart;
    onChange([
      ...terms,
      {
        name: "",
        orderIndex: terms.length + 1,
        startDate: smartStart,
        endDate: smartEnd,
      },
    ]);
  };

  const remove = (index: number) => {
    const next = terms
      .filter((_, i) => i !== index)
      .map((t, i) => ({ ...t, orderIndex: i + 1 }));
    onChange(next);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...terms];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(next.map((t, i) => ({ ...t, orderIndex: i + 1 })));
  };

  return (
    <div className="space-y-2">
      {terms.length === 0 && (
        <p className="text-xs text-muted-foreground py-1">
          No terms yet. Add at least one term.
        </p>
      )}

      {/* Column labels */}
      {terms.length > 0 && (
        <div className="grid grid-cols-[28px_1fr_140px_140px_28px] gap-1.5">
          {["", "Term Name", "Start Date", "End Date", ""].map((h, i) => (
            <span key={i} className="text-[10px] text-muted-foreground pl-0.5">
              {h}
            </span>
          ))}
        </div>
      )}

      {terms.map((term, i) => {
        const rowErrors = errors[i] ?? [];
        return (
          <div key={i} className="space-y-1">
            <div className="grid grid-cols-[28px_1fr_140px_140px_28px] gap-1.5 items-start">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 pt-1">
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => move(i, -1)}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={disabled || i === terms.length - 1}
                  onClick={() => move(i, 1)}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              {/* Name with suggestions */}
              <TermNameInput
                value={term.name}
                disabled={disabled}
                onChange={(v) => update(i, { name: v })}
              />

              {/* Start */}
              <Input
                type="date"
                value={term.startDate}
                disabled={disabled}
                className="h-8 text-sm"
                min={semesterStartDate}
                max={semesterEndDate}
                onChange={(e) => update(i, { startDate: e.target.value })}
              />

              {/* End */}
              <Input
                type="date"
                value={term.endDate}
                disabled={disabled}
                className="h-8 text-sm"
                min={semesterStartDate}
                max={semesterEndDate}
                onChange={(e) => update(i, { endDate: e.target.value })}
              />

              {/* Delete */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                className="h-8 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => remove(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {rowErrors.length > 0 && (
              <p className="text-xs text-destructive pl-7">
                {rowErrors.join(" · ")}
              </p>
            )}
          </div>
        );
      })}

      {!disabled && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs mt-1"
          onClick={add}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Term
        </Button>
      )}
    </div>
  );
}