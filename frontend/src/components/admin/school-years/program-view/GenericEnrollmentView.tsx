// frontend\src\components\admin\enrollment\program-view\GenericEnrollmentView.tsx
import { useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb }       from "./Breadcrumb";
import { CountRow }         from "./CountRow";
import { StudentListPanel } from "./StudentListPanel";
import { getStudentsInProgram, getStudentsInLevel } from "./enrollment.helpers";
import type { Level }   from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";

interface GenericEnrollmentViewProps {
  program:        Program;
  programLevels:  Level[];
  allEnrollments: StudentSchoolYearEnrollment[];
  schoolYearId:   string;
  isEnded:        boolean;
  studentMap:     Map<string, string>;
}

export function GenericEnrollmentView({
  program,
  programLevels,
  allEnrollments,
  schoolYearId,
  isEnded,
  studentMap,
}: GenericEnrollmentViewProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  const programStudents = getStudentsInProgram(allEnrollments, program.id);

  if (selectedLevelId) {
    const level    = programLevels.find((l) => l.id === selectedLevelId);
    const students = getStudentsInLevel(allEnrollments, program.id, selectedLevelId);
    return (
      <div className="space-y-3">
        <Breadcrumb crumbs={[
          { label: "All Levels", onClick: () => setSelectedLevelId(null) },
          { label: level?.name ?? "Level" },
        ]} />
        <StudentListPanel
          title={level?.name ?? "Level"}
          students={students}
          programId={program.id}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
          enrollContext={{ program_id: program.id, level_id: selectedLevelId }}
          allEnrollments={allEnrollments}
          studentMap={studentMap} 
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Levels</span>
        <Badge variant="secondary" className="text-xs font-normal">
          {programStudents.length} total students
        </Badge>
      </div>
      <div className="divide-y">
        {programLevels.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No levels found.</p>
        ) : programLevels.map((level) => (
          <CountRow
            key={level.id}
            label={level.name}
            count={getStudentsInLevel(allEnrollments, program.id, level.id).length}
            onClick={() => setSelectedLevelId(level.id)}
          />
        ))}
      </div>
    </div>
  );
}