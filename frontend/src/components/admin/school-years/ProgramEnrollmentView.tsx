// frontend\src\components\admin\enrollment\program-view\ProgramEnrollmentView.tsx
"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchoolYearEnrollments } from "@/hooks/admin/useStudentEnrollment";
import { CollegeEnrollmentView } from "./program-view/CollegeEnrollmentView";
import { SHSEnrollmentView }     from "./program-view/SHSEnrollmentView";
import { GenericEnrollmentView } from "./program-view/GenericEnrollmentView";
import type { Program } from "@/types/admin/program.types";
import type { Level }   from "@/types/admin/level.types";

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
  const { data: allEnrollments = [], isLoading } = useSchoolYearEnrollments(schoolYearId);

  const programLevels = levels.filter((l) => l.program_id === program.id);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const sharedProps = { program, programLevels, allEnrollments, schoolYearId, isEnded };

  if (program.type === "college") return <CollegeEnrollmentView {...sharedProps} />;
  if (program.type === "shs")     return <SHSEnrollmentView     {...sharedProps} />;
  return                                  <GenericEnrollmentView {...sharedProps} />;
}