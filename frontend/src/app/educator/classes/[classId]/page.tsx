"use client";

import { use, useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useRouter } from "next/navigation";
import {
  BookOpen, Users, CalendarCheck,
  Clock, Hash, GraduationCap, Layers,
  BarChart2, ClipboardCheck, ClipboardList, FileText, Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";

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

import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton }   from "@/components/ui/skeleton";
import { Badge }      from "@/components/ui/badge";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatClassSchedules(
  schedules: { weekday: number; startTime: string; endTime: string }[],
): string {
  if (!schedules?.length) return "No schedule";
  return schedules
    .map((s) => {
      const day = WEEKDAY_LABELS[s.weekday] ?? "?";
      return `${day} ${s.startTime}–${s.endTime}`;
    })
    .join(", ");
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
  const router = useRouter();
  const base   = `/educator/classes/${id}`;

  const { data: cls, isLoading: clsLoading } = useAsyncQuery(
    queryKeys.educator.classes.detail(id),
    () => classApi.getOne(id),
  );

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useAsyncQuery(
    queryKeys.educator.classes.detail(id),
    () => classApi.getEnrollments(id),
    { enabled: !!id },
  );

  const enrollments = toArray<EnrollmentResponse>(enrollmentsRaw).filter(
    (e) => e.status === "active",
  );

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

  // Build the full class title: "BSCS · 1st Year – Section A · Mathematics"
  // or "Elementary · Grade 3 – Section A · English"
  const trackLabel  = enriched.courseName ?? enriched.strandName ?? null;
  const contextLine = [trackLabel ?? enriched.programName, enriched.levelName]
    .filter(Boolean)
    .join(" · ");

  const quickLinks = [
    { icon: FileText,      label: "Lessons",     description: "Manage lesson plans and materials",      href: `${base}/lessons`     },
    { icon: ClipboardCheck,label: "Assessments", description: "Quizzes, activities, and exams",         href: `${base}/assessments` },
    { icon: CalendarCheck, label: "Attendance",  description: "Track student attendance per session",   href: `${base}/attendance`  },
    { icon: BarChart2,     label: "Grades",      description: "View and compute term grades",           href: `${base}/grades`      },
    { icon: ClipboardList, label: "Grading scheme",      description: "Grading scheme for this class",          href: `${base}/grading-scheme`      },
    { icon: Video,         label: "Meetings",    description: "Schedule and manage video sessions",     href: `${base}/meetings`    },
  ];

  return (
  <div className="space-y-6">
    <PageHeader
      title={enriched.subjectName ?? enriched.subjectId}
      breadcrumbs={[{ label: "My Classes", href: "/educator/classes" }]}
      actions={
        <Badge variant="secondary" className="shrink-0">
          {enriched.semesterName ?? "—"}
        </Badge>
      }
    />

    <div className="space-y-6">
      {/* Class details — single card, 2 columns */}
      <div className="rounded-lg border bg-card p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <DetailItem icon={BookOpen} label="Subject" value={enriched.subjectName ?? enriched.subjectId} />

          {enriched.programName && (
            <DetailItem icon={GraduationCap} label="Program" value={enriched.programName} />
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

      {/* Quick links — 3-column colored cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Class Sections</h2>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {quickLinks.map((link, i) => {
            const color = WEEK_COLORS[i % WEEK_COLORS.length];
            const Icon = link.icon;
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className="rounded-xl border bg-card p-3 sm:p-5 space-y-2 sm:space-y-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 group text-left"
              >
                <div className={cn("rounded-md p-2 w-fit", color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {link.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);
}