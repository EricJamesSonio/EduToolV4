"use client";

import { use, useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  BookOpen, Users, CalendarCheck,
  Clock, Hash, GraduationCap, Layers,
} from "lucide-react";
import { formatSchedule } from "@/utils/classes.utils";

import { classApi }     from "@/api/admin/class.api";
import { subjectApi }   from "@/api/admin/subject.api";
import { sectionApi }   from "@/api/admin/section.api";
import { semesterApi }  from "@/api/admin/semester.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { courseApi }    from "@/api/admin/course.api";
import { strandApi }    from "@/api/admin/strand.api";

import { toArray } from "@/utils/classes.utils";
import type { EnrollmentResponse } from "@/api/admin/class.api";
import type { Subject } from "@/types/admin/subject.types";

import { useAssessments } from "@/hooks/educator/useAssessments";
import { useAttendanceGrid } from "@/hooks/educator/useAttendance";
import { EducatorAttentionSection } from "@/components/educator/class-overview/EducatorAttentionSection";

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton }   from "@/components/ui/skeleton";
import { Badge }      from "@/components/ui/badge";
// HIDDEN: Groupy Class Chat - imports kept commented for easy restore
// import { useRouter } from "next/navigation";
// import { Button }     from "@/components/ui/button";
// import { useGroupyUnread } from "@/hooks/groupy/useGroupyUnread";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatClassSchedules(
  schedules: { weekday: number; startTime: string; endTime: string }[],
): string {
  if (!schedules?.length) return "No schedule";
  return formatSchedule(schedules);
}

