"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { BookOpen, Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";

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
import { CardGrid } from "@/components/shared/CardGrid";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import {
  ListItemCardAction,
  listItemCardClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { EducatorClass } from "@/types/educator/class.types";
import type { Subject } from "@/types/admin/subject.types";
import type { Semester } from "@/types/admin/semester.types";
import type { SchoolYear } from "@/types/admin/school-year.types";

import { getDefaultSemesterId } from "@/utils/semester.utils";

interface EnrichedClass extends EducatorClass {
  subjectName:  string | null;
  sectionName:  string | null;
  semesterName: string | null;
  schoolYearName: string | null;
  programName:  string | null;
  levelName:    string | null;
  courseName:   string | null;
  strandName:   string | null;
}

function ClassCard({
  cls,
  onClick,
  colorIndex = 0,
}: {
  cls: EnrichedClass;
  onClick: () => void;
  colorIndex?: number;
}): React.JSX.Element {
  const schedule = formatSchedules(cls.schedules);

  const contextParts = [
    cls.courseName ?? cls.strandName ?? cls.programName,
    cls.levelName,
    cls.sectionName,
  ].filter(Boolean);

  return (
    <div className={listItemCardClass}>
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-2 sm:p-2.5 shrink-0", WEEK_COLORS[colorIndex % WEEK_COLORS.length])}>
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className={cn(listItemTitleClass, "truncate")}>
            {cls.subjectName ?? "Unnamed Class"}
          </h3>
          <div className="space-y-0.5">
            {contextParts.length > 0 && (
              <p className="text-sm text-muted-foreground truncate">
                {contextParts.join(" · ")}
              </p>
            )}
            {schedule !== "No schedule" && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{schedule}</span>
              </p>
            )}
          </div>
        </div>
        {cls.semesterName && (
          <Badge variant="secondary" className="text-xs font-normal shrink-0 mt-0.5">
            {cls.semesterName}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {cls.schoolYearName && (
            <span className="text-xs text-muted-foreground">{cls.schoolYearName}</span>
          )}
          {cls.capacity > 0 && (
            <span className="text-xs text-muted-foreground">Cap: {cls.capacity}</span>
          )}
        </div>
        <ListItemCardAction icon={Eye} label="View" onClick={onClick} />
      </div>
    </div>
  );
}

function ClassCardSkeleton(): React.JSX.Element {
  return (
    <div className={listItemCardClass}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-md shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-5 w-16 rounded-md shrink-0" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
}

export default function EducatorClassesPage(): React.JSX.Element {
  const router = useRouter();

  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [semesterId, setSemesterId] = useState<string>("");
  // Tracks whether the person has explicitly picked a semester, so the
  // auto-default effect below doesn't stomp on their choice on refetch.
  const userSelectedRef = useRef(false);

  const { data: classesRaw, isLoading: classesLoading } = useEducatorClasses();

  const { data: subjectsRaw } = useAsyncQuery(
    queryKeys.admin.subjects.all,
    () => subjectApi.getAll(),
  );

  const { data: semestersRaw } = useAsyncQuery(
    queryKeys.admin.semesters.list(),
    () => semesterApi.getAll(),
  );

  const { data: schoolYearsRaw, isLoading: schoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );

  const allSchoolYears = useMemo(
    () => toArray<SchoolYear>(schoolYearsRaw),
    [schoolYearsRaw],
  );

  const rawClasses = useMemo(
    () => toArray<EducatorClass>(classesRaw),
    [classesRaw],
  );

  // Only offer the active year plus years in which this educator has classes.
  // Held back until classes load so the default pick is based on real data.
  const schoolYearOptions = useMemo<SchoolYear[]>(() => {
    if (classesLoading) return [];
    const taughtYearIds = new Set(rawClasses.map((c) => c.school_year_id));
    return allSchoolYears.filter(
      (sy) => sy.status === "active" || taughtYearIds.has(sy.id),
    );
  }, [allSchoolYears, rawClasses, classesLoading]);

  const handleSchoolYearChange = useCallback((id: string): void => {
    userSelectedRef.current = false;
    setSchoolYearId(id);
    setSemesterId("");
  }, []);

  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId: schoolYearId! }),
    () => sectionApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  // Courses and strands — needed to resolve course/strand name from subject
  const { data: coursesRaw } = useAsyncQuery(
    queryKeys.admin.courses.list({ schoolYearId: schoolYearId! }),
    () => courseApi.getAll({ schoolYearId: schoolYearId! }),
    { enabled: !!schoolYearId },
  );

  const { data: strandsRaw } = useAsyncQuery(
    queryKeys.admin.strands.list(),
    () => strandApi.getAll(),
  );

  const allSemesters = useMemo(
    () => toArray<Semester>(semestersRaw),
    [semestersRaw],
  );

  const semesters = useMemo(() => {
    if (!schoolYearId) return [];
    return allSemesters.filter((s) => s.schoolYearId === schoolYearId);
  }, [allSemesters, schoolYearId]);

  // Once the selected year's semesters load, default the selection to the
  // current (or next upcoming, or most recent past) semester — unless the
  // person already picked one themselves.
  useEffect(() => {
    if (userSelectedRef.current) return;
    if (semesters.length === 0) return;

    const stillValid = semesterId && semesters.some((s) => s.id === semesterId);
    if (stillValid) return;

    const defaultId = getDefaultSemesterId(semesters);
    if (defaultId) setSemesterId(defaultId);
  }, [semesters, semesterId]);

  function handleSemesterChange(value: string | null): void {
    userSelectedRef.current = true;
    setSemesterId(value ?? "");
  }

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
    allSemesters.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [allSemesters]);

  const schoolYearMap = useMemo(() => {
    const m = new Map<string, string>();
    allSchoolYears.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [allSchoolYears]);

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
    return rawClasses.map((cls) => {
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
  }, [rawClasses, subjectMap, sectionMap, semesterMap, schoolYearMap, courseMap, strandMap]);

  const filtered = useMemo(() => {
    return classes.filter((cls) => {
      if (schoolYearId && cls.school_year_id !== schoolYearId) return false;
      if (semesterId && cls.semester_id !== semesterId) return false;
      return true;
    });
  }, [classes, schoolYearId, semesterId]);

  const selectedSemesterName = semesters.find((s) => s.id === semesterId)?.name;
  const selectedSchoolYearName = allSchoolYears.find(
    (sy) => sy.id === schoolYearId,
  )?.name;
  const scopeLabel = [selectedSemesterName, selectedSchoolYearName]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        actions={
          <>
            <div className="w-full sm:w-72">
              <SchoolYearSelector
                schoolYears={schoolYearOptions}
                isLoading={schoolYearsLoading || classesLoading}
                selectedId={schoolYearId}
                onSelect={handleSchoolYearChange}
              />
            </div>
            {semesters.length > 0 && (
              <Select value={semesterId} onValueChange={handleSemesterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select semester">
                    {selectedSemesterName ?? "Select semester"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        }
      />

      {classesLoading ? (
        <CardGrid>
          {[1, 2, 3].map((i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </CardGrid>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes assigned"
          description={
            scopeLabel
              ? `You have no active classes for ${scopeLabel}.`
              : "You have no active classes yet. Contact your administrator."
          }
        />
      ) : (
        <CardGrid>
          {filtered.map((cls, i) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              colorIndex={i}
              onClick={() => router.push(`/educator/classes/${cls.id}`)}
            />
          ))}
        </CardGrid>
      )}
    </div>
  );
}