// frontend\src\components\admin\school-years\program-view\SHSEnrollmentView.tsx
"use client";

import { Users, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb }       from "./Breadcrumb";
import { CountRow }         from "./CountRow";
import { StudentListPanel } from "./StudentListPanel";
import { useEnrollmentDrilldown } from "@/components/admin/school-years/hooks/useEnrollmentDrilldown";
import {
  getStudentsInProgram,
  getStudentsInStrand,
  getStudentsInStrandLevel,
} from "./enrollment.helpers";
import type { Level }   from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";

interface SHSEnrollmentViewProps {
  program:        Program;
  programLevels:  Level[];
  allEnrollments: StudentSchoolYearEnrollment[];
  schoolYearId:   string;
  isEnded:        boolean;
  studentMap:     Map<string, string>;
}

export function SHSEnrollmentView({
  program,
  programLevels,
  allEnrollments,
  schoolYearId,
  isEnded,
  studentMap,
}: SHSEnrollmentViewProps) {
const { state, selectStrand, selectLevel, backToPrograms, backToStrandList } =
  useEnrollmentDrilldown();

  const selectedStrandId = state.strandId;
  const selectedLevelId  = state.levelId;
  const strands          = program.strands ?? [];
  const programStudents  = getStudentsInProgram(allEnrollments, program.id);

  if (selectedStrandId && selectedLevelId) {
    const strand   = strands.find((s) => s.id === selectedStrandId);
    const level    = programLevels.find((l) => l.id === selectedLevelId);
    const students = getStudentsInStrandLevel(allEnrollments, program.id, selectedStrandId, selectedLevelId);
    return (
      <div className="space-y-3">
        <Breadcrumb crumbs={[
          { label: "All Strands", onClick: backToPrograms },
          { label: strand?.name ?? "Strand", onClick: backToStrandList },
          { label: level?.name ?? "Level" },
        ]} />
        <StudentListPanel
          title={`${strand?.name ?? ""} — ${level?.name ?? ""}`}
          students={students}
          programId={program.id}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
          enrollContext={{ program_id: program.id, strand_id: selectedStrandId, level_id: selectedLevelId }}
          allEnrollments={allEnrollments}
          studentMap={studentMap}
        />
      </div>
    );
  }

  if (selectedStrandId) {
    const strand         = strands.find((s) => s.id === selectedStrandId);
    const strandStudents = getStudentsInStrand(allEnrollments, program.id, selectedStrandId);
    return (
      <div className="space-y-3">
        <Breadcrumb crumbs={[
          { label: "All Strands", onClick: backToPrograms },
          { label: strand?.name ?? "Strand" }, // ← no onClick, no level crumb — we're AT the strand
        ]} />
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Levels</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {strandStudents.length} total
            </Badge>
          </div>
          <div className="divide-y">
            {programLevels.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No levels found.</p>
            ) : programLevels.map((level) => (
              <CountRow
                key={level.id}
                label={level.name}
                count={getStudentsInStrandLevel(allEnrollments, program.id, selectedStrandId, level.id).length}
                onClick={() => selectLevel(level.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Strands</span>
        <Badge variant="secondary" className="text-xs font-normal">
          {programStudents.length} total students
        </Badge>
      </div>
      <div className="divide-y">
        {strands.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No strands found.</p>
        ) : strands.map((strand) => (
          <CountRow
            key={strand.id}
            label={strand.name}
            count={getStudentsInStrand(allEnrollments, program.id, strand.id).length}
            onClick={() => selectStrand(strand.id)}
          />
        ))}
      </div>
    </div>
  );
}