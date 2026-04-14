// frontend\src\components\admin\enrollment\program-view\CollegeEnrollmentView.tsx
import { useState } from "react";
import { Users, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb }       from "./Breadcrumb";
import { CountRow }         from "./CountRow";
import { StudentListPanel } from "./StudentListPanel";
import {
  getStudentsInProgram,
  getStudentsInCourse,
  getStudentsInCourseLevel,
} from "./enrollment.helpers";
import type { Level }   from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";

interface CollegeEnrollmentViewProps {
  program:        Program;
  programLevels:  Level[];
  allEnrollments: StudentSchoolYearEnrollment[];
  schoolYearId:   string;
  isEnded:        boolean;
  studentMap: Map<string, string>;
}

export function CollegeEnrollmentView({
  program,
  programLevels,
  allEnrollments,
  schoolYearId,
  isEnded,
  studentMap
  
}: CollegeEnrollmentViewProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLevelId,  setSelectedLevelId]  = useState<string | null>(null);

  const courses         = program.courses ?? [];
  const programStudents = getStudentsInProgram(allEnrollments, program.id);

  if (selectedCourseId && selectedLevelId) {
    const course   = courses.find((c) => c.id === selectedCourseId);
    const level    = programLevels.find((l) => l.id === selectedLevelId);
    const students = getStudentsInCourseLevel(allEnrollments, program.id, selectedCourseId, selectedLevelId);
    return (
      <div className="space-y-3">
        <Breadcrumb crumbs={[
          { label: "All Courses", onClick: () => { setSelectedCourseId(null); setSelectedLevelId(null); } },
          { label: course?.name ?? "Course", onClick: () => setSelectedLevelId(null) },
          { label: level?.name ?? "Level" },
        ]} />
        <StudentListPanel
          title={`${course?.name ?? ""} — ${level?.name ?? ""}`}
          students={students}
          programId={program.id}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
          enrollContext={{ program_id: program.id, course_id: selectedCourseId, level_id: selectedLevelId }}
          allEnrollments={allEnrollments}
          studentMap={studentMap} 
        />
      </div>
    );
  }

  if (selectedCourseId) {
    const course         = courses.find((c) => c.id === selectedCourseId);
    const courseStudents = getStudentsInCourse(allEnrollments, program.id, selectedCourseId);
    return (
      <div className="space-y-3">
        <Breadcrumb crumbs={[
          { label: "All Courses", onClick: () => setSelectedCourseId(null) },
          { label: course?.name ?? "Course" },
        ]} />
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Levels</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {courseStudents.length} total
            </Badge>
          </div>
          <div className="divide-y">
            {programLevels.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No levels found.</p>
            ) : programLevels.map((level) => (
              <CountRow
                key={level.id}
                label={level.name}
                count={getStudentsInCourseLevel(allEnrollments, program.id, selectedCourseId, level.id).length}
                onClick={() => setSelectedLevelId(level.id)}
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
        <span className="text-sm font-semibold">Courses</span>
        <Badge variant="secondary" className="text-xs font-normal">
          {programStudents.length} total students
        </Badge>
      </div>
      <div className="divide-y">
        {courses.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No courses found.</p>
        ) : courses.map((course) => (
          <CountRow
            key={course.id}
            label={course.code ? `${course.code} – ${course.name}` : course.name}
            count={getStudentsInCourse(allEnrollments, program.id, course.id).length}
            onClick={() => setSelectedCourseId(course.id)}
          />
        ))}
      </div>
    </div>
  );
}