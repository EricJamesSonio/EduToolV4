"use client";

import { Suspense, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";

import { studentApi } from "@/api/admin/student.api";
import { levelApi } from "@/api/admin/level.api";
import { sectionApi } from "@/api/admin/section.api";
import type { Student } from "@/types/admin/student.types";
import type { Section } from "@/types/admin/section.types";
import type { GetStudentsQuery } from "@/api/admin/student.api";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toArray } from "@/utils/classes.utils";
import { StudentFilterBar } from "@/components/admin/student/StudentFilterBar";
import { StudentTable } from "@/components/admin/student/StudentTable";
import { CreateStudentDialog } from "@/components/admin/student/CreateStudentDialog";

function StudentsPageInner(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<GetStudentsQuery>({});

  const { data: studentsRaw, isLoading } = useQuery({
    queryKey: ["admin", "students", filters],
    queryFn: () => studentApi.getAll(filters),
  });

  const { data: levelsRaw } = useQuery({
    queryKey: ["admin", "levels", "all"],
    queryFn: () => levelApi.getAll(),
  });

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections"],
    queryFn: () => sectionApi.getAll(),
  });

  const levels = useMemo(
    () => toArray<{ id: string; name: string }>(levelsRaw),
    [levelsRaw],
  );

  const allSections = useMemo(
    () => toArray<Section>(sectionsRaw),
    [sectionsRaw],
  );

  // Filter sections shown in the filter bar by selected level
  const filteredSections = useMemo(() => {
    if (!filters.levelId) return allSections;
    return allSections.filter((s) => s.level_id === filters.levelId);
  }, [allSections, filters.levelId]);

  // Filter sections shown in create dialog by selected level
  // (passed down; dialog handles its own selected level internally)
  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [levels]);

  const sectionMap = useMemo(() => {
    const map = new Map<string, string>();
    allSections.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [allSections]);

  const students = useMemo<(Student & { levelName?: string; sectionName?: string })[]>(() => {
    return toArray<Student>(studentsRaw).map((s) => ({
      ...s,
      levelName:   s.levelId   ? (levelMap.get(s.levelId)     ?? s.levelId)   : undefined,
      sectionName: s.sectionId ? (sectionMap.get(s.sectionId) ?? s.sectionId) : undefined,
    }));
  }, [studentsRaw, levelMap, sectionMap]);

  const handleDownloadCredentials = () => {
    window.open(studentApi.downloadCredentials(), "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCredentials}>
              <Download className="mr-1.5 h-4 w-4" />
              Download Credentials
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/students/import")}
            >
              Import CSV
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Student
            </Button>
          </div>
        }
      />

      <StudentFilterBar
        filters={filters}
        onChange={setFilters}
        levels={levels}
        sections={filteredSections}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Create your first student or adjust your filters."
          action={{ label: "New Student", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <StudentTable
          data={students}
          onView={(s) => router.push(`/admin/students/${s.id}`)}
        />
      )}

      {createOpen && (
        <CreateStudentDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
          }}
          levels={levels}
          sections={allSections}
        />
      )}
    </div>
  );
}

export default function StudentsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <StudentsPageInner />
    </Suspense>
  );
}