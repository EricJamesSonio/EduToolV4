"use client";

// frontend/src/components/admin/section/SectionTabs.tsx
// Shared detail tabs for a section (used by the program-context and admin section detail pages):
// Students / Classes / Weekly Schedule.

import { useMemo, useState } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { SchedulePanel } from "@/components/shared/SchedulePanel";
import type { Class } from "@/types/admin/class.types";
import {
  Users, BookOpen, CalendarDays,
  Clock, GraduationCap, ChevronRight, ArrowRightLeft,
} from "lucide-react";
import { classApi } from "@/api/admin/class.api";
import { studentApi } from "@/api/admin/student.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import { MAX_SELECT_LIMIT } from "@/api/admin/student.api";
import type { Section } from "@/types/admin/section.types";
import type {
  StudentSchoolYearEnrollment,
  ProgramEnrollmentSnapshot,
} from "@/types/admin/student-enrollment.types";
import { AssignSectionDialog } from "@/components/admin/school-years/program-view/AssignSectionDialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday",
  4: "Thursday", 5: "Friday", 6: "Saturday",
};
const WEEKDAY_SHORT: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function sectionStudentsKey(sectionId: string, schoolYearId: string) {
  return [...queryKeys.admin.sections.all, 'students', sectionId, schoolYearId] as const;
}

export function sectionClassesKey(sectionId: string, schoolYearId: string) {
  return [...queryKeys.admin.sections.all, 'classes', sectionId, schoolYearId] as const;
}

export function StudentsTab({
  section,
  schoolYearId,
  isEnded,
}: {
  section: Section;
  schoolYearId: string;
  isEnded: boolean;
}) {
  const [moveTarget, setMoveTarget] = useState<{
    enrollment: StudentSchoolYearEnrollment;
    programEnrollment: ProgramEnrollmentSnapshot;
  } | null>(null);

  const { data: students = [], isLoading } = useAsyncQuery(
    sectionStudentsKey(section.id, schoolYearId),
    () => studentApi.getAll({ sectionId: section.id, schoolYearId }),
  );

  const { data: syEnrollmentsRaw } = useAsyncQuery(
    queryKeys.admin.studentEnrollment.list({ schoolYearId }),
    () => studentEnrollmentApi.getBySchoolYear(schoolYearId, 1, MAX_SELECT_LIMIT),
    { enabled: students.length > 0 },
  );

  // Defensive: the endpoint's pagination envelope has changed shape before
  // (data/total/page/limit vs data/meta) — accept either, and a bare array,
  // rather than assume `.data` is always the list.
  const syEnrollments: StudentSchoolYearEnrollment[] = Array.isArray(syEnrollmentsRaw)
    ? syEnrollmentsRaw
    : Array.isArray((syEnrollmentsRaw as { data?: unknown })?.data)
      ? (syEnrollmentsRaw as { data: StudentSchoolYearEnrollment[] }).data
      : [];

  const enrollmentByStudentId = useMemo(() => {
    const map = new Map<string, { enrollment: StudentSchoolYearEnrollment; programEnrollment: ProgramEnrollmentSnapshot }>();
    for (const sye of syEnrollments) {
      const pe = sye.programEnrollments.find(
        (p) => p.section?.id === section.id,
      );
      if (pe) {
        map.set(sye.student_id, { enrollment: sye, programEnrollment: pe });
      }
    }
    return map;
  }, [syEnrollments, section.id]);

  if (isLoading) {
    return (
      <div className="space-y-2 p-5">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 w-full rounded" />)}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground not-interactive">No students enrolled</p>
        <p className="text-xs text-muted-foreground mt-1 not-interactive">
          Students assigned to this section will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y">
        {students.map((student) => {
          const ctx = enrollmentByStudentId.get(student.id);
          return (
            <div
              key={student.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <span className="text-xs font-semibold text-primary not-interactive">
                  {student.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate not-interactive">{student.fullName}</p>
                <p className="text-xs text-muted-foreground not-interactive">{student.studentId}</p>
              </div>
              {ctx && !isEnded ? (
                <button
                  onClick={() => setMoveTarget(ctx)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-primary/10 transition-colors shrink-0"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  Move
                </button>
              ) : null}
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs shrink-0 capitalize",
                  student.status === "active"
                    ? "badge-success"
                    : student.status === "suspended"
                    ? "badge-destructive"
                    : "badge-muted",
                )}
              >
                {student.status}
              </Badge>
            </div>
          );
        })}
      </div>

      {moveTarget && (
        <AssignSectionDialog
          open
          onClose={() => setMoveTarget(null)}
          enrollment={moveTarget.enrollment}
          programEnrollment={moveTarget.programEnrollment}
          schoolYearId={schoolYearId}
          isEnded={isEnded}
        />
      )}
    </>
  );
}

export function ClassesTab({
  section,
  schoolYearId,
}: {
  section: Section;
  schoolYearId: string;
}) {
  const { data: classes = [], isLoading } = useAsyncQuery(
    sectionClassesKey(section.id, schoolYearId),
    () => classApi.getAll({ sectionId: section.id, schoolYearId }),
  );

  if (isLoading) {
    return (
      <div className="space-y-2 p-5">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded" />)}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground not-interactive">No classes assigned</p>
        <p className="text-xs text-muted-foreground mt-1 not-interactive">
          Classes assigned to this section will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {classes.map((cls) => (
        <div
          key={cls.id}
          className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 shrink-0">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate not-interactive">{cls.subjectName ?? cls.title}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {cls.educatorName && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 not-interactive">
                  <GraduationCap className="h-3 w-3" />
                  {cls.educatorName}
                </span>
              )}
              {cls.schedules.length > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 not-interactive">
                  <Clock className="h-3 w-3" />
                  {cls.schedules.map((s) => WEEKDAY_SHORT[s.weekday]).join(", ")}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 not-interactive">
            {cls.enrolledCount}/{cls.capacity}
          </span>
        </div>
      ))}
    </div>
  );
}

const educatorSublabel = (cls: Class): string => cls.educatorName ?? "";

export function WeeklyScheduleTab({
  section,
  schoolYearId,
}: {
  section: Section;
  schoolYearId: string;
}) {
  const { data: classes = [], isLoading } = useAsyncQuery(
    sectionClassesKey(section.id, schoolYearId),
    () => classApi.getAll({ sectionId: section.id, schoolYearId }),
  );

  if (isLoading) {
    return (
      <div className="space-y-2 p-5">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded" />)}
      </div>
    );
  }

  const hasSchedules = classes.some((cls) => cls.schedules.length > 0);

  if (!hasSchedules) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground not-interactive">No schedule yet</p>
        <p className="text-xs text-muted-foreground mt-1 not-interactive">
          Schedules are set when classes are created for this section.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <SchedulePanel
        classes={classes}
        getSublabel={educatorSublabel}
        emptyTitle="No classes in this section"
        emptyDescription="Assign students to this section to see their schedule."
      />
    </div>
  );
}