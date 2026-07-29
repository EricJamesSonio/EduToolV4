"use client";

import { use, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, Layers } from "lucide-react";
import { levelApi } from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProgramGroup } from "@/components/admin/levels/ProgramGroup";
import type { Level } from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";

export default function SchoolYearLevelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: schoolYear, isLoading: syLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.detail(id),
    () => schoolYearApi.getById(id),
  );

  const { data: levels, isLoading: levelsLoading } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId: id }),
    () => levelApi.getBySchoolYear(id),
  );

  const { data: programs, isLoading: programsLoading } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: id }),
    () => programApi.getAll(id),
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.levels.list({ schoolYearId: id }) });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.updateOne(id, name),
    onMutate: ({ id }) => setUpdatingId(id),
    onSuccess: () => {
      toast.success("Level renamed.");
      invalidate();
    },
    onError: () => toast.error("Failed to rename level."),
    onSettled: () => setUpdatingId(null),
  });

  const generateMutation = useMutation({
    mutationFn: ({ programId, count }: { programId: string; count: number }) =>
      levelApi.bulkGenerate({ programId, schoolYearId: id, count }),
    onSuccess: () => {
      toast.success("Levels generated.");
      invalidate();
    },
    onError: () => toast.error("Failed to generate levels."),
  });

  // Derives a sensible default name for the new level based on existing ones.
  // e.g. if the program already has "Grade 1", "Grade 2" → new level = "Grade 3"
  const createMutation = useMutation({
    mutationFn: ({ programId, name }: { programId: string; name: string }) =>
      levelApi.create({ programId, name, schoolYearId: id }),
    onSuccess: () => {
      toast.success("Level added.");
      invalidate();
    },
    onError: () => toast.error("Failed to add level."),
  });

  const deleteMutation = useMutation({
    mutationFn: (levelId: string) => levelApi.deleteOne(levelId),
    onSuccess: () => {
      toast.success("Level deleted.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete level."),
  });

  const isLoading = syLoading || levelsLoading || programsLoading;
  const isEnded = schoolYear?.status === "ended";

  const levelsByProgram = (levels ?? []).reduce<Record<string, Level[]>>(
    (acc, level) => {
      if (!acc[level.program_id]) acc[level.program_id] = [];
      acc[level.program_id].push(level);
      return acc;
    },
    {}
  );

  /** Derive the next level name from the existing ones for a program. */
  function nextLevelName(programLevels: Level[]): string {
    return `Level ${programLevels.length + 1}`;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/school-years"
          className="hover:text-foreground transition-colors"
        >
          School Years
        </Link>
        <span>/</span>
        <Link
          href={`/admin/school-years/${id}`}
          className="hover:text-foreground transition-colors"
        >
          {syLoading ? "..." : (schoolYear?.name ?? "Detail")}
        </Link>
        <span>/</span>
        <span className="text-foreground">Levels</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/school-years/${id}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold not-interactive">Levels</h1>
            {schoolYear && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                {schoolYear.name}
                <StatusBadge status={schoolYear.status} />
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ended banner */}
      {isEnded && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="not-interactive">This school year has ended. Levels are read-only.</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !programs?.length ? (
        <div className="rounded-lg border bg-card px-6 py-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No programs found for this school year
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Run the data seeder on the Organization page to set up programs.
          </p>
          <Link
            href="/admin/organization"
            className="mt-3 inline-block text-xs text-primary hover:underline"
          >
            Go to Organization →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program: Program) => (
            <ProgramGroup
              key={program.id}
              program={program}
              levels={levelsByProgram[program.id] ?? []}
              isEnded={isEnded ?? false}
              onUpdate={(levelId, name) =>
                updateMutation.mutate({ id: levelId, name })
              }
              onDelete={(level) => setDeleteTarget(level)}
              onGenerate={(programId, count) =>
                generateMutation.mutate({ programId, count })
              }
              onAdd={(programId) => {
                const existing = levelsByProgram[programId] ?? [];
                createMutation.mutate({
                  programId,
                  name: nextLevelName(existing),
                });
              }}
              isUpdating={updateMutation.isPending}
              isGenerating={generateMutation.isPending}
              isAdding={createMutation.isPending}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this level?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone. Any classes or students linked to this level may be affected.`}
          confirmLabel="Delete Level"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}