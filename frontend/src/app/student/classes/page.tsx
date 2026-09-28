// frontend/src/app/student/classes/page.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { ClassCard } from "@/components/student/class/ClassCard";
import { ClassCardSkeleton } from "@/components/student/class/ClassCardSkeleton";
import { CardGrid } from "@/components/shared/CardGrid";
import { useStudentClasses } from "@/hooks/student/useStudentClasses";
import { useStudentSemesters } from "@/hooks/student/useStudentSemesters";
import type { StudentSemesterItem } from "@/api/student/semester.api";
import { Button } from "@/components/ui/button";
import { useMyAcademicHistory } from "@/hooks/admin/useAcademicHistory";
import { useAuth } from "@/hooks/useAuth";
import { RequestSubjectsDialog } from "@/components/admin/student/detail/RequestSubjectsDialog";

/**
 * Picks the semester that should be selected by default, in priority order:
 * 1. A semester whose date range contains today ("currently active" by date).
 * 2. If none is currently active, the next upcoming semester (earliest
 *    start date that's still in the future).
 * 3. If nothing is upcoming either (every semester has already ended),
 *    fall back to the most recently ended one so the view isn't empty.
 * Returns null only when there are no semesters at all.
 */
function getDefaultSemesterId(semesters: StudentSemesterItem[]): string | null {
  if (semesters.length === 0) return null;

  const now = Date.now();

  const current = semesters.find((s) => {
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    return start <= now && now <= end;
  });
  if (current) return current.id;

  const upcoming = semesters
    .filter((s) => new Date(s.startDate).getTime() > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  if (upcoming.length > 0) return upcoming[0].id;

  const past = [...semesters].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );
  return past[0]?.id ?? null;
}

export default function StudentClassesPage(): React.JSX.Element {
  const [semesterId, setSemesterId] = useState<string>("");
  const [requestOpen, setRequestOpen] = useState(false);
  // Tracks whether the person has explicitly picked a semester, so the
  // auto-default effect below doesn't stomp on their choice on refetch.
  const userSelectedRef = useRef(false);

  const { data: semestersData } = useStudentSemesters();
  const { data: classesData, isLoading, isError } = useStudentClasses();
  const { user } = useAuth();
  const { data: myHistory } = useMyAcademicHistory() as { data: { studentSchoolYearId: string; schoolYear: { id: string }; programEnrollments: { section?: { id: string } | null; status: string }[] }[] | undefined };
  const activeHistory = Array.isArray(myHistory) && myHistory.length > 0 ? (myHistory[0] as unknown as { studentSchoolYearId: string; id: string; schoolYear: { id: string }; programEnrollments: { section?: { id: string } | null; status: string }[] }) : null;
  const activeSsyId = activeHistory?.studentSchoolYearId ?? (activeHistory as unknown as { id: string } | null)?.id ?? undefined;
  const activeSchoolYearIdForRequest = activeHistory?.schoolYear?.id ?? undefined;
  const activeSectionId = activeHistory?.programEnrollments?.find((pe) => pe.status === "active")?.section?.id ?? activeHistory?.programEnrollments?.[0]?.section?.id ?? null;

  // Defensive normalisation — guards against undefined, wrapped envelopes,
  // or any non-array the query might return before/during loading
  const semesters: StudentSemesterItem[] = useMemo(() => {
    if (!semestersData) return [];
    if (Array.isArray(semestersData)) return semestersData;
    const inner = (semestersData as Record<string, unknown>)?.data;
    return Array.isArray(inner) ? (inner as StudentSemesterItem[]) : [];
  }, [semestersData]);

  // Once semesters load, default the selection to the current (or next
  // upcoming, or most recent past) semester — unless the person already
  // picked one themselves.
  useEffect(() => {
    if (userSelectedRef.current) return;
    if (semesters.length === 0) return;

    const stillValid = semesterId && semesters.some((s) => s.id === semesterId);
    if (stillValid) return;

    const defaultId = getDefaultSemesterId(semesters);
    if (defaultId) setSemesterId(defaultId);
  }, [semesters, semesterId]);

  const classes = useMemo(() => {
    if (!classesData) return [];
    if (Array.isArray(classesData)) return classesData;
    const inner = (classesData as Record<string, unknown>)?.data;
    return Array.isArray(inner) ? inner : [];
  }, [classesData]);

  const filtered = useMemo(() => {
    if (!semesterId) return classes;
    return classes.filter((item) => item.class.semesterId === semesterId);
  }, [classes, semesterId]);

  function handleSemesterChange(value: string | null): void {
    userSelectedRef.current = true;
    setSemesterId(value ?? "");
  }

  const selectedSemesterName = semesters.find((s) => s.id === semesterId)?.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        actions={
          semesters.length > 0 && (
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
          )
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
              selectedSemesterName
                ? `You have no enrolled classes for ${selectedSemesterName}.`
                : "You are not enrolled in any classes yet."
            }
          />
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Want to request subjects to take?</p>
            <Button variant="outline" onClick={() => setRequestOpen(true)}>Request Subjects</Button>
          </div>
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
        <RequestSubjectsDialog
          open={requestOpen}
          studentSchoolYearId={activeSsyId ?? ""}
          schoolYearId={activeSchoolYearIdForRequest}
          sectionId={activeSectionId}
          studentId={user?.id}
          origin="student_request"
          onClose={() => setRequestOpen(false)}
        />
      )}
    </div>
  );
}