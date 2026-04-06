// app/admin/programs/_components/SchoolYearSelector.tsx
"use client";

import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  if (isLoading) return <Skeleton className="h-9 w-48" />;

  if (schoolYears.length === 0) {
    return <p className="text-sm text-muted-foreground">No school years found.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={selectedId ?? ""} onValueChange={onSelect}>
        <SelectTrigger className="w-52 h-9 text-sm">
          <SelectValue placeholder="Select school year" />
        </SelectTrigger>
        <SelectContent>
          {schoolYears.map((sy) => (
            <SelectItem key={sy.id} value={sy.id}>
              <div className="flex items-center gap-2">
                <span>{sy.name}</span>
                {sy.status === "active" && (
                  <Badge variant="default" className="text-xs py-0 px-1.5">
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