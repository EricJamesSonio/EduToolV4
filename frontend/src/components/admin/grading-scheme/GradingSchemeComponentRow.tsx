"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentType, GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";

const COMPONENT_TYPES: { value: ComponentType; label: string }[] = [
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
  index:     number;
  row:       GradingSchemeComponentDto;
  disabled:  boolean;
  onChange:  (index: number, field: keyof GradingSchemeComponentDto, value: string | number | boolean) => void;
  onDelete:  (index: number) => void;
}

export function GradingSchemeComponentRow({
  index,
  row,
  disabled,
  onChange,
  onDelete,
}: GradingSchemeComponentRowProps) {
  return (
    <div className={cn(
      "grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-l-4 pl-3",
      TYPE_COLORS[row.type] ?? "border-l-gray-500"
    )}>
      {/* Name */}
      <Input
        value={row.name}
        disabled={disabled}
        placeholder="e.g. Quizzes"
        onChange={(e) => onChange(index, "name", e.target.value)}
      />

      {/* Type */}
      <Select
        value={row.type}
        disabled={disabled}
        onValueChange={(v) => onChange(index, "type", v as ComponentType)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMPONENT_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Weight */}
      <div className="flex items-center gap-1.5">
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={row.weight}
          disabled={disabled}
          className="w-[72px] tabular-nums"
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            onChange(index, "weight", raw === "" ? 0 : Math.min(100, Number(raw)));
          }}
        />
        <span className="text-sm text-muted-foreground not-interactive">%</span>
      </div>

      {/* Delete */}
      <Button
        size="icon"
        variant="ghost"
        disabled={disabled}
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(index)}
        title="Remove component"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}