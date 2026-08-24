// frontend/src/app/student/classes/page.tsx
"use client";

import { useState, useMemo } from "react";
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
import { RequestSubjectsDialog } from "@/components/admin/student/detail/RequestSubjectsDialog";

export default function StudentClassesPage(): React.JSX.Element {
  const [semesterId, setSemesterId] = useState<string>("all");
  const [requestOpen, setRequestOpen] = useState(false);

  const { data: semestersData } = useStudentSemesters();
  const { data: classesData, isLoading, isError } = useStudentClasses();
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

  const classes = useMemo(() => {
    if (!classesData) return [];
    if (Array.isArray(classesData)) return classesData;
    const inner = (classesData as Record<string, unknown>)?.data;
    return Array.isArray(inner) ? inner : [];
  }, [classesData]);

  const filtered = useMemo(() => {
    if (semesterId === "all") return classes;
    return classes.filter((item) => item.class.semesterId === semesterId);
  }, [classes, semesterId]);

  function handleSemesterChange(value: string | null): void {
    setSemesterId(value ?? "all");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Classes"
        actions={
          <Select value={semesterId} onValueChange={handleSemesterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Semesters">
                {semesters.find((s) => s.id === semesterId)?.name ?? "All Semesters"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map((s: StudentSemesterItem) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              semesterId !== "all"
                ? "You have no enrolled classes for this semester."
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
          origin="student_request"
          onClose={() => setRequestOpen(false)}
        />
      )}
    </div>
  );
}