function DetailItem({
  icon: Icon, label, value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function EducatorClassOverviewPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}): React.JSX.Element {
  const { classId: id } = use(params);

  // HIDDEN: Groupy unread badge - hidden per request (Class Chat disabled)
  // const { data: groupyUnread } = useGroupyUnread(id);

  const { data: cls, isLoading: clsLoading } = useAsyncQuery(
    queryKeys.educator.classes.detail(id),
    () => classApi.getOne(id),
  );

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useAsyncQuery(
    queryKeys.educator.classes.students(id),
    () => classApi.getEnrollments(id),
    { enabled: !!id },
  );

  const enrollments = toArray<EnrollmentResponse>(enrollmentsRaw).filter(
    (e) => e.status === "active",
  );

  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments(id);
  const { data: attendanceGrid, isLoading: attendanceLoading } = useAttendanceGrid(id);

  const { data: subjectsRaw } = useAsyncQuery(
    queryKeys.admin.subjects.all,
    () => subjectApi.getAll(),
  );

  const schoolYearId = cls?.schoolYearId;

  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId: schoolYearId ?? '' }),
    () => sectionApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  const { data: semestersRaw } = useAsyncQuery(
    queryKeys.admin.semesters.list(),
    () => semesterApi.getAll(),
  );

  const { data: schoolYearsRaw } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );

  // Courses and strands — scoped to this class's school year
  const { data: coursesRaw } = useAsyncQuery(
    queryKeys.admin.courses.list({ schoolYearId: schoolYearId ?? '' }),
    () => courseApi.getAll({ schoolYearId: schoolYearId! }),
    { enabled: !!schoolYearId },
  );

  const { data: strandsRaw } = useAsyncQuery(
    queryKeys.admin.strands.list(),
    () => strandApi.getAll(),
  );

  // ── Maps ────────────────────────────────────────────────────────────────────

  const courseMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; name: string; code?: string }>(coursesRaw).forEach((c) =>
      m.set(c.id, c.code ?? c.name),
    );
    return m;
  }, [coursesRaw]);

  const strandMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; name: string }>(strandsRaw).forEach((s) =>
      m.set(s.id, s.name),
    );
    return m;
  }, [strandsRaw]);

  // ── Enriched class ──────────────────────────────────────────────────────────

  const enriched = useMemo(() => {
    if (!cls) return undefined;

    const subject = toArray<Subject>(subjectsRaw).find((s) => s.id === cls.subjectId);

    const sectionName = cls.sectionId
      ? toArray<{ id: string; name: string }>(sectionsRaw).find(
          (s) => s.id === cls.sectionId,
        )?.name ?? cls.sectionName
      : null;

    const semesterName =
      toArray<{ id: string; name: string }>(semestersRaw).find(
        (s) => s.id === cls.semesterId,
      )?.name ?? cls.semesterName;

    const schoolYearName =
      toArray<{ id: string; name: string }>(schoolYearsRaw).find(
        (s) => s.id === cls.schoolYearId,
      )?.name ?? cls.schoolYearTitle;

    const courseName = subject?.courseId
      ? (courseMap.get(subject.courseId) ?? null)
      : null;

    const strandName = subject?.strandId
      ? (strandMap.get(subject.strandId) ?? null)
      : null;

    return {
      ...cls,
      subjectName:    subject?.title ?? cls.subjectName ?? null,
      programName:    subject?.programName ?? null,
      levelName:      subject?.levelName ?? null,
      courseName,
      strandName,
      sectionName,
      semesterName,
      schoolYearName,
    };
  }, [cls, subjectsRaw, sectionsRaw, semestersRaw, schoolYearsRaw, courseMap, strandMap]);

  if (clsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  if (!enriched) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Class not found.
      </p>
    );
  }

  const schedule    = formatClassSchedules(enriched.schedules ?? []);
  const activeCount = enrollmentsLoading ? null : enrollments.length;
  const capacityLabel = enriched.capacity === 0 ? "Unlimited" : String(enriched.capacity);

  return (
    <div className="space-y-6">
      <PageHeader
        title={enriched.subjectName ?? "Unnamed Class"}
        breadcrumbs={[{ label: "My Classes", href: "/educator/classes" }]}
        actions={
          <div className="flex items-center gap-2">
            {/* HIDDEN: Class Chat (Groupy) button - hidden per request, original code preserved below */}
            {/* <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => router.push(`/educator/classes/${id}/groupy`)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Class Chat
            </Button> */}
            <Badge variant="secondary" className="shrink-0">
              {enriched.semesterName ?? "—"}
            </Badge>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Class details — single card, 2 columns */}
        <div className="rounded-lg border bg-card p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailItem icon={BookOpen} label="Subject" value={enriched.subjectName ?? "Unnamed Class"} />

            {enriched.programName && (
              <DetailItem icon={GraduationCap} label="Department" value={enriched.programName} />
            )}

            {enriched.courseName && (
              <DetailItem icon={Layers} label="Course" value={enriched.courseName} />
            )}

            {enriched.strandName && (
              <DetailItem icon={Layers} label="Strand" value={enriched.strandName} />
            )}

            {enriched.levelName && (
              <DetailItem icon={BookOpen} label="Level" value={enriched.levelName} />
            )}

            <DetailItem
              icon={Users}
              label="Section"
              value={enriched.sectionName ?? <span className="text-muted-foreground">—</span>}
            />

            <DetailItem icon={Clock} label="Schedule" value={schedule} />

            <DetailItem
              icon={Hash}
              label="Capacity"
              value={
                activeCount !== null ? (
                  <span>
                    <span className="text-foreground">{activeCount}</span>
                    <span className="text-muted-foreground"> / {capacityLabel} enrolled</span>
                  </span>
                ) : (
                  capacityLabel
                )
              }
            />

            <DetailItem icon={CalendarCheck} label="School Year" value={enriched.schoolYearName ?? "—"} />
          </dl>
        </div>

        <EducatorAttentionSection
          classId={id}
          assessments={assessments}
          assessmentsLoading={assessmentsLoading}
          attendanceGrid={attendanceGrid}
          attendanceLoading={attendanceLoading}
        />
      </div>
    </div>
  );
}