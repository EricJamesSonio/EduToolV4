"use client";

import { useState } from "react";
import {
  Plus, Pencil, Trash2, Layers, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeleteStrand } from "@/hooks/admin/useStrand";
import { levelApi } from "@/api/admin/level.api";
import { StrandDialog } from "./StrandDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SectionsPanel } from "@/components/admin/school-years/SectionsPanel";
import { InlineEdit } from "@/components/admin/levels/InlineEdit";
import { getCountConfig } from "@/components/admin/levels/get-count-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StrandSnapshot, Program } from "@/types/admin/program.types";
import type { Level } from "@/types/admin/level.types";
import { cn } from "@/lib/utils";

interface StrandsSectionProps {
  program:      Program;
  schoolYearId: string;
  strands:      StrandSnapshot[];
  isEnded:      boolean;
}

// ── Inline level + section CRUD rendered inside an expanded strand row ─────────

interface StrandLevelCrudProps {
  programId:    string;
  programType:  string;
  schoolYearId: string;
  isEnded:      boolean;
  strandId:     string;
  allLevels:    Level[];
  onInvalidate: () => void;
}

function StrandLevelCrud({
  programId,
  programType,
  schoolYearId,
  isEnded,
  strandId,
  allLevels,
  onInvalidate,
}: StrandLevelCrudProps): React.JSX.Element {
  const [expandedIds,  setExpandedIds]  = useState<Set<string>>(new Set());
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [updatingId,   setUpdatingId]   = useState<string | null>(null);

  const cfg = getCountConfig(programType);
  const [genCount, setGenCount] = useState(cfg.default);

  const levels = allLevels.filter((l) => l.program_id === programId);

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.updateOne(id, name),
    onMutate:  ({ id }) => setUpdatingId(id),
    onSuccess: () => { toast.success("Level renamed."); onInvalidate(); },
    onError:   () => toast.error("Failed to rename level."),
    onSettled: () => setUpdatingId(null),
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) =>
      levelApi.bulkGenerate({ programId, schoolYearId, count }),
    onSuccess: () => {
      toast.success("Levels generated.");
      setShowGenerate(false);
      onInvalidate();
    },
    onError: () => toast.error("Failed to generate levels."),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      levelApi.create({
        programId,
        name: `Level ${levels.length + 1}`,
        schoolYearId,
      }),
    onSuccess: () => { toast.success("Level added."); onInvalidate(); },
    onError:   () => toast.error("Failed to add level."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess: () => {
      toast.success("Level deleted.");
      onInvalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete level."),
  });

  const toggleLevel = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div className="border-t bg-muted/5">
      {/* Level rows */}
      {levels.map((level) => (
        <div key={level.id} className="border-b last:border-b-0">
          <div className="flex items-center gap-2 pl-6 pr-4 py-2 hover:bg-muted/20 transition-colors group">
            {editingId === level.id ? (
              <div className="flex-1">
                <InlineEdit
                  value={level.name}
                  onSave={(name) => {
                    updateMutation.mutate({ id: level.id, name });
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  isLoading={updatingId === level.id && updateMutation.isPending}
                />
              </div>
            ) : (
              <>
                <button
                  onClick={() => toggleLevel(level.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                      expandedIds.has(level.id) && "rotate-90",
                    )}
                  />
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {level.name}
                  </span>
                  <span className="text-xs text-muted-foreground">— sections</span>
                </button>

                {!isEnded && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditingId(level.id)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(level)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {expandedIds.has(level.id) && (
            <SectionsPanel
              level={level}
              schoolYearId={schoolYearId}
              isEnded={isEnded}
              strandId={strandId}
            />
          )}
        </div>
      ))}

      {/* Generate row */}
      {!isEnded && showGenerate && (
        <div className="flex items-center gap-3 px-6 py-3 bg-muted/30 border-t flex-wrap">
          <span className="text-sm text-muted-foreground">{cfg.label}:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGenCount((c) => Math.max(cfg.min, c - 1))}
              disabled={genCount <= cfg.min}
              className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
            >−</button>
            <span className="w-6 text-center text-sm font-medium">{genCount}</span>
            <button
              onClick={() => setGenCount((c) => Math.min(cfg.max, c + 1))}
              disabled={genCount >= cfg.max}
              className="h-6 w-6 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
            >+</button>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {cfg.preview(genCount)}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => generateMutation.mutate(genCount)}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-3"
              onClick={() => setShowGenerate(false)}
              disabled={generateMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action bar */}
      {!isEnded && !showGenerate && (
        <div className="px-6 py-2 flex items-center gap-4 border-t">
          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {createMutation.isPending ? "Adding…" : "Add level"}
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Generate levels
          </button>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this level?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete Level"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

// ── StrandsSection ────────────────────────────────────────────────────────────

export function StrandsSection({
  program,
  schoolYearId,
  strands,
  isEnded,
}: StrandsSectionProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [expandedStrandIds, setExpandedStrandIds] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit";
    strand?: { id: string; name: string };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StrandSnapshot | null>(null);

  const deleteMutation = useDeleteStrand();

  const { data: allLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn:  () => levelApi.getBySchoolYear(schoolYearId),
  });

  const invalidateLevels = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "levels", schoolYearId] });

  const toggleStrand = (strandId: string) =>
    setExpandedStrandIds((prev) => {
      const next = new Set(prev);
      if (next.has(strandId)) next.delete(strandId); else next.add(strandId);
      return next;
    });

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Strand deleted."); setDeleteTarget(null); },
      onError: (err) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message ?? "Failed to delete strand.");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Strands</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {strands.length}
            </Badge>
          </div>
          {!isEnded && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-3"
              onClick={() => setDialog({ mode: "create" })}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Strand
            </Button>
          )}
        </div>

        {levelsLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : strands.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No strands yet.</p>
            {!isEnded && (
              <button
                onClick={() => setDialog({ mode: "create" })}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Add the first strand
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {strands.map((strand) => {
              const isExpanded = expandedStrandIds.has(strand.id);
              return (
                <div key={strand.id}>
                  {/* Strand row */}
                  <div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 group hover:bg-muted/20 transition-colors",
                      isExpanded && "bg-muted/20",
                    )}
                  >
                    <button
                      onClick={() => toggleStrand(strand.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                          isExpanded && "rotate-90",
                        )}
                      />
                      <span className="text-sm font-medium truncate">{strand.name}</span>
                    </button>

                    {!isEnded && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() =>
                            setDialog({
                              mode: "edit",
                              strand: { id: strand.id, name: strand.name },
                            })
                          }
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(strand)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded: inline levels + sections */}
                  {isExpanded && (
                    <StrandLevelCrud
                      programId={program.id}
                      programType={program.type}
                      schoolYearId={schoolYearId}
                      isEnded={isEnded}
                      strandId={strand.id}
                      allLevels={allLevels}
                      onInvalidate={invalidateLevels}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dialog && (
        <StrandDialog
          programId={program.id}
          schoolYearId={schoolYearId}
          strand={dialog.strand}
          open
          onClose={() => setDialog(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this strand?"
          message={`Delete "${deleteTarget.name}"? Any subjects linked to this strand may be affected.`}
          confirmLabel="Delete Strand"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}