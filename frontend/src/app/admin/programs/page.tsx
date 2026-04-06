// app/admin/programs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { programApi } from "@/api/admin/program.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { Program } from "@/types/admin/program.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, CalendarDays } from "lucide-react";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { CreateProgramDialog } from "@/components/admin/program/CreateProgramDialog";
import { ProgramCard } from "@/components/admin/program/ProgramCard";
import type { AxiosError } from "axios";

export default function ProgramsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
  });

  useEffect(() => {
    if (!schoolYears.length || selectedSchoolYearId) return;

    const active = schoolYears.find((sy) => sy.status === "active");
    setSelectedSchoolYearId(active?.id ?? schoolYears[0].id);
  }, [schoolYears]); // ← remove selectedSchoolYearId from deps

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["admin", "programs", selectedSchoolYearId],
    queryFn: () => programApi.getAll(selectedSchoolYearId!),
    enabled: !!selectedSchoolYearId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programApi.delete(id),
    onSuccess: () => {
      toast.success("Program deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin", "programs", selectedSchoolYearId] });
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete program.");
      setDeleteTarget(null);
    },
  });

  const isLoading = syLoading || programsLoading;
  const noSchoolYears = !syLoading && schoolYears.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        actions={
          <div className="flex items-center gap-3">
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
            <Button onClick={() => setCreateOpen(true)} disabled={!selectedSchoolYearId}>
              <Plus className="mr-2 h-4 w-4" />
              Add Program
            </Button>
          </div>
        }
      />

      {noSchoolYears ? (
        <EmptyState
          icon={CalendarDays}
          title="No school years found"
          description="Create a school year first before managing programs."
        />
      ) : !selectedSchoolYearId || isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : !programs?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No programs for this school year"
          description="Add a program manually or run the data seeder from the Organization page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {selectedSchoolYearId && (
        <CreateProgramDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          schoolYearId={selectedSchoolYearId}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this program?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone. Make sure it has no levels, courses, or strands assigned to it first.`}
          confirmLabel="Delete Program"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}