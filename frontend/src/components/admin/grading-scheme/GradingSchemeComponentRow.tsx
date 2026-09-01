"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentType, GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";

// Exported so other components (e.g. GradingSchemeEditor) can reuse the same
// canonical list/order — used for picking smart defaults and for computing
// which types are "already used" across rows.
export const COMPONENT_TYPES: { value: ComponentType; label: string }[] = [
  { value: "written_work",         label: "Written Work" },
  { value: "performance_task",     label: "Performance Task" },
  { value: "quarterly_assessment", label: "Quarterly Assessment" },
  { value: "exam",                 label: "Exam" },
  { value: "quiz",                 label: "Quiz" },
  { value: "assignment",           label: "Assignment" },
  { value: "project",              label: "Project" },
  { value: "recitation",           label: "Recitation" },
  { value: "participation",        label: "Participation" },
  { value: "behavior",             label: "Behavior" },
  { value: "attendance",           label: "Attendance" },
  { value: "activity",             label: "Activity" },
  { value: "custom",               label: "Custom" },
  { value: "other",                label: "Other" },
];

const TYPE_COLORS: Record<string, string> = {
  written_work:         "border-l-blue-500",
  performance_task:     "border-l-emerald-500",
  quarterly_assessment: "border-l-purple-500",
  exam:                 "border-l-amber-500",
  quiz:                 "border-l-teal-500",
  assignment:           "border-l-indigo-500",
  project:              "border-l-pink-500",
  recitation:           "border-l-cyan-500",
  participation:        "border-l-orange-500",
  behavior:             "border-l-rose-500",
  attendance:           "border-l-blue-500",
  activity:             "border-l-emerald-500",
  custom:               "border-l-purple-500",
  other:                "border-l-gray-500",
};

interface GradingSchemeComponentRowProps {
  index:      number;
  row:        GradingSchemeComponentDto;
  disabled:   boolean;
  /** Types already selected by OTHER rows — these get grayed out / disabled in this row's dropdown. */
  usedTypes?:  ComponentType[];
  onChange:   (index: number, field: keyof GradingSchemeComponentDto, value: string | number | boolean) => void;
  onDelete:   (index: number) => void;
}

export function GradingSchemeComponentRow({
  index,
  row,
  disabled,
  usedTypes = [],
  onChange,
  onDelete,
}: GradingSchemeComponentRowProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 bg-card/60 p-3 shadow-sm sm:p-3",
        TYPE_COLORS[row.type] ?? "border-l-gray-500"
      )}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(150px,0.9fr)_minmax(110px,0.7fr)_auto] sm:items-end">
        {/* Name */}
        <div className="min-w-0">
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">Name</label>
          <Input
            value={row.name}
            disabled={disabled}
            placeholder={COMPONENT_TYPES.find((t) => t.value === row.type)?.label ?? ""}
            className="h-10 bg-background text-sm"
            onChange={(e) => onChange(index, "name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:contents">
          {/* Type */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">Type</label>
            <Select
              value={row.type}
              disabled={disabled}
              onValueChange={(v) => onChange(index, "type", v as ComponentType)}
            >
              <SelectTrigger className="h-10 w-full bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_TYPES.map((t) => {
                  const isTakenElsewhere = t.value !== row.type && usedTypes.includes(t.value);
                  return (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      disabled={isTakenElsewhere}
                      className={cn(isTakenElsewhere && "text-muted-foreground")}
                    >
                      {t.label}
                      {isTakenElsewhere && (
                        <span className="ml-1 text-xs text-muted-foreground not-interactive">
                          (already added)
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Weight */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">Weight</label>
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={row.weight}
                disabled={disabled}
                className="h-10 w-full bg-background pr-8 tabular-nums text-sm"
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  onChange(index, "weight", raw === "" ? 0 : Math.min(100, Number(raw)));
                }}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Delete */}
        <Button
          size="icon"
          variant="ghost"
          disabled={disabled}
          className="h-10 w-10 justify-self-end text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:justify-self-center"
          onClick={() => onDelete(index)}
          title="Remove component"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}