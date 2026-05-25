"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, GraduationCap, Pencil } from "lucide-react";
import { useProgramDetail } from "@/hooks/admin/useProgram";
import { EditProgramDialog } from "@/components/admin/program/EditProgramDialog";
import { CoursesSection } from "@/components/admin/program/CoursesSection";
import { StrandsSection } from "@/components/admin/program/StrandsSection";
import { ProgramLevelsSection } from "@/components/admin/program/ProgramLevelsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgramType } from "@/types/admin/program.types";

const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare: "Daycare",
  kinder: "Kindergarten",
  elementary: "Elementary",
  jhs: "Junior High School",
  shs: "Senior High School",
  college: "College",
  custom: "Custom",
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
        <Skeleton className="h-40 w-full" />
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

  const showCourses = program.type === "college";
  const showStrands = program.type === "shs";
  const schoolYearId = program.schoolYearId;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* BACK LINK */}
      <Link
        href="/admin/programs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Programs
      </Link>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="icon-container bg-primary/10 text-primary mt-0.5">
            <GraduationCap className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              {program.name}
            </h1>

            <Badge variant="outline" className="border-border text-muted-foreground">
              {PROGRAM_TYPE_LABELS[program.type] ?? program.type}
            </Badge>
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* INFO CARD */}
      <div className="card-landing">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
          <span className="w-32 text-sm text-muted-foreground">Name</span>
          <span className="text-sm font-medium text-foreground">{program.name}</span>
        </div>

        <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
          <span className="w-32 text-sm text-muted-foreground">Type</span>
          <Badge variant="outline" className="border-border text-muted-foreground">
            {PROGRAM_TYPE_LABELS[program.type] ?? program.type}
          </Badge>
        </div>

        {showCourses && (
          <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
            <span className="w-32 text-sm text-muted-foreground">Courses</span>
            <span className="text-sm text-foreground">
              {program.courses?.length ?? 0}
            </span>
          </div>
        )}

        {showStrands && (
          <div className="flex items-center gap-4 px-4 py-3">
            <span className="w-32 text-sm text-muted-foreground">Strands</span>
            <span className="text-sm text-foreground">
              {program.strands?.length ?? 0}
            </span>
          </div>
        )}
      </div>

      {/* LEVELS */}
      {schoolYearId && (
        <ProgramLevelsSection
          programId={id}
          schoolYearId={schoolYearId}
          programType={program.type}
        />
      )}

      {/* SECTIONS */}
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
          program={program}
          schoolYearId={schoolYearId}
          strands={program.strands ?? []}
          isEnded={false}
        />
      )}

      {!showCourses && !showStrands && (
        <div className="card-landing px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            This program type doesn&rsquo;t use courses or strands.
          </p>
        </div>
      )}

      {/* EDIT DIALOG */}
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
