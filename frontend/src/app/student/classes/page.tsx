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
import { useStudentClasses } from "@/hooks/student/useStudentClassess";
import { useStudentSemesters } from "@/hooks/student/useStudentSemesters";
import type { StudentSemesterItem } from "@/api/student/semester.api";

export default function StudentClassesPage(): React.JSX.Element {
  const [semesterId, setSemesterId] = useState<string>("all");

  const { data: semesters = [] as StudentSemesterItem[] } = useStudentSemesters();
  const { data: classes = [], isLoading, isError } = useStudentClasses();

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
              <SelectValue placeholder="All Semesters" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClassCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={BookOpen}
          title="Failed to load classes"
          description="Something went wrong while fetching your classes. Please try again."
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No classes found"
          description={
            semesterId !== "all"
              ? "You have no enrolled classes for this semester."
              : "You are not enrolled in any classes yet."
          }
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <ClassCard key={item.enrollmentId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}