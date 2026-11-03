"use client";

import { CalendarRange } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GroupedSemester } from "@/api/admin/program.api";

export const ALL_SEMESTERS = "all";

interface SemesterSelectorProps {
  /**
   * One entry per selectable semester, already deduped by id by the caller
   * (the same physical semester row can exist under several programs — it
   * still filters as one semester).
   */
  options: GroupedSemester[];
  isLoading: boolean;
  /** A semester id, or ALL_SEMESTERS. */
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

function optionLabel(o: GroupedSemester): string {
  return `${o.semesterName} - ${o.programName}`;
}

export function SemesterSelector({
  options,
  isLoading,
  selectedId,
  onSelect,
  disabled = false,
}: SemesterSelectorProps): React.JSX.Element {
  if (isLoading) {
    return <Skeleton className="h-10 w-full sm:w-64" />;
  }

  const selected =
    selectedId !== ALL_SEMESTERS
      ? (options.find((o) => o.semesterId === selectedId) ?? null)
      : null;

  return (
    <div className="flex w-full items-center gap-2">
      <CalendarRange className="h-5 w-5 shrink-0 text-primary" />

      <Select
        value={selectedId}
        onValueChange={(value) => {
          if (value) onSelect(value);
        }}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger
          className="w-full sm:w-64 h-10 text-sm"
          aria-label="Semester filter"
        >
          <SelectValue placeholder="All Semesters">
            {selected ? optionLabel(selected) : "All Semesters"}
          </SelectValue>
        </SelectTrigger>

        <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false} className="sm:min-w-[16rem]">
          <SelectItem value={ALL_SEMESTERS} className="text-sm">
            All Semesters
          </SelectItem>
          {options.map((o) => (
            <SelectItem
              key={o.semesterId}
              value={o.semesterId}
              className="text-sm"
            >
              {optionLabel(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
