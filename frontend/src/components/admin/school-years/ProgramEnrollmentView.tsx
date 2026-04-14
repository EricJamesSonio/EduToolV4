// frontend\src\components\admin\enrollment\program-view\ProgramEnrollmentView.tsx
"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolYearEnrollments } from "@/hooks/admin/useStudentEnrollment";
import { studentApi } from "@/api/admin/student.api";
import { CollegeEnrollmentView } from "./program-view/CollegeEnrollmentView";
import { SHSEnrollmentView }     from "./program-view/SHSEnrollmentView";
import { GenericEnrollmentView } from "./program-view/GenericEnrollmentView";
import type { Program } from "@/types/admin/program.types";
import type { Level }   from "@/types/admin/level.types";
import type { Student } from "@/types/admin/student.types";

interface ProgramEnrollmentViewProps {
  program:      Program;
  schoolYearId: string;
  levels:       Level[];
  isEnded:      boolean;
}

export function ProgramEnrollmentView({
  program,
  schoolYearId,
  levels,
  isEnded,
}: ProgramEnrollmentViewProps) {
  const { data: allEnrollments = [], isLoading: enrollmentsLoading } =
    useSchoolYearEnrollments(schoolYearId);

  const { data: allStudentsRaw = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["admin", "students", "all"],
    queryFn:  () => studentApi.getAll(),
    select:   (data) => (Array.isArray(data) ? data : []),
  });

  // Build student_id → fullName map once, shared by all child views
  const studentMap = useMemo(() => {
    const map = new Map<string, string>();
    (allStudentsRaw as Student[]).forEach((s) => map.set(s.id, s.fullName));
    return map;
  }, [allStudentsRaw]);

  const programLevels = levels.filter((l) => l.program_id === program.id);
  const isLoading     = enrollmentsLoading || studentsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const sharedProps = {
    program,
    programLevels,
    allEnrollments,
    schoolYearId,
    isEnded,
    studentMap, // ← passed to all views
  };

  if (program.type === "college") return <CollegeEnrollmentView {...sharedProps} />;
  if (program.type === "shs")     return <SHSEnrollmentView     {...sharedProps} />;
  return                                  <GenericEnrollmentView {...sharedProps} />;
}