"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSemesters, useDeleteSemester } from "@/hooks/admin/useSemester";
import type { Semester } from "@/types/admin/semester.types";
import { SemesterCard } from "@/components/admin/semester/SemesterCard";
import { SemesterFormDialog } from "@/components/admin/semester/SemesterFormDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CalendarDays } from "lucide-react";
import type { AxiosError } from "axios";

export default function SemesterSettingsPage(): React.JSX.Element {
  const { data: semesters = [], isLoading } = useSemesters();
  const deleteMutation = useDeleteSemester();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Semester deleted.");
        setDeleteTarget(null);
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(
          axiosErr?.response?.data?.message ?? "Failed to delete semester."
        );
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semester Settings"
        description="Configure semesters and their academic terms."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Semester
          </Button>
        }
      />

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : semesters.length === 0 ? (
        <div className="rounded-lg border bg-card px-6 py-16 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No semesters yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first semester to define academic terms.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Semester
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {semesters.map((semester) => (
            <SemesterCard
              key={semester.id}
              semester={semester}
              onEdit={() => setEditTarget(semester)}
              onDelete={() => setDeleteTarget(semester)}
            />
          ))}
        </div>
      )}

      {/* Create */}
      <SemesterFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit */}
      {editTarget && (
        <SemesterFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          semester={editTarget}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this semester?"
          message={`Delete "${deleteTarget.name}"? All terms within it will also be removed.`}
          confirmLabel="Delete Semester"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}