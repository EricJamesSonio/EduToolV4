// frontend/src/components/admin/academic-calendar/ProgramCalendarsTab.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, BookOpen } from "lucide-react";
import { programApi } from "@/api/admin/program.api";
import { Skeleton }   from "@/components/ui/skeleton";
import { ProgramCalendarCard } from "./ProgramCalendarCard";

interface Props {
  schoolYearId:     string;
  schoolYearStart?: string;
  schoolYearEnd?:   string;
}

export function ProgramCalendarsTab({ schoolYearId, schoolYearStart, schoolYearEnd }: Props) {
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId),
    enabled:  !!schoolYearId,
  });

  if (!schoolYearId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground not-interactive">
          Select a school year to manage program calendars.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground not-interactive">
          No programs found for this school year.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground not-interactive">
        Define break periods per program — terms are auto-generated and stored for use in semester settings.
      </p>
      {programs.map((program) => (
        <ProgramCalendarCard
          key={program.id}
          programId={program.id}
          programName={program.name}
          schoolYearId={schoolYearId}
          schoolYearStart={schoolYearStart}
          schoolYearEnd={schoolYearEnd}
        />
      ))}
    </div>
  );
}