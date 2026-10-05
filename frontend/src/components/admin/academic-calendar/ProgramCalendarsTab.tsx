// frontend/src/components/admin/academic-calendar/ProgramCalendarsTab.tsx
"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { CalendarDays, BookOpen } from "lucide-react";
import { programApi } from "@/api/admin/program.api";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgramCalendarCard } from "./ProgramCalendarCard";

interface Props {
  schoolYearId: string;
  schoolYearStart?: string;
  schoolYearEnd?: string;
}

function EmptyPanel({ icon: Icon, title, hint }: { icon: typeof CalendarDays; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium not-interactive">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-muted-foreground not-interactive">{hint}</p>}
    </div>
  );
}

export function ProgramCalendarsTab({ schoolYearId, schoolYearStart, schoolYearEnd }: Props) {
  const { data: programs = [], isLoading } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId),
    { enabled: !!schoolYearId },
  );

  if (!schoolYearId) {
    return (
      <EmptyPanel
        icon={CalendarDays}
        title="Select a school year"
        hint="Choose a school year from the top right to manage department calendars."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <EmptyPanel
        icon={BookOpen}
        title="No departments found"
        hint="There are no departments for this school year yet. Add one under Departments first."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground not-interactive">
        Define the Sem 1 and Sem 2 timelines per department — terms are auto-generated and stored for use in semester settings.
      </p>
      <div className="space-y-4">
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
    </div>
  );
}