// frontend\src\components\admin\enrollment\program-view\StudentListPanel.tsx
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Users, UserPlus } from "lucide-react";
import type { AxiosError } from "axios";
import {
  useBulkEnrollStudents,
  useEnrollInProgram,
  useUnenrollStudent,
} from "@/hooks/admin/useStudentEnrollment";
import { EnrollStudentDialog } from "@/components/admin/enrollment/EnrollStudentDialog";
import { ConfirmDialog }       from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge }  from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StudentRow } from "./StudentRow";
import { getProgramEnrollment, filterBySection } from "./enrollment.helpers";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";
import type { Student } from "@/types/admin/student.types";

interface EnrollContext {
  program_id: string;
  level_id?:  string;
  course_id?: string;
  strand_id?: string;
}

interface StudentListPanelProps {
  title:          string;
  students:       StudentSchoolYearEnrollment[];
  programId:      string;
  schoolYearId:   string;
  isEnded:        boolean;
  enrollContext:  EnrollContext;
  allEnrollments: StudentSchoolYearEnrollment[];
  studentMap:     Map<string, string>; // student_id → fullName
}

export function StudentListPanel({
  title,
  students,
  programId,
  schoolYearId,
  isEnded,
  enrollContext,
  allEnrollments,
  studentMap,
}: StudentListPanelProps) {
  const [enrollOpen,     setEnrollOpen]     = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState<StudentSchoolYearEnrollment | null>(null);
  const [sectionFilter,  setSectionFilter]  = useState<string>("all");

  const bulkEnroll       = useBulkEnrollStudents(schoolYearId);
  const enrollInProgram  = useEnrollInProgram(schoolYearId);
  const unenrollMutation = useUnenrollStudent(schoolYearId);

  // Derive unique sections from students in this panel
  const availableSections = useMemo(() => {
    const seen = new Map<string, string>(); // id → name
    for (const e of students) {
      const pe = getProgramEnrollment(e, programId);
      if (pe?.section) seen.set(pe.section.id, pe.section.name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [students, programId]);

  const hasUnassigned = students.some((e) => {
    const pe = getProgramEnrollment(e, programId);
    return !pe?.section;
  });

  const showSectionFilter = availableSections.length > 0 || hasUnassigned;

  const filteredStudents = useMemo(
    () => filterBySection(students, programId, sectionFilter),
    [students, programId, sectionFilter],
  );

  const handleEnroll = (selected: Student[]) => {
    if (selected.length === 0) return;
    bulkEnroll.mutate(
      { students: selected.map((s) => ({ student_id: s.id })) },
      {
        onSuccess: async () => {
          let successCount = 0;
          for (const s of selected) {
            try {
              await enrollInProgram.mutateAsync({ studentId: s.id, data: enrollContext });
              successCount++;
            } catch {
              toast.error(`Failed to assign program for student ${s.id}`);
            }
          }
          if (successCount > 0) {
            toast.success(`${successCount} student${successCount > 1 ? "s" : ""} enrolled.`);
          }
          setEnrollOpen(false);
        },
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to enroll students.");
        },
      },
    );
  };

  const handleUnenroll = (enrollment: StudentSchoolYearEnrollment) => {
    unenrollMutation.mutate(enrollment.id, {
      onSuccess: () => { toast.success("Student removed."); setUnenrollTarget(null); },
      onError:   () => toast.error("Failed to remove student."),
    });
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {filteredStudents.length}
            {sectionFilter !== "all" && ` / ${students.length}`}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Section filter — only shown when there are sections to filter by */}
          {showSectionFilter && (
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </SelectItem>
                ))}
                {hasUnassigned && (
                  <SelectItem value="none">No section</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}

          {!isEnded && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-3"
              onClick={() => setEnrollOpen(true)}
            >
              <UserPlus className="mr-1 h-3.5 w-3.5" />
              Enroll Students
            </Button>
          )}
        </div>
      </div>

      {/* Student rows */}
      {filteredStudents.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {sectionFilter !== "all"
              ? "No students in this section."
              : "No students enrolled yet."}
          </p>
          {!isEnded && sectionFilter === "all" && (
            <button
              onClick={() => setEnrollOpen(true)}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Enroll the first student
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y">
        {filteredStudents.map((e) => (
            <StudentRow
            key={e.id}
            enrollment={e}
            programId={programId}
            schoolYearId={schoolYearId}
            isEnded={isEnded}
            onUnenroll={(enr) => setUnenrollTarget(enr)}
            isUnenrolling={unenrollMutation.isPending}
            studentName={studentMap.get(e.student_id) ?? e.student_id} // fallback to id if not found
            />
        ))}
        </div>
      )}

      {enrollOpen && (
        <EnrollStudentDialog
          open
          onClose={() => setEnrollOpen(false)}
          alreadyEnrolled={allEnrollments}
          onConfirm={handleEnroll}
          isLoading={bulkEnroll.isPending || enrollInProgram.isPending}
        />
      )}

      {unenrollTarget && (
        <ConfirmDialog
          open
          title="Remove student?"
          message="Remove this student from the school year? Their class-level enrollments will not be affected."
          confirmLabel="Remove"
          destructive
          isLoading={unenrollMutation.isPending}
          onConfirm={() => handleUnenroll(unenrollTarget)}
          onOpenChange={(o) => { if (!o) setUnenrollTarget(null); }}
        />
      )}
    </div>
  );
}