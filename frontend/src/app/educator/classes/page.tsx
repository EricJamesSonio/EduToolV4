"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Users } from "lucide-react";
import { subjectApi } from "@/api/admin/subject.api";
import { sectionApi } from "@/api/admin/section.api";
import { semesterApi } from "@/api/admin/semester.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { useEducatorClasses } from "@/hooks/educator/useEducatorClasses";
import { toArray } from "@/utils/classes.utils";
import { formatSchedules } from "@/types/educator/class.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { EducatorClass } from "@/types/educator/class.types";

// ── Enriched shape used only in this page ────────────────────────────────────
interface EnrichedClass extends EducatorClass {
  subjectName: string | null;
  sectionName: string | null;
  semesterName: string | null;
  schoolYearName: string | null;
}

// ── Class card ────────────────────────────────────────────────────────────────
function ClassCard({
  cls,
  onClick,
}: {
  cls: EnrichedClass;
  onClick: () => void;
}): React.JSX.Element {
  const schedule = formatSchedules(cls.schedules);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card px-5 py-4 hover:border-primary/40 hover:bg-accent/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          {/* Subject name */}
          <p className="font-semibold text-base group-hover:text-primary transition-colors truncate">
            {cls.subjectName ?? cls.subject_id}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {cls.sectionName && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {cls.sectionName}
              </span>
            )}
            {schedule !== "No schedule" && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {schedule}
              </span>
            )}
          </div>
        </div>

        {/* Right: semester + school year badges */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {cls.semesterName && (
            <Badge variant="secondary" className="text-xs font-normal">
              {cls.semesterName}
            </Badge>
          )}
          {cls.schoolYearName && (
            <span className="text-xs text-muted-foreground">
              {cls.schoolYearName}
            </span>
          )}
          {cls.capacity > 0 && (
            <span className="text-xs text-muted-foreground">
              Cap: {cls.capacity}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function ClassCardSkeleton(): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card px-5 py-4 space-y-2">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EducatorClassesPage(): React.JSX.Element {
  const router = useRouter();

  const { data: classesRaw, isLoading: classesLoading } = useEducatorClasses();

  // Lookup tables — same pattern as admin classes page
  const { data: subjectsRaw } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: () => subjectApi.getAll(),
  });
  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections"],
    queryFn: () => sectionApi.getAll(),
  });
  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters"],
    queryFn: () => semesterApi.getAll(),
  });
  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });

  // Build lookup maps
  const subjectMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; title: string }>(subjectsRaw).forEach((s) =>
      m.set(s.id, s.title),
    );
    return m;
  }, [subjectsRaw]);

  const sectionMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; name: string }>(sectionsRaw).forEach((s) =>
      m.set(s.id, s.name),
    );
    return m;
  }, [sectionsRaw]);

  const semesterMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; name: string }>(semestersRaw).forEach((s) =>
      m.set(s.id, s.name),
    );
    return m;
  }, [semestersRaw]);

  const schoolYearMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; name: string }>(schoolYearsRaw).forEach((s) =>
      m.set(s.id, s.name),
    );
    return m;
  }, [schoolYearsRaw]);

  // Enrich classes
  const classes = useMemo<EnrichedClass[]>(() => {
    return toArray<EducatorClass>(classesRaw).map((cls) => ({
      ...cls,
      subjectName:  subjectMap.get(cls.subject_id)    ?? null,
      sectionName:  cls.section_id
                      ? (sectionMap.get(cls.section_id) ?? null)
                      : null,
      semesterName:  semesterMap.get(cls.semester_id)   ?? null,
      schoolYearName: schoolYearMap.get(cls.school_year_id) ?? null,
    }));
  }, [classesRaw, subjectMap, sectionMap, semesterMap, schoolYearMap]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        description="Classes currently assigned to you."
      />

      {classesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes assigned"
          description="You have no active classes yet. Contact your administrator."
        />
      ) : (
        <div className="space-y-2">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onClick={() => router.push(`/educator/classes/${cls.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}