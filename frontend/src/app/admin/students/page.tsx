"use client";
import { Suspense, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Users, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";

import { studentApi } from "@/api/admin/student.api";
import { levelApi } from "@/api/admin/level.api";
import { sectionApi } from "@/api/admin/section.api";
import type { Student } from "@/types/admin/student.types";
import type { GetStudentsQuery } from "@/api/admin/student.api";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toArray } from "@/utils/classes.utils";

import { StudentFilterBar } from "@/components/student/StudentFilterBar";
import { StudentTable } from "@/components/student/StudentTable";
import { CreateStudentDialog } from "@/components/student/CreateStudentDialog";

function StudentsPageInner(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<GetStudentsQuery>({});

  // ── Primary data ──────────────────────────────────────────────────────────
  const { data: studentsRaw, isLoading } = useQuery({
    queryKey: ["admin", "students", filters],
    queryFn: () => studentApi.getAll(filters),
  });

  // ── Lookup data ───────────────────────────────────────────────────────────
  const { data: levelsRaw } = useQuery({
    queryKey: ["admin", "levels", "all"],
    queryFn: () => levelApi.getAll(),
  });
  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections"],
    queryFn: () => sectionApi.getAll(),
  });

  // ── Lookup maps ───────────────────────────────────────────────────────────
  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; name: string }>(levelsRaw).forEach((l) =>
      map.set(l.id, l.name)
    );
    return map;
  }, [levelsRaw]);

  const sectionMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; name: string }>(sectionsRaw).forEach((s) =>
      map.set(s.id, s.name)
    );
    return map;
  }, [sectionsRaw]);

  // ── Enrich students ───────────────────────────────────────────────────────
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCredentials}
            >
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
        levels={toArray<{ id: string; name: string }>(levelsRaw)}
        sections={toArray<{ id: string; name: string }>(sectionsRaw)}
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
          levels={toArray<{ id: string; name: string }>(levelsRaw)}
          sections={toArray<{ id: string; name: string }>(sectionsRaw)}
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