"use client";

import { use, useState } from "react";
import { Pencil } from "lucide-react";
import { useProgramDetail } from "@/hooks/admin/useProgram";
import { PageHeader } from "@/components/shared/PageHeader";
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
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground not-interactive">
          Program not found.
        </p>
      </div>
    );
  }

  const showCourses = program.type === "college";
  const showStrands = program.type === "shs";
  const schoolYearId = program.schoolYearId;

  return (
    <div className="space-y-6">
      <PageHeader
        title={program.name}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Programs", href: "/admin/programs" },
          { label: program.name },
        ]}
        actions={
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        }
      />

      {/* INFO CARD */}
      <div className="rounded-lg border bg-card divide-y divide-border">
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Name</span>
          <span className="text-sm font-medium">{program.name}</span>
        </div>

        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Type</span>
          <Badge variant="outline" className="border-border text-muted-foreground">
            {PROGRAM_TYPE_LABELS[program.type] ?? program.type}
          </Badge>
        </div>

        {showCourses && (
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Courses</span>
            <span className="text-sm text-foreground">
              {program.courses?.length ?? 0}
            </span>
          </div>
        )}

        {showStrands && (
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Strands</span>
            <span className="text-sm text-foreground">
              {program.strands?.length ?? 0}
            </span>
          </div>
        )}
      </div>

      {/* COURSES / STRANDS — levels are managed inside each course/strand card */}
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

      {/* LEVELS — only for programs without courses/strands */}
      {!showCourses && !showStrands && schoolYearId && (
        <ProgramLevelsSection
          programId={id}
          schoolYearId={schoolYearId}
          programType={program.type}
        />
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
