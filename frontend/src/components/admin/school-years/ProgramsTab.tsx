// frontend\src\components\admin\school-years\ProgramsTab.tsx
"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { ChevronRight, BookOpen, GraduationCap, Users } from "lucide-react";
import Link from "next/link";
import { programApi } from "@/api/admin/program.api";
import { useSchoolYearEnrollments } from "@/hooks/admin/useStudentEnrollment";
import { useEnrollmentDrilldown } from "@/components/admin/school-years/hooks/useEnrollmentDrilldown";
import type { Program } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from "@/types/admin/program.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge }    from "@/components/ui/badge";
import { cn }       from "@/lib/utils";
import { ProgramDetailView } from "./ProgramDetailView";

interface ProgramsTabProps {
  schoolYearId: string;
  isEnded:      boolean;
}

export function ProgramsTab({ schoolYearId, isEnded }: ProgramsTabProps): React.JSX.Element {
  const { state, selectProgram, backToPrograms } = useEnrollmentDrilldown();

  const { data: programs = [], isLoading: programsLoading } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId),
  );

  const { data: enrollmentsResponse = [], isLoading: enrollmentsLoading } =
    useSchoolYearEnrollments(schoolYearId);
  const enrollments = Array.isArray(enrollmentsResponse)
    ? enrollmentsResponse
    : enrollmentsResponse?.data ?? [];

  const selected = programs.find((p) => p.id === state.programId) ?? null;

  if (selected) {
    return (
      <ProgramDetailView
        program={selected}
        schoolYearId={schoolYearId}
        isEnded={isEnded}
        onBack={backToPrograms}
      />
    );
  }

  const isLoading = programsLoading || enrollmentsLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground not-interactive">
          No departments for this school year
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add departments from the{" "}
          <Link href="/admin/programs" className="text-primary hover:underline">
            Departments page
          </Link>{" "}
          or run the data seeder from Organization settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {programs.map((program) => {
        const typeLabel   = PROGRAM_TYPE_LABELS[program.type] ?? program.type;
        const typeColor   = PROGRAM_TYPE_COLORS[program.type] ?? "";
        const courseCount = program.courses?.length ?? 0;
        const strandCount = program.strands?.length ?? 0;
        const studentCount = enrollments.filter((e) =>
          e.programEnrollments?.some((pe) => pe.program_id === program.id),
        ).length;

        return (
          <button
            key={program.id}
            onClick={() => selectProgram(program.id)}
            className="w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-md shrink-0 mt-0.5", typeColor)}>
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{program.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-xs border", typeColor)}>
                      {typeLabel}
                    </Badge>
                    {courseCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {courseCount} {courseCount === 1 ? "course" : "courses"}
                      </span>
                    )}
                    {strandCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {strandCount} {strandCount === 1 ? "strand" : "strands"}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {studentCount} {studentCount === 1 ? "student" : "students"}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
}