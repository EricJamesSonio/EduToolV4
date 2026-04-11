"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, Layers } from "lucide-react";

import { levelApi }   from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import type { Level } from "@/types/admin/level.types";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton }      from "@/components/ui/skeleton";
import { Badge }         from "@/components/ui/badge";
import { ProgramGroup }  from "@/components/admin/levels/ProgramGroup";

import { SectionsPanel } from "./SectionsPanel";

interface LevelWithSectionsListProps {
  schoolYearId: string;
  programId:    string;
  isEnded:      boolean;
}

export function LevelWithSectionsList({
  schoolYearId,
  programId,
  isEnded,
}: LevelWithSectionsListProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [deleteTarget,   setDeleteTarget]   = useState<Level | null>(null);
  const [updatingId,     setUpdatingId]     = useState<string | null>(null);

  const { data: program } = useQuery({
    queryKey: ["admin", "program", programId],
    queryFn:  () => programApi.getOne(programId),
  });

  const { data: allLevels = [], isLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId),
  });

  const levels = allLevels.filter((l) => l.program_id === programId);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "levels", schoolYearId] });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.updateOne(id, name),
    onMutate:  ({ id }) => setUpdatingId(id),
    onSuccess: () => { toast.success("Level renamed."); invalidate(); },
    onError:   () => toast.error("Failed to rename level."),
    onSettled: () => setUpdatingId(null),
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) =>
      levelApi.bulkGenerate({ programId, schoolYearId, count }),
    onSuccess: () => { toast.success("Levels generated."); invalidate(); },
    onError:   () => toast.error("Failed to generate levels."),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      levelApi.create({ programId, name, schoolYearId }),
    onSuccess: () => { toast.success("Level added."); invalidate(); },
    onError:   () => toast.error("Failed to add level."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess: () => {
      toast.success("Level deleted.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete level."),
  });

  const toggleLevel = (id: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading || !program) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Levels</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {levels.length}
            </Badge>
          </div>
        </div>

        {/* ProgramGroup handles all level CRUD UI */}
        <ProgramGroup
          program={program}
          levels={levels}
          isEnded={isEnded}
          onUpdate={(id, name) => updateMutation.mutate({ id, name })}
          onDelete={(level) => setDeleteTarget(level)}
          onGenerate={(_pid, count) => generateMutation.mutate(count)}
          onAdd={() => createMutation.mutate(`Level ${levels.length + 1}`)}
          isUpdating={updateMutation.isPending}
          isGenerating={generateMutation.isPending}
          isAdding={createMutation.isPending}
          updatingId={updatingId}
        />

        {/* Sections expandable per level */}
        {levels.length > 0 && (
          <div className="border-t divide-y">
            {levels.map((level) => (
              <div key={level.id}>
                <button
                  onClick={() => toggleLevel(level.id)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${
                      expandedLevels.has(level.id) ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {level.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — sections
                  </span>
                </button>
                {expandedLevels.has(level.id) && (
                  <SectionsPanel
                    level={level}
                    schoolYearId={schoolYearId}
                    isEnded={isEnded}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this level?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone. Any classes or students linked to this level may be affected.`}
          confirmLabel="Delete Level"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}