"use client";

import { use } from "react";
import { useProgramDetail } from "@/hooks/admin/useProgram";
import { ProgramUnitDetailView } from "@/components/admin/program/ProgramUnitDetailView";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string; courseId: string }>;
}): React.JSX.Element {
  const { id, courseId } = use(params);
  const { data: program, isLoading } = useProgramDetail(id);

  return (
    <ProgramUnitDetailView
      kind="course"
      unitId={courseId}
      program={program}
      isLoading={isLoading}
    />
  );
}