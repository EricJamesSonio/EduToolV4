"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { levelApi } from "@/api/admin/level.api";
import { SectionsPanel } from "@/components/admin/school-years/SectionsPanel";
import { InlineEdit } from "@/components/admin/levels/InlineEdit";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { getCountConfig } from "@/components/admin/levels/get-count-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pickCardColor, cardGridClass } from "@/lib/utils";
import type { Level } from "@/types/admin/level.types";

interface ProgramLevelsSectionProps {
  programId: string;
  schoolYearId: string;
  programType: string;
  courseId?: string;
  strandId?: string;
}

export function ProgramLevelsSection({
  programId,
  schoolYearId,
  programType,
  courseId,
  strandId,
}: ProgramLevelsSectionProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const cfg = getCountConfig(programType);
  const [genCount, setGenCount] = useState(cfg.default);

  // Unique key based on scope
  const scopeKey = courseId ? `course-${courseId}` : strandId ? `strand-${strandId}` : `program-${programId}`;
  const queryKey = ["school-year-levels", schoolYearId, scopeKey];

  const { data: levels = [], isLoading } = useQuery<Level[]>({
    queryKey,
    queryFn: () => {
      if (courseId) return levelApi.getByCourse(schoolYearId, courseId);
      if (strandId) return levelApi.getByStrand(schoolYearId, strandId);
      return levelApi.getBySchoolYear(schoolYearId, programId);
    },
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (name: string) => levelApi.create({ programId, name, schoolYearId, courseId, strandId }),
    onSuccess: invalidate,
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) => levelApi.bulkGenerate({ programId, schoolYearId, count, courseId, strandId }),
    onSuccess: () => { setShowGenerate(false); invalidate(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => levelApi.updateOne(id, name),
    onMutate: ({ id }) => setUpdatingId(id),
    onSettled: () => setUpdatingId(null),
    onSuccess: () => { setEditingId(null); invalidate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess: () => { setDeleteTarget(null); invalidate(); },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base not-interactive">Levels</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {levels.length}
          </Badge>
        </div>
        {!showGenerate && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => createMutation.mutate(`Level ${levels.length + 1}`)}
              disabled={createMutation.isPending}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {createMutation.isPending ? "Adding…" : "Add Level"}
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => setShowGenerate(true)}
            >
              <Layers className="mr-1 h-3.5 w-3.5" />
              Generate Levels
            </Button>
          </div>
        )}
      </div>

      {/* Generate UI */}
      {showGenerate && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <span className="text-sm text-muted-foreground not-interactive">{cfg.label}:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGenCount((c) => Math.max(cfg.min, c - 1))}
                disabled={genCount <= cfg.min}
                className="h-7 w-7 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
              >−</button>
              <span className="w-6 text-center text-sm font-medium not-interactive">{genCount}</span>
              <button
                onClick={() => setGenCount((c) => Math.min(cfg.max, c + 1))}
                disabled={genCount >= cfg.max}
                className="h-7 w-7 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40"
              >+</button>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded w-fit not-interactive">
              {cfg.preview(genCount)}
            </span>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Button
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => generateMutation.mutate(genCount)}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "Generating..." : "Generate"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs px-3"
                onClick={() => setShowGenerate(false)}
                disabled={generateMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Level cards */}
      {levels.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground not-interactive">No levels yet.</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${cardGridClass(levels.length)}`}>
          {levels.map((level) => (
            <div key={level.id} className="rounded-xl border bg-card p-6 space-y-4">
              {editingId === level.id ? (
                <InlineEdit
                  value={level.name}
                  onSave={(name) => updateMutation.mutate({ id: level.id, name })}
                  onCancel={() => setEditingId(null)}
                  isLoading={updatingId === level.id && updateMutation.isPending}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <div className={`icon-container ${pickCardColor(level.id)} shrink-0 mt-0.5`}>
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg leading-tight truncate not-interactive">{level.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(level.id)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Rename level"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(level)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete level"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <SectionsPanel
                level={level}
                schoolYearId={schoolYearId}
                isEnded={false}
              />
            </div>
          ))}
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
