"use client";
import { Suspense, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { GraduationCap, Plus } from "lucide-react";

import { classApi } from "@/api/admin/class.api";
import { subjectApi } from "@/api/admin/subject.api";
import { educatorApi } from "@/api/admin/educator.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { semesterApi } from "@/api/admin/semester.api";
import { sectionApi } from "@/api/admin/section.api";

import type { Class } from "@/types/admin/class.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useClassFilters } from "@/hooks/admin/useClassFilters";
import { toArray } from "@/utils/classes.utils";
import { ClassesFilterBar } from "@/components/class/ClassesFilterBar";
import { ClassesTable } from "@/components/class/ClassesTable";
import { CreateClassDialog } from "@/components/class/CreateClassDialog";

function ClassesPageInner(): React.JSX.Element {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const defaultSubjectId: string | undefined =
    searchParams.get("subjectId") ?? undefined;

  const [createOpen, setCreateOpen] = useState(defaultSubjectId !== undefined);
  const [archiveTarget, setArchiveTarget] = useState<Class | null>(null);

  const filters = useClassFilters();

  // ── Primary data ──────────────────────────────────────────────────────────
  const { data: classesRaw, isLoading } = useQuery({
    queryKey: ["admin", "classes", filters.query],
    queryFn: () => classApi.getAll(filters.query),
  });

  // ── Lookup data ───────────────────────────────────────────────────────────
  const { data: subjectsRaw } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: () => subjectApi.getAll(),
  });
  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
  });
  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });
  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters"],
    queryFn: () => semesterApi.getAll(),
  });
  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections"],
    queryFn: () => sectionApi.getAll(),
  });

  // ── Lookup maps ───────────────────────────────────────────────────────────
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; title: string }>(subjectsRaw).forEach((s) =>
      map.set(s.id, s.title)
    );
    return map;
  }, [subjectsRaw]);

  const educatorMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; fullName: string }>(educatorsRaw).forEach((e) =>
      map.set(e.id, e.fullName)
    );
    return map;
  }, [educatorsRaw]);

  const schoolYearMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; name: string }>(schoolYearsRaw).forEach((sy) =>
      map.set(sy.id, sy.name)
    );
    return map;
  }, [schoolYearsRaw]);

  const semesterMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; name: string }>(semestersRaw).forEach((sem) =>
      map.set(sem.id, sem.name)
    );
    return map;
  }, [semestersRaw]);

  const sectionMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; name: string }>(sectionsRaw).forEach((s) =>
      map.set(s.id, s.name)
    );
    return map;
  }, [sectionsRaw]);

  // ── Enrich classes ────────────────────────────────────────────────────────
  const classes = useMemo<Class[]>(() => {
    return toArray<Class>(classesRaw).map((cls) => ({
      ...cls,
      subjectName:     subjectMap.get(cls.subjectId)      ?? cls.subjectName,
      educatorName:    educatorMap.get(cls.educatorId)     ?? cls.educatorName,
      schoolYearTitle: schoolYearMap.get(cls.schoolYearId) ?? cls.schoolYearTitle,
      semesterName:    semesterMap.get(cls.semesterId)     ?? cls.semesterName,
      sectionName:     cls.sectionId
                         ? (sectionMap.get(cls.sectionId) ?? cls.sectionName)
                         : cls.sectionName,
      title:           subjectMap.get(cls.subjectId)      ?? cls.subjectName ?? cls.subjectId,
    }));
  }, [classesRaw, subjectMap, educatorMap, schoolYearMap, semesterMap, sectionMap]);

  // ── Archive mutation ──────────────────────────────────────────────────────
  const archiveMutation = useMutation({
    mutationFn: (id: string) => classApi.archive(id),
    onSuccess: () => {
      toast.success("Class archived.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
      setArchiveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to archive class.");
      setArchiveTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Class
          </Button>
        }
      />
      <ClassesFilterBar {...filters} />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes found"
          description="Create your first class to get started."
          action={{ label: "New Class", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <ClassesTable data={classes} onArchive={setArchiveTarget} />
      )}

      {createOpen && (
        <CreateClassDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          defaultSubjectId={defaultSubjectId}
        />
      )}

      {archiveTarget && (
        <ConfirmDialog
          open
          title="Archive this class?"
          message={`Archive "${archiveTarget.title ?? archiveTarget.subjectName ?? "this class"}"? It will become read-only and hidden from active views.`}
          confirmLabel="Archive Class"
          destructive
          isLoading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          onOpenChange={(o) => {
            if (!o) setArchiveTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default function ClassesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <ClassesPageInner />
    </Suspense>
  );
}