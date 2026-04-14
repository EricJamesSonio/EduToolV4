"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Users, UserPlus, GraduationCap, Layers } from "lucide-react";
import type { AxiosError } from "axios";
import {
  useSchoolYearEnrollments,
  useBulkEnrollStudents,
  useEnrollInProgram,
  useUnenrollStudent,
} from "@/hooks/admin/useStudentEnrollment";
import { EnrollStudentDialog } from "@/components/admin/enrollment/EnrollStudentDialog";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn }      from "@/lib/utils";
import type { Program, CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";
import type { Student } from "@/types/admin/student.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface ProgramEnrollmentViewProps {
  program:      Program;
  schoolYearId: string;
  levels:       Level[];
  isEnded:      boolean;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getStudentsInProgram(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some((pe) => pe.program_id === programId),
  );
}

function getStudentsInLevel(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  levelId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) => pe.program_id === programId && pe.level?.id === levelId,
    ),
  );
}

function getStudentsInCourse(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  courseId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) => pe.program_id === programId && pe.course?.id === courseId,
    ),
  );
}

function getStudentsInStrand(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  strandId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) => pe.program_id === programId && pe.strand?.id === strandId,
    ),
  );
}

function getStudentsInCourseLevel(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  courseId: string,
  levelId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) =>
        pe.program_id === programId &&
        pe.course?.id === courseId &&
        pe.level?.id === levelId,
    ),
  );
}

function getStudentsInStrandLevel(
  enrollments: StudentSchoolYearEnrollment[],
  programId: string,
  strandId: string,
  levelId: string,
): StudentSchoolYearEnrollment[] {
  return enrollments.filter((e) =>
    e.programEnrollments?.some(
      (pe) =>
        pe.program_id === programId &&
        pe.strand?.id === strandId &&
        pe.level?.id === levelId,
    ),
  );
}

// ── StudentRow ────────────────────────────────────────────────────────────────

interface StudentRowProps {
  enrollment:   StudentSchoolYearEnrollment;
  programId:    string;
  isEnded:      boolean;
  onUnenroll:   (enrollment: StudentSchoolYearEnrollment) => void;
  isUnenrolling: boolean;
}

function StudentRow({
  enrollment,
  programId,
  isEnded,
  onUnenroll,
  isUnenrolling,
}: StudentRowProps) {
  const pe = enrollment.programEnrollments?.find(
    (p) => p.program_id === programId,
  );

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {/* placeholder — student name not in enrollment snapshot */}
          <GraduationCap className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{enrollment.student_id}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {pe?.level && (
              <span className="text-xs text-muted-foreground">{pe.level.name}</span>
            )}
            {pe?.course && (
              <Badge variant="outline" className="text-xs font-normal py-0 px-1.5">
                {pe.course.code ?? pe.course.name}
              </Badge>
            )}
            {pe?.strand && (
              <Badge variant="outline" className="text-xs font-normal py-0 px-1.5">
                {pe.strand.name}
              </Badge>
            )}
            {pe?.section ? (
              <Badge variant="secondary" className="text-xs font-normal py-0 px-1.5">
                {pe.section.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground italic">No section</span>
            )}
          </div>
        </div>
      </div>

      {!isEnded && (
        <button
          onClick={() => onUnenroll(enrollment)}
          disabled={isUnenrolling}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10"
        >
          Remove
        </button>
      )}
    </div>
  );
}

// ── StudentListPanel ──────────────────────────────────────────────────────────

interface StudentListPanelProps {
  title:        string;
  students:     StudentSchoolYearEnrollment[];
  programId:    string;
  schoolYearId: string;
  isEnded:      boolean;
  /** Pre-fill for enrollInProgram call */
  enrollContext: {
    program_id:  string;
    level_id?:   string;
    course_id?:  string;
    strand_id?:  string;
  };
  allEnrollments: StudentSchoolYearEnrollment[];
}

