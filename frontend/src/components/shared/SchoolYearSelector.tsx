"use client";

import { useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { SchoolYear } from "@/types/admin/school-year.types";

interface SchoolYearSelectorProps {
  schoolYears: SchoolYear[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SchoolYearSelector({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
}: SchoolYearSelectorProps): React.JSX.Element {
  // Auto-select the active year (or first) when no selection exists yet
  useEffect(() => {
    if (!selectedId && schoolYears.length > 0) {
      const defaultId =
        schoolYears.find((sy) => sy.status === "active")?.id ??
        schoolYears[0].id;

      onSelect(defaultId);
    }
  }, [schoolYears, selectedId, onSelect]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full sm:w-64" />;
  }

  if (schoolYears.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No school years found.
      </p>
    );
  }

  const selected = schoolYears.find((sy) => sy.id === selectedId);

  return (
    <div className="flex w-full items-center gap-2">
      <CalendarDays className="h-5 w-5 shrink-0 text-primary" />

      <Select
        value={selectedId ?? ""}
        onValueChange={(value) => {
          if (value) onSelect(value);
        }}
      >
        <SelectTrigger className="w-full sm:w-64 h-10 text-sm">
          <span className="truncate">
            {selected?.name ?? "Select school year"}
          </span>
        </SelectTrigger>

        <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false} className="sm:min-w-[16rem]">
          {schoolYears.map((sy) => (
            <SelectItem
              key={sy.id}
              value={sy.id}
              className="text-sm"
            >
              <div className="flex w-full items-center gap-2">
                <span>{sy.name}</span>

                {sy.status === "active" && (
                  <Badge
                    variant="default"
                    className="ml-auto text-[10px]"
                  >
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}