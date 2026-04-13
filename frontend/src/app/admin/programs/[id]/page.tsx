"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, GraduationCap, Pencil } from "lucide-react";
import { useProgramDetail } from "@/hooks/admin/useProgram";
import { EditProgramDialog } from "@/components/admin/program/EditProgramDialog";
import { CoursesSection }    from "@/components/admin/program/CoursesSection";
import { StrandsSection }    from "@/components/admin/program/StrandsSection";
import { Badge }    from "@/components/ui/badge";
import { Button }   from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgramType } from "@/types/admin/program.types";

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare:    "Daycare",
  kinder:     "Kindergarten",
  elementary: "Elementary",
  jhs:        "Junior High School",
  shs:        "Senior High School",
  college:    "College",
  custom:     "Custom",
};

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const [editOpen, setEditOpen] = useState(false);

  const { data: program, isLoading } = useProgramDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (!program) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Program not found.
      </p>
    );
  }

  const showCourses  = program.type === "college";
  const showStrands  = program.type === "shs";
  const schoolYearId = program.schoolYearId;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Programs
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{program.name}</h1>
            <Badge variant={program.type === "custom" ? "outline" : "secondary"}>
              {PROGRAM_TYPE_LABELS[program.type] ?? program.type}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      <div className="rounded-lg border bg-card divide-y">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-32 text-sm text-muted-foreground shrink-0">Name</span>
          <span className="text-sm font-medium">{program.name}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-32 text-sm text-muted-foreground shrink-0">Type</span>
          <Badge variant={program.type === "custom" ? "outline" : "secondary"}>
            {PROGRAM_TYPE_LABELS[program.type] ?? program.type}
          </Badge>
        </div>
        {showCourses && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="w-32 text-sm text-muted-foreground shrink-0">Courses</span>
            <span className="text-sm">{program.courses?.length ?? 0}</span>
          </div>
        )}
        {showStrands && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="w-32 text-sm text-muted-foreground shrink-0">Strands</span>
            <span className="text-sm">{program.strands?.length ?? 0}</span>
          </div>
        )}
      </div>

  {showCourses && (
    <CoursesSection
      program={program}
      schoolYearId={schoolYearId}
      courses={program.courses ?? []}
      isEnded={false}
    />
  )}
  {showStrands && (
    <StrandsSection
      programId={id}
      schoolYearId={schoolYearId}
      strands={program.strands ?? []}
      isEnded={false}
    />
  )}

      {!showCourses && !showStrands && (
        <div className="rounded-lg border bg-card px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            This program type doesn&apos;t use courses or strands.
          </p>
        </div>
      )}

      {editOpen && (
        <EditProgramDialog
          program={program}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}