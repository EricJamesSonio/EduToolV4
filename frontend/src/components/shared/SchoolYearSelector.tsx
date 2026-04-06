"use client";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import type { SchoolYear } from "@/types/admin/school-year.types";
import { CalendarDays } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface Props {
  schoolYears: SchoolYear[];
  selectedId:  string | null;
  onChange:    (id: string) => void;
  isLoading?:  boolean;
}

export function SchoolYearSelector({ schoolYears, selectedId, onChange, isLoading }: Props) {
  const selected = schoolYears.find((sy) => sy.id === selectedId);

  if (isLoading) {
    return (
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
    );
  }

  if (schoolYears.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        No school years
      </div>
    );
  }

  return (
    <Select value={selectedId ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-56 h-9">
        <div className="flex items-center gap-2 truncate">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selected?.name ?? "Select school year"}
          </span>
          {selected && (
            <StatusBadge status={selected.status} className="ml-auto shrink-0" />
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {schoolYears.map((sy) => (
          <SelectItem key={sy.id} value={sy.id}>
            <div className="flex items-center gap-2">
              <span>{sy.name}</span>
              <StatusBadge status={sy.status} />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}