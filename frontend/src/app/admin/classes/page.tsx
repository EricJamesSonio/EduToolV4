"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { GraduationCap, Plus } from "lucide-react";

import { classApi } from "@/api/admin/class.api";
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

export default function ClassesPage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const defaultSubjectId: string | undefined =
    searchParams.get("subjectId") ?? undefined;

  const [createOpen, setCreateOpen] = useState(defaultSubjectId !== undefined);
  const [archiveTarget, setArchiveTarget] = useState<Class | null>(null);

  const filters = useClassFilters();

  // ─── Data ──────────────────────────────────────────────────────────────────

  const { data: classesRaw, isLoading } = useQuery({
    queryKey: ["admin", "classes", filters.query],
    queryFn: () => classApi.getAll(filters.query),
  });
  const classes = toArray<Class>(classesRaw);

  // ─── Archive ───────────────────────────────────────────────────────────────

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

  // ─── Render ────────────────────────────────────────────────────────────────

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
          message={`Archive "${archiveTarget.subjectName ?? "this class"}"? It will become read-only and hidden from active views.`}
          confirmLabel="Archive Class"
          destructive
          isLoading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          onOpenChange={(o) => { if (!o) setArchiveTarget(null); }}
        />
      )}
    </div>
  );
}