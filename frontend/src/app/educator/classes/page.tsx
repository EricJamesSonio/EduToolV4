"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Users } from "lucide-react";

import { subjectApi } from "@/api/admin/subject.api";
import { sectionApi } from "@/api/admin/section.api";
import { semesterApi } from "@/api/admin/semester.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { courseApi } from "@/api/admin/course.api";
import { strandApi } from "@/api/admin/strand.api";

import { useEducatorClasses } from "@/hooks/educator/useEducatorClasses";
import { toArray } from "@/utils/classes.utils";
import { formatSchedules } from "@/types/educator/class.types";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import type { EducatorClass } from "@/types/educator/class.types";
import type { Subject } from "@/types/admin/subject.types";

interface EnrichedClass extends EducatorClass {
  subjectName:  string | null;
  sectionName:  string | null;
  semesterName: string | null;
  schoolYearName: string | null;
  // NEW
  programName:  string | null;
  levelName:    string | null;
  courseName:   string | null;
  strandName:   string | null;
}

function ClassCard({
  cls,
  onClick,
}: {
  cls: EnrichedClass;
  onClick: () => void;
}): React.JSX.Element {
  const schedule = formatSchedules(cls.schedules);

  // Build a readable context label: e.g. "BSCS · 1st Year · Section A"
  // or "Elementary · Grade 3 · Section A"
  const contextParts = [
    cls.courseName ?? cls.strandName ?? cls.programName,
    cls.levelName,
    cls.sectionName,
  ].filter(Boolean);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border bg-card px-5 py-4 hover:border-primary/40 hover:bg-accent/30 transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <p className="font-semibold text-base group-hover:text-primary transition-colors truncate">
            {cls.subjectName ?? cls.subject_id}
          </p>

          {/* Context line — program / level / section */}
          {contextParts.length > 0 && (
            <p className="text-xs font-medium text-primary/80 truncate">
              {contextParts.join(" · ")}
            </p>
          )}

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

function ClassCardSkeleton(): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card px-5 py-4 space-y-2">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}

export default function EducatorClassesPage(): React.JSX.Element {
  const router = useRouter();

  const { data: classesRaw, isLoading: classesLoading } = useEducatorClasses();

  const { data: subjectsRaw } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn:  () => subjectApi.getAll(),
  });

  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters"],
    queryFn:  () => semesterApi.getAll(),
  });

  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  () => schoolYearApi.getAll(),
  });

  const activeSchoolYearId = useMemo(() => {
    const arr = toArray<{ id: string; status: string }>(schoolYearsRaw);
    return arr.find((sy) => sy.status === "active")?.id ?? null;
  }, [schoolYearsRaw]);

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections", activeSchoolYearId],
    queryFn:  () => sectionApi.getAll(activeSchoolYearId!),
    enabled:  !!activeSchoolYearId,
  });

  // Courses and strands — needed to resolve course/strand name from subject
  const { data: coursesRaw } = useQuery({
    queryKey: ["admin", "courses", activeSchoolYearId],
    queryFn:  () => courseApi.getAll({ schoolYearId: activeSchoolYearId! }),
    enabled:  !!activeSchoolYearId,
  });

  const { data: strandsRaw } = useQuery({
    queryKey: ["admin", "strands"],
    queryFn:  () => strandApi.getAll(),
  });

  // ── Maps ─────────────────────────────────────────────────────────────────

  const subjectMap = useMemo(() => {
    const m = new Map<string, Subject>();
    toArray<Subject>(subjectsRaw).forEach((s) => m.set(s.id, s));
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

  const courseMap = useMemo(() => {
    const m = new Map<string, string>();
    toArray<{ id: string; name: string; code?: string }>(coursesRaw).forEach((c) =>
      // Prefer code (e.g. "BSCS") over full name for space efficiency
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

  // ── Enrich ───────────────────────────────────────────────────────────────

  const classes = useMemo<EnrichedClass[]>(() => {
    return toArray<EducatorClass>(classesRaw).map((cls) => {
      const subject = subjectMap.get(cls.subject_id);

      const courseName = subject?.courseId
        ? (courseMap.get(subject.courseId) ?? null)
        : null;

      const strandName = subject?.strandId
        ? (strandMap.get(subject.strandId) ?? null)
        : null;

      return {
        ...cls,
        subjectName:    subject?.title ?? null,
        programName:    subject?.programName ?? null,
        levelName:      subject?.levelName ?? null,
        courseName,
        strandName,
        sectionName:    cls.section_id ? (sectionMap.get(cls.section_id) ?? null) : null,
        semesterName:   semesterMap.get(cls.semester_id) ?? null,
        schoolYearName: schoolYearMap.get(cls.school_year_id) ?? null,
      };
    });
  }, [classesRaw, subjectMap, sectionMap, semesterMap, schoolYearMap, courseMap, strandMap]);

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