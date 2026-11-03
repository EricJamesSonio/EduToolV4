// frontend/src/app/student/classes/page.tsx
"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { ClassCard } from "@/components/student/class/ClassCard";
import { ClassCardSkeleton } from "@/components/student/class/ClassCardSkeleton";
import { CardGrid } from "@/components/shared/CardGrid";
import { useStudentClasses } from "@/hooks/student/useStudentClasses";
import { useStudentSemesters } from "@/hooks/student/useStudentSemesters";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { StudentSemesterItem } from "@/api/student/semester.api";
import type { SchoolYear } from "@/types/admin/school-year.types";
import { toArray } from "@/utils/classes.utils";
import { Button } from "@/components/ui/button";
import { RequestSubjectsDialog } from "@/components/student/class/RequestSubjectsDialog";

import { getDefaultSemesterId } from "@/utils/semester.utils";

export default function StudentClassesPage(): React.JSX.Element {
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [semesterId, setSemesterId] = useState<string>("");
  const [requestOpen, setRequestOpen] = useState(false);
  // Tracks whether the person has explicitly picked a semester, so the
  // auto-default effect below doesn't stomp on their choice on refetch.
  const userSelectedRef = useRef(false);

  const { data: semestersData } = useStudentSemesters();
  const { data: classesData, isLoading, isError } = useStudentClasses();
  const { data: schoolYearsRaw, isLoading: schoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );

  // Defensive normalisation — guards against undefined, wrapped envelopes,
  // or any non-array the query might return before/during loading
  const allSemesters: StudentSemesterItem[] = useMemo(() => {
    if (!semestersData) return [];
    if (Array.isArray(semestersData)) return semestersData;
    const inner = (semestersData as Record<string, unknown>)?.data;
    return Array.isArray(inner) ? (inner as StudentSemesterItem[]) : [];
  }, [semestersData]);

  const classes = useMemo(() => {
    if (!classesData) return [];
    if (Array.isArray(classesData)) return classesData;
    const inner = (classesData as Record<string, unknown>)?.data;
    return Array.isArray(inner) ? inner : [];
  }, [classesData]);

  const allSchoolYears = useMemo(
    () => toArray<SchoolYear>(schoolYearsRaw),
    [schoolYearsRaw],
  );

  // Only offer the active year plus years in which the student has classes.
  // Held back until classes load so the default pick is based on real data.
  const schoolYearOptions = useMemo<SchoolYear[]>(() => {
    if (isLoading) return [];
    const enrolledYearIds = new Set(classes.map((item) => item.class.schoolYearId));
    return allSchoolYears.filter(
      (sy) => sy.status === "active" || enrolledYearIds.has(sy.id),
    );
  }, [allSchoolYears, classes, isLoading]);

  const handleSchoolYearChange = useCallback((id: string): void => {
    userSelectedRef.current = false;
    setSchoolYearId(id);
    setSemesterId("");
  }, []);

  const semesters: StudentSemesterItem[] = useMemo(() => {
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

  const filtered = useMemo(() => {
    return classes.filter((item) => {
      if (schoolYearId && item.class.schoolYearId !== schoolYearId) return false;
      if (semesterId && item.class.semesterId !== semesterId) return false;
      return true;
    });
  }, [classes, schoolYearId, semesterId]);

  function handleSemesterChange(value: string | null): void {
    userSelectedRef.current = true;
    setSemesterId(value ?? "");
  }

  const selectedSemesterName = semesters.find((s) => s.id === semesterId)?.name;
  const selectedSchoolYear = allSchoolYears.find((sy) => sy.id === schoolYearId);
  const isViewingEndedYear = selectedSchoolYear?.status === "ended";
  const scopeLabel = [selectedSemesterName, selectedSchoolYear?.name]
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
                isLoading={schoolYearsLoading || isLoading}
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
                  {semesters.map((s: StudentSemesterItem) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isViewingEndedYear && (
              <Button variant="outline" onClick={() => setRequestOpen(true)}>
                Request Subjects
              </Button>
            )}
          </>
        }
      />

      {isLoading && (
        <CardGrid className="sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </CardGrid>
      )}

      {isError && (
        <EmptyState
          icon={BookOpen}
          title="Failed to load classes"
          description="Something went wrong while fetching your classes. Please try again."
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="space-y-4">
          <EmptyState
            icon={BookOpen}
            title="No classes found"
            description={
              scopeLabel
                ? `You have no enrolled classes for ${scopeLabel}.`
                : "You are not enrolled in any classes yet."
            }
          />
          {!isViewingEndedYear && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Want to request subjects to take?</p>
              <Button variant="outline" onClick={() => setRequestOpen(true)}>Request Subjects</Button>
            </div>
          )}
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <CardGrid className="sm:gap-5">
          {filtered.map((item, i) => (
            <ClassCard key={item.enrollmentId} item={item} colorIndex={i} />
          ))}
        </CardGrid>
      )}

      {requestOpen && (
        <RequestSubjectsDialog open={requestOpen} onClose={() => setRequestOpen(false)} />
      )}
    </div>
  );
}