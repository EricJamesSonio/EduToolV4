// filepath: frontend/src/app/educator/classes/[classId]/page.tsx

"use client";

import { use, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  CalendarCheck,
  BarChart2,
  ClipboardCheck,
  ClipboardList,
  Video,
  FileText,
  Clock,
  ArrowLeft,
  Hash,
} from "lucide-react";
import { classApi } from "@/api/admin/class.api";
import { subjectApi } from "@/api/admin/subject.api";
import { sectionApi } from "@/api/admin/section.api";
import { semesterApi } from "@/api/admin/semester.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { toArray } from "@/utils/classes.utils";
import { formatSchedules } from "@/types/educator/class.types";
import type { EnrollmentResponse } from "@/api/admin/class.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatClassSchedules(
  schedules: { weekday: number; startTime: string; endTime: string }[]
): string {
  if (!schedules?.length) return "No schedule";
  return schedules
    .map((s) => {
      const day = WEEKDAY_LABELS[s.weekday] ?? "?";
      return `${day} ${s.startTime}–${s.endTime}`;
    })
    .join(", ");
}

interface QuickLinkProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  onClick: () => void;
}

function QuickLink({
  icon: Icon,
  label,
  description,
  onClick,
}: QuickLinkProps): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3.5 text-left hover:border-primary/40 hover:bg-accent/30 transition-colors group w-full"
    >
      <div className="rounded-md bg-muted p-2 shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
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
  const base = `/educator/classes/${id}`;

  const { data: cls, isLoading: clsLoading } = useQuery({
    queryKey: ["educator", "classes", id],
    queryFn: () => classApi.getOne(id),
  });

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["educator", "classes", id, "enrollments"],
    queryFn: () => classApi.getEnrollments(id),
    enabled: !!id,
  });

  const enrollments = toArray<EnrollmentResponse>(enrollmentsRaw).filter(
    (e) => e.status === "active"
  );

  const { data: subjectsRaw } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: () => subjectApi.getAll(),
  });

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections", cls?.schoolYearId],
    queryFn: () => {
      if (!cls?.schoolYearId) return [];
      return sectionApi.getAll(cls.schoolYearId);
    },
    enabled: !!cls?.schoolYearId,
  });

  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters"],
    queryFn: () => semesterApi.getAll(),
  });

  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });

  const enriched = useMemo(() => {
    if (!cls) return undefined;

    const subjectName =
      toArray<{ id: string; title: string }>(subjectsRaw).find(
        (s) => s.id === cls.subjectId
      )?.title ?? cls.subjectName;

    const sectionName = cls.sectionId
      ? toArray<{ id: string; name: string }>(sectionsRaw).find(
        (s) => s.id === cls.sectionId
      )?.name ?? cls.sectionName
      : null;

    const semesterName =
      toArray<{ id: string; name: string }>(semestersRaw).find(
        (s) => s.id === cls.semesterId
      )?.name ?? cls.semesterName;

    const schoolYearName =
      toArray<{ id: string; name: string }>(schoolYearsRaw).find(
        (s) => s.id === cls.schoolYearId
      )?.name ?? cls.schoolYearTitle;

    return { ...cls, subjectName, sectionName, semesterName, schoolYearName };
  }, [cls, subjectsRaw, sectionsRaw, semestersRaw, schoolYearsRaw]);

  if (clsLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
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

  const schedule = formatClassSchedules(enriched.schedules ?? []);
  const activeCount = enrollmentsLoading ? null : enrollments.length;
  const capacityLabel =
    enriched.capacity === 0 ? "Unlimited" : String(enriched.capacity);

  const quickLinks = [
    {
      icon: FileText,
      label: "Lessons",
      description: "Manage lesson plans and materials",
      href: `${base}/lessons`,
    },
    {
      icon: ClipboardCheck,
      label: "Assessments",
      description: "Quizzes, activities, and exams",
      href: `${base}/assessments`,
    },
    {
      icon: CalendarCheck,
      label: "Attendance",
      description: "Track student attendance per session",
      href: `${base}/attendance`,
    },
    {
      icon: BarChart2,
      label: "Grades",
      description: "View and compute term grades",
      href: `${base}/grades`,
    },
    {
      icon: ClipboardList,
      label: "Grading Scheme",
      description: "Grading scheme for this class",
      href: `${base}/grading-scheme`,
    },
    {
      icon: Video,
      label: "Meetings",
      description: "Schedule and manage video sessions",
      href: `${base}/meetings`,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={enriched.subjectName ?? enriched.subjectId}
        description={enriched.sectionName || undefined}
        breadcrumbs={[
          {
            label: "My Classes",
            href: "/educator/classes"
          }
        ]}
        actions={
          <Badge variant="secondary" className="shrink-0">
            {enriched.semesterName ?? "—"}
          </Badge>
        }
      />

      {/* Info card */}
      <div className="rounded-lg border bg-card px-5 py-1">
        <InfoRow
          icon={BookOpen}
          label="Subject"
          value={enriched.subjectName ?? enriched.subjectId}
        />
        <InfoRow
          icon={Users}
          label="Section"
          value={
            enriched.sectionName ?? (
              <span className="text-muted-foreground">—</span>
            )
          }
        />
        <InfoRow icon={Clock} label="Schedule" value={schedule} />
        <InfoRow
          icon={Hash}
          label="Capacity"
          value={
            <span>
              {activeCount !== null ? (
                <>
                  <span className="text-foreground">{activeCount}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    / {capacityLabel} enrolled
                  </span>
                </>
              ) : (
                capacityLabel
              )}
            </span>
          }
        />
        <InfoRow
          icon={CalendarCheck}
          label="School Year"
          value={enriched.schoolYearName ?? "—"}
        />
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Class Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <QuickLink
              key={link.href}
              {...link}
              onClick={() => router.push(link.href)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}