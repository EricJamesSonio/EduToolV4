"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import type { GradeRange } from "@/types/admin/grading-scale.types";
import { cn } from "@/lib/utils";

// ─── Validation ───────────────────────────────────────────────────────────────

export interface RangeValidationError {
  index?: number;
  message: string;
}

export function validateRanges(ranges: GradeRange[]): RangeValidationError[] {
  const errors: RangeValidationError[] = [];

  if (ranges.length === 0) {
    errors.push({ message: "At least one range is required." });
    return errors;
  }

  ranges.forEach((r, i) => {
    if (r.minPercent < 0 || r.maxPercent > 100) {
      errors.push({ index: i, message: "Values must be between 0 and 100." });
    }
    if (r.minPercent >= r.maxPercent) {
      errors.push({ index: i, message: "Min must be less than max." });
    }
    if (!r.gradeValue.trim()) {
      errors.push({ index: i, message: "Grade value is required." });
    }
  });

  if (errors.length > 0) return errors;

  const sorted = [...ranges].sort((a, b) => a.minPercent - b.minPercent);

  if (sorted[0].minPercent !== 0) {
    errors.push({ message: "Ranges must start at 0." });
  }
  if (sorted[sorted.length - 1].maxPercent !== 100) {
    errors.push({ message: "Ranges must end at 100." });
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (curr.minPercent <= prev.maxPercent) {
      errors.push({
        message: `Overlap detected between "${prev.gradeValue}" and "${curr.gradeValue}".`,
      });
    } else if (curr.minPercent !== prev.maxPercent + 1) {
      errors.push({
        message: `Gap detected between "${prev.gradeValue}" and "${curr.gradeValue}".`,
      });
    }
  }

  return errors;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Strips leading zeros, clamps to 0–100
const sanitizePercent = (value: string): number => {
  const num = Number(value.replace(/^0+/, ""));
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num));
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface GradingScaleRangeEditorProps {
  ranges: GradeRange[];
  onChange: (ranges: GradeRange[]) => void;
  disabled?: boolean;
  errors?: RangeValidationError[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GradingScaleRangeEditor({
  ranges,
  onChange,
  disabled = false,
  errors = [],
}: GradingScaleRangeEditorProps) {
  // ✅ Smart update: auto-adjust neighbors when min/max changes
  const updateSmart = useCallback(
    (index: number, patch: Partial<GradeRange>) => {
      const updated = ranges.map((r) => ({ ...r })); // deep-ish clone
      updated[index] = { ...updated[index], ...patch };

      // If max changed → push next row's min up
      if (patch.maxPercent !== undefined && updated[index + 1]) {
        updated[index + 1].minPercent = patch.maxPercent + 1;
      }

      // If min changed → pull previous row's max down
      if (patch.minPercent !== undefined && updated[index - 1]) {
        updated[index - 1].maxPercent = patch.minPercent - 1;
      }

      onChange(updated);
    },
    [ranges, onChange]
  );

  // ✅ Fixed: newMin = last.maxPercent + 1 (no off-by-one)
  const addRange = useCallback(() => {
    const last = ranges[ranges.length - 1];
    const newMin = last ? last.maxPercent + 1 : 0;
    const newMax = Math.min(newMin + 9, 100);

    onChange([
      ...ranges,
      {
        minPercent: newMin,
        maxPercent: newMax,
        gradeValue: "",
        remark: "",
        isPassing: false,
      },
    ]);
  }, [ranges, onChange]);

  const removeRange = useCallback(
    (index: number) => {
      onChange(ranges.filter((_, i) => i !== index));
    },
    [ranges, onChange]
  );

  // Row-level errors keyed by index
  const rowErrors = new Map<number, string[]>();
  const globalErrors: string[] = [];
  errors.forEach((e) => {
    if (e.index !== undefined) {
      const existing = rowErrors.get(e.index) ?? [];
      rowErrors.set(e.index, [...existing, e.message]);
    } else {
      globalErrors.push(e.message);
    }
  });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[80px_80px_120px_1fr_80px_32px] gap-2 px-1">
        {["Min %", "Max %", "Grade", "Remark", "Status", ""].map((h) => (
          <span key={h} className="text-xs font-medium text-muted-foreground not-interactive">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {ranges.map((range, i) => {
          const rowErrs = rowErrors.get(i) ?? [];
          return (
            <div key={i} className="space-y-1">
              <div
                className={cn(
                  "grid grid-cols-[80px_80px_120px_1fr_80px_32px] gap-2 items-center",
                  rowErrs.length > 0 &&
                    "ring-1 ring-destructive/40 rounded-md p-1"
                )}
              >
                {/* Min — sanitized, auto-adjusts prev max */}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={range.minPercent}
                  disabled={disabled}
                  className="h-8 text-sm"
                  onChange={(e) =>
                    updateSmart(i, { minPercent: sanitizePercent(e.target.value) })
                  }
                />
                {/* Max — sanitized, auto-adjusts next min */}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={range.maxPercent}
                  disabled={disabled}
                  className="h-8 text-sm"
                  onChange={(e) =>
                    updateSmart(i, { maxPercent: sanitizePercent(e.target.value) })
                  }
                />
                {/* Grade Value */}
                <Input
                  placeholder="e.g. 1.25"
                  value={range.gradeValue}
                  disabled={disabled}
                  className="h-8 text-sm"
                  onChange={(e) => updateSmart(i, { gradeValue: e.target.value })}
                />
                {/* Remark */}
                <Input
                  placeholder="e.g. Excellent"
                  value={range.remark}
                  disabled={disabled}
                  className="h-8 text-sm"
                  onChange={(e) => updateSmart(i, { remark: e.target.value })}
                />
                {/* Passing toggle */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => updateSmart(i, { isPassing: !range.isPassing })}
                  className="flex justify-start"
                >
                  <Badge
                    variant={range.isPassing ? "default" : "secondary"}
                    className={cn(
                      "cursor-pointer select-none text-xs transition-colors",
                      disabled && "opacity-50 cursor-not-allowed",
                      range.isPassing
                        ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30"
                        : "hover:bg-muted"
                    )}
                  >
                    {range.isPassing ? "Passing" : "Failing"}
                  </Badge>
                </button>
                {/* Delete */}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || ranges.length <= 1}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeRange(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {rowErrs.length > 0 && (
                <p className="text-xs text-destructive pl-1">
                  {rowErrs.join(" · ")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Global errors */}
      {globalErrors.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 space-y-0.5">
          {globalErrors.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-destructive"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              {e}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {!disabled && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={addRange}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Range
        </Button>
      )}

      {/* Visual 0–100 coverage bar */}
      {ranges.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-xs text-muted-foreground not-interactive">Coverage preview</p>
          <div className="relative h-5 w-full rounded overflow-hidden bg-muted">
            {[...ranges]
              .sort((a, b) => a.minPercent - b.minPercent)
              .map((r, i) => (
                <div
                  key={i}
                  title={`${r.gradeValue} (${r.minPercent}–${r.maxPercent}%)`}
                  className={cn(
                    "absolute top-0 h-full border-r border-background text-[10px] flex items-center justify-center overflow-hidden font-medium",
                    r.isPassing
                      ? "bg-emerald-500/30 text-emerald-800"
                      : "bg-rose-400/30 text-rose-800"
                  )}
                  style={{
                    left: `${r.minPercent}%`,
                    width: `${r.maxPercent - r.minPercent}%`,
                  }}
                >
                  {r.maxPercent - r.minPercent >= 8 ? r.gradeValue : ""}
                </div>
              ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground not-interactive">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      )}
    </div>
  );
}