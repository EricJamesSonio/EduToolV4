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

  if (isLoading) return <Skeleton className="h-11 w-64" />;

  if (schoolYears.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No school years found.</p>
    );
  }

  const selected = schoolYears.find((sy) => sy.id === selectedId);

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0" />
      <Select
        value={selectedId ?? ""}
        onValueChange={(value) => {
          if (value) onSelect(value);
        }}
      >
        <SelectTrigger className="w-64 h-11 text-base border-2 border-primary bg-secondary">
          <span className="truncate font-medium">
            {selected?.name ?? "Select school year"}
          </span>
        </SelectTrigger>
        <SelectContent className="w-[16rem] min-w-[16rem]">
          {schoolYears.map((sy) => (
            <SelectItem key={sy.id} value={sy.id} className="text-base py-3">
              <div className="flex items-center gap-2 w-full">
                <span className="font-medium">{sy.name}</span>
                {sy.status === "active" && (
                  <Badge variant="default" className="text-xs py-0.5 px-2 font-semibold ml-auto">
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