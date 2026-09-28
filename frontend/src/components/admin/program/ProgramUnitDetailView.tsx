"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgramLevelsSection } from "./ProgramLevelsSection";
import { CourseDialog } from "./CourseDialog";
import { StrandDialog } from "./StrandDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Program } from "@/types/admin/program.types";

interface ProgramUnitDetailViewProps {
  kind: "course" | "strand";
  unitId: string;
  program: Program | undefined;
  isLoading: boolean;
}

export function ProgramUnitDetailView({
  kind,
  unitId,
  program,
  isLoading,
}: ProgramUnitDetailViewProps): React.JSX.Element {
  const [editOpen, setEditOpen] = useState(false);
  const label = kind === "course" ? "Course" : "Strand";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  const course = kind === "course" ? program?.courses?.find((c) => c.id === unitId) : undefined;
  const strand = kind === "strand" ? program?.strands?.find((s) => s.id === unitId) : undefined;
  const unit = course ?? strand;


  if (!program || !unit) {
    return (
      <div className="rounded-lg border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground not-interactive">{label} not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={unit.name}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Departments", href: "/admin/programs" },
          { label: program.name, href: `/admin/programs/${program.id}` },
          { label: unit.name },
        ]}
        actions={
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        }
      />

      <div className="rounded-lg border bg-card divide-y divide-border">
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Name</span>
          <span className="text-sm font-medium">{unit.name}</span>
        </div>
        {course?.code && (
          <div className="flex items-center gap-6 px-6 py-4">
            <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Code</span>
            <Badge variant="outline" className="font-mono text-xs">{course.code}</Badge>
          </div>
        )}
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0 not-interactive">Department</span>
          <span className="text-sm">{program.name}</span>
        </div>
      </div>

      <ProgramLevelsSection
        programId={program.id}
        schoolYearId={program.schoolYearId}
        programType={program.type}
        courseId={course?.id}
        strandId={strand?.id}
      />

      {editOpen && course && (
        <CourseDialog
          programId={program.id}
          schoolYearId={program.schoolYearId}
          course={{ id: course.id, name: course.name, code: course.code }}
          open
          onClose={() => setEditOpen(false)}
        />
      )}
      {editOpen && strand && (
        <StrandDialog
          programId={program.id}
          schoolYearId={program.schoolYearId}
          strand={{ id: strand.id, name: strand.name }}
          open
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}