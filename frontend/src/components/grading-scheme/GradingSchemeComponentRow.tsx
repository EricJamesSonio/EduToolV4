"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ComponentType, GradingSchemeComponentDto } from "@/types/admin/grading-scheme.types";

const COMPONENT_TYPES: { value: ComponentType; label: string }[] = [
  { value: "quiz",     label: "Quiz" },
  { value: "activity", label: "Activity" },
  { value: "exam",     label: "Exam" },
  { value: "custom",   label: "Custom" },
  { value: "manual",   label: "Manual Entry" },
];

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
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
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
          type="number"
          min={0}
          max={100}
          value={row.weight}
          disabled={disabled}
          className="w-[72px] tabular-nums"
          onChange={(e) => onChange(index, "weight", Number(e.target.value))}
        />
        <span className="text-sm text-muted-foreground">%</span>
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