function StudentListPanel({
  title,
  students,
  programId,
  schoolYearId,
  isEnded,
  enrollContext,
  allEnrollments,
}: StudentListPanelProps) {
  const [enrollOpen,    setEnrollOpen]    = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState<StudentSchoolYearEnrollment | null>(null);

  const bulkEnroll     = useBulkEnrollStudents(schoolYearId);
  const enrollInProgram = useEnrollInProgram(schoolYearId);
  const unenrollMutation = useUnenrollStudent(schoolYearId);

  const handleEnroll = (selected: Student[]) => {
    if (selected.length === 0) return;

    // Step 1: bulk-enroll to school year (idempotent — server skips already enrolled)
    bulkEnroll.mutate(
      { students: selected.map((s) => ({ student_id: s.id })) },
      {
        onSuccess: async () => {
          // Step 2: assign program scope for each student
          let successCount = 0;
          for (const s of selected) {
            try {
              await enrollInProgram.mutateAsync({
                studentId: s.id,
                data: enrollContext,
              });
              successCount++;
            } catch {
              toast.error(`Failed to assign program for student ${s.id}`);
            }
          }
          if (successCount > 0) {
            toast.success(
              `${successCount} student${successCount > 1 ? "s" : ""} enrolled.`,
            );
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
      onSuccess: () => {
        toast.success("Student removed.");
        setUnenrollTarget(null);
      },
      onError: () => toast.error("Failed to remove student."),
    });
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {students.length}
          </Badge>
        </div>
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

      {/* Student rows */}
      {students.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
          {!isEnded && (
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
          {students.map((e) => (
            <StudentRow
              key={e.id}
              enrollment={e}
              programId={programId}
              isEnded={isEnded}
              onUnenroll={(enr) => setUnenrollTarget(enr)}
              isUnenrolling={unenrollMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Enroll dialog */}
      {enrollOpen && (
        <EnrollStudentDialog
          open
          onClose={() => setEnrollOpen(false)}
          alreadyEnrolled={allEnrollments}
          onConfirm={handleEnroll}
          isLoading={bulkEnroll.isPending || enrollInProgram.isPending}
        />
      )}

      {/* Unenroll confirm */}
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

// ── CountRow — clickable row showing a scope + count ─────────────────────────

interface CountRowProps {
  label:       string;
  count:       number;
  icon?:       React.ReactNode;
  onClick:     () => void;
  isExpanded?: boolean;
}

function CountRow({ label, count, icon, onClick, isExpanded }: CountRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left group",
        isExpanded && "bg-muted/20",
      )}
    >
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="flex-1 text-sm font-medium truncate">{label}</span>
      <Badge variant="secondary" className="text-xs font-normal shrink-0">
        {count} student{count !== 1 ? "s" : ""}
      </Badge>
      <ChevronRight
        className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
          isExpanded && "rotate-90",
        )}
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ProgramEnrollmentView({
  program,
  schoolYearId,
  levels,
  isEnded,
}: ProgramEnrollmentViewProps) {
  const { data: allEnrollments = [], isLoading } = useSchoolYearEnrollments(schoolYearId);

  const isCollege    = program.type === "college";
  const isSHS        = program.type === "shs";
  const hasSubGroups = isCollege || isSHS;

  // Drill-down state
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedStrandId, setSelectedStrandId] = useState<string | null>(null);
  const [selectedLevelId,  setSelectedLevelId]  = useState<string | null>(null);

  const programLevels = levels.filter((l) => l.program_id === program.id);
  const programStudents = getStudentsInProgram(allEnrollments, program.id);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  // ── College: Course → Level → Students ────────────────────────────────────
  if (isCollege) {
    const courses = program.courses ?? [];

    if (selectedCourseId && selectedLevelId) {
      const course = courses.find((c) => c.id === selectedCourseId);
      const level  = programLevels.find((l) => l.id === selectedLevelId);
      const students = getStudentsInCourseLevel(allEnrollments, program.id, selectedCourseId, selectedLevelId);
      return (
        <div className="space-y-3">
          <Breadcrumb
            crumbs={[
              { label: "All Courses", onClick: () => { setSelectedCourseId(null); setSelectedLevelId(null); } },
              { label: course?.name ?? "Course", onClick: () => setSelectedLevelId(null) },
              { label: level?.name ?? "Level" },
            ]}
          />
          <StudentListPanel
            title={`${course?.name ?? ""} — ${level?.name ?? ""}`}
            students={students}
            programId={program.id}
            schoolYearId={schoolYearId}
            isEnded={isEnded}
            enrollContext={{ program_id: program.id, course_id: selectedCourseId, level_id: selectedLevelId }}
            allEnrollments={allEnrollments}
          />
        </div>
      );
    }

    if (selectedCourseId) {
      const course = courses.find((c) => c.id === selectedCourseId);
      const courseStudents = getStudentsInCourse(allEnrollments, program.id, selectedCourseId);
      return (
        <div className="space-y-3">
          <Breadcrumb
            crumbs={[
              { label: "All Courses", onClick: () => setSelectedCourseId(null) },
              { label: course?.name ?? "Course" },
            ]}
          />
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Levels</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {courseStudents.length} total students
                </Badge>
              </div>
            </div>
            <div className="divide-y">
              {programLevels.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No levels found.</p>
              ) : (
                programLevels.map((level) => {
                  const count = getStudentsInCourseLevel(allEnrollments, program.id, selectedCourseId, level.id).length;
                  return (
                    <CountRow
                      key={level.id}
                      label={level.name}
                      count={count}
                      onClick={() => setSelectedLevelId(level.id)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    // Course list
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Courses</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {programStudents.length} total students
            </Badge>
          </div>
        </div>
        <div className="divide-y">
          {courses.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No courses found.</p>
          ) : (
            courses.map((course) => {
              const count = getStudentsInCourse(allEnrollments, program.id, course.id).length;
              return (
                <CountRow
                  key={course.id}
                  label={course.code ? `${course.code} – ${course.name}` : course.name}
                  count={count}
                  onClick={() => setSelectedCourseId(course.id)}
                />
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── SHS: Strand → Level → Students ────────────────────────────────────────
  if (isSHS) {
    const strands = program.strands ?? [];

    if (selectedStrandId && selectedLevelId) {
      const strand = strands.find((s) => s.id === selectedStrandId);
      const level  = programLevels.find((l) => l.id === selectedLevelId);
      const students = getStudentsInStrandLevel(allEnrollments, program.id, selectedStrandId, selectedLevelId);
      return (
        <div className="space-y-3">
          <Breadcrumb
            crumbs={[
              { label: "All Strands", onClick: () => { setSelectedStrandId(null); setSelectedLevelId(null); } },
              { label: strand?.name ?? "Strand", onClick: () => setSelectedLevelId(null) },
              { label: level?.name ?? "Level" },
            ]}
          />
          <StudentListPanel
            title={`${strand?.name ?? ""} — ${level?.name ?? ""}`}
            students={students}
            programId={program.id}
            schoolYearId={schoolYearId}
            isEnded={isEnded}
            enrollContext={{ program_id: program.id, strand_id: selectedStrandId, level_id: selectedLevelId }}
            allEnrollments={allEnrollments}
          />
        </div>
      );
    }

    if (selectedStrandId) {
      const strand = strands.find((s) => s.id === selectedStrandId);
      const strandStudents = getStudentsInStrand(allEnrollments, program.id, selectedStrandId);
      return (
        <div className="space-y-3">
          <Breadcrumb
            crumbs={[
              { label: "All Strands", onClick: () => setSelectedStrandId(null) },
              { label: strand?.name ?? "Strand" },
            ]}
          />
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Levels</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {strandStudents.length} total students
                </Badge>
              </div>
            </div>
            <div className="divide-y">
              {programLevels.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No levels found.</p>
              ) : (
                programLevels.map((level) => {
                  const count = getStudentsInStrandLevel(allEnrollments, program.id, selectedStrandId, level.id).length;
                  return (
                    <CountRow
                      key={level.id}
                      label={level.name}
                      count={count}
                      onClick={() => setSelectedLevelId(level.id)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    // Strand list
    return (
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Strands</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {programStudents.length} total students
            </Badge>
          </div>
        </div>
        <div className="divide-y">
          {strands.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No strands found.</p>
          ) : (
            strands.map((strand) => {
              const count = getStudentsInStrand(allEnrollments, program.id, strand.id).length;
              return (
                <CountRow
                  key={strand.id}
                  label={strand.name}
                  count={count}
                  onClick={() => setSelectedStrandId(strand.id)}
                />
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Non-college/SHS: Level → Students ─────────────────────────────────────
  if (selectedLevelId) {
    const level    = programLevels.find((l) => l.id === selectedLevelId);
    const students = getStudentsInLevel(allEnrollments, program.id, selectedLevelId);
    return (
      <div className="space-y-3">
        <Breadcrumb
          crumbs={[
            { label: "All Levels", onClick: () => setSelectedLevelId(null) },
            { label: level?.name ?? "Level" },
          ]}
        />
        <StudentListPanel
          title={level?.name ?? "Level"}
          students={students}
          programId={program.id}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
          enrollContext={{ program_id: program.id, level_id: selectedLevelId }}
          allEnrollments={allEnrollments}
        />
      </div>
    );
  }

  // Level list
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Levels</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {programStudents.length} total students
          </Badge>
        </div>
      </div>
      <div className="divide-y">
        {programLevels.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No levels found.</p>
        ) : (
          programLevels.map((level) => {
            const count = getStudentsInLevel(allEnrollments, program.id, level.id).length;
            return (
              <CountRow
                key={level.id}
                label={level.name}
                count={count}
                onClick={() => setSelectedLevelId(level.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

interface BreadcrumbProps {
  crumbs: { label: string; onClick?: () => void }[];
}

function Breadcrumb({ crumbs }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {crumb.onClick ? (
            <button
              onClick={crumb.onClick}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}