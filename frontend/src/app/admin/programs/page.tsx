"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { programApi } from "@/api/admin/program.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { usePrograms } from "@/hooks/admin/usePrograms";
import type { Program } from "@/types/admin/program.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, CalendarDays } from "lucide-react";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { CreateProgramDialog } from "@/components/admin/program/CreateProgramDialog";
import { ProgramCard } from "@/components/admin/program/ProgramCard";
import { useOrganizationGuard } from "@/context/OrganizationGuardContext";
import type { AxiosError } from "axios";

export default function ProgramsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { ensureOrganization } = useOrganizationGuard();

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  const { data: schoolYears = [], isLoading: syLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  // Auto-select active or first school year once;
  // respect ?schoolYearId search param if present and valid
  useEffect(() => {
    if (!schoolYears.length || selectedSchoolYearId) return;
    const urlId = searchParams.get("schoolYearId");
    if (urlId && schoolYears.some((sy) => sy.id === urlId)) {
      setSelectedSchoolYearId(urlId);
      return;
    }
    const active = schoolYears.find((sy) => sy.status === "active");
    setSelectedSchoolYearId(active?.id ?? schoolYears[0].id);
  }, [schoolYears, searchParams]);

  const {
    data: programs,
    isLoading: programsLoading,
    isError: programsError,
    refetch: refetchPrograms,
  } = usePrograms(selectedSchoolYearId ?? undefined);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programApi.delete(id),
    onSuccess: () => {
      toast.success("Program deleted.");
      if (selectedSchoolYearId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.programs.list({ schoolYearId: selectedSchoolYearId }) });
      }
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to delete program.");
      setDeleteTarget(null);
    },
  });

  const noSchoolYears = !syLoading && schoolYears.length === 0;

  if (noSchoolYears) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No school years found"
        description="Create a school year first before managing programs."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_programs" />
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
          </div>
        }
      />

      {selectedSchoolYearId && (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => ensureOrganization(() => setCreateOpen(true))} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Program
          </Button>
        </div>
      )}

      <AsyncListState
        isLoading={programsLoading}
        isError={programsError}
        isEmpty={!programsLoading && !programsError && !programs?.length}
        onRetry={refetchPrograms}
        errorTitle="Failed to load programs"
        empty={{
          icon: BookOpen,
          title: "No programs for this school year",
          description:
            "Add a program manually or run the data seeder from the Organization page.",
        }}
        loading={
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {programs?.map((program) => (
            <ProgramCard key={program.id} program={program} onDelete={setDeleteTarget} />
          ))}
        </div>
      </AsyncListState>

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