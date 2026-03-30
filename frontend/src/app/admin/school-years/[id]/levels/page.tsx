"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { levelApi } from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Layers,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level } from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";

// ─── Inline Edit ──────────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  onCancel,
  isLoading,
}: {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}): React.JSX.Element {
  const [draft, setDraft] = useState(value);

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-7 text-sm max-w-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) onSave(draft.trim());
          if (e.key === "Escape") onCancel();
        }}
      />
      <button
        onClick={() => draft.trim() && onSave(draft.trim())}
        disabled={isLoading || !draft.trim()}
        className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 disabled:opacity-40 transition-colors"
        title="Save"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={onCancel}
        disabled={isLoading}
        className="p-1 rounded text-muted-foreground hover:bg-muted transition-colors"
        title="Cancel"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Add Level Row ─────────────────────────────────────────────────────────────

function AddLevelRow({
  onSave,
  onCancel,
  isLoading,
}: {
  onSave: (name: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}): React.JSX.Element {
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-t">
      <div className="w-3 shrink-0" />
      <Input
        placeholder="Level name (e.g. Grade 1, Year 1)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-7 text-sm max-w-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSave(name.trim());
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button
        size="sm"
        className="h-7 text-xs px-3"
        onClick={() => name.trim() && onSave(name.trim())}
        disabled={isLoading || !name.trim()}
      >
        {isLoading ? "Adding..." : "Add"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs px-3"
        onClick={onCancel}
        disabled={isLoading}
      >
        Cancel
      </Button>
    </div>
  );
}

// ─── Program Group ─────────────────────────────────────────────────────────────

function ProgramGroup({
  program,
  levels,
  isEnded,
  onUpdate,
  onDelete,
  onAdd,
  isUpdating,
  isAdding,
  updatingId,
}: {
  program: Program;
  levels: Level[];
  isEnded: boolean;
  onUpdate: (id: string, name: string) => void;
  onDelete: (level: Level) => void;
  onAdd: (programId: string, name: string) => void;
  isUpdating: boolean;
  isAdding: boolean;
  updatingId: string | null;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingLevel, setAddingLevel] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Program header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm">{program.name}</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {levels.length} {levels.length === 1 ? "level" : "levels"}
          </Badge>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Levels */}
      {expanded && (
        <div className="border-t divide-y">
          {/* Empty state */}
          {levels.length === 0 && !addingLevel && (
            <div className="px-4 py-8 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No levels yet for this program.
              </p>
              {!isEnded && (
                <button
                  onClick={() => setAddingLevel(true)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Add the first level
                </button>
              )}
            </div>
          )}

          {/* Level rows */}
          {levels.map((level) => (
            <div
              key={level.id}
              className="flex items-center gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors"
            >
              {/* Tree indent line */}
              <div className="w-3 shrink-0 flex justify-center">
                <div className="w-px h-4 bg-border" />
              </div>

              {editingId === level.id ? (
                <InlineEdit
                  value={level.name}
                  onSave={(name) => {
                    onUpdate(level.id, name);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  isLoading={isUpdating && updatingId === level.id}
                />
              ) : (
                <>
                  <span className="text-sm flex-1 min-w-0 truncate">
                    {level.name}
                  </span>
                  {!isEnded && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(level.id)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename level"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(level)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete level"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Add level inline row */}
          {!isEnded && addingLevel && (
            <AddLevelRow
              onSave={(name) => {
                onAdd(program.id, name);
                setAddingLevel(false);
              }}
              onCancel={() => setAddingLevel(false)}
              isLoading={isAdding}
            />
          )}

          {/* Add level button (when levels exist) */}
          {!isEnded && !addingLevel && levels.length > 0 && (
            <div className="px-4 py-2.5">
              <button
                onClick={() => setAddingLevel(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add level
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolYearLevelsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Level | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: schoolYear, isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years", id],
    queryFn: () => schoolYearApi.getById(id),
  });

  const { data: levels, isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", id],
    queryFn: () => levelApi.getBySchoolYear(id),
  });

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["admin", "programs"],
    queryFn: programApi.getAll,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "levels", id] });

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

  const addMutation = useMutation({
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

  // Group levels by program_id
  const levelsByProgram = (levels ?? []).reduce<Record<string, Level[]>>(
    (acc, level) => {
      if (!acc[level.program_id]) acc[level.program_id] = [];
      acc[level.program_id].push(level);
      return acc;
    },
    {}
  );

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
            <h1 className="text-2xl font-semibold">Levels</h1>
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
          This school year has ended. Levels are read-only.
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
            No programs found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Set up programs before managing levels.
          </p>
          <Link
            href="/admin/programs"
            className="mt-3 inline-block text-xs text-primary hover:underline"
          >
            Go to Programs →
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
              onAdd={(programId, name) =>
                addMutation.mutate({ programId, name })
              }
              isUpdating={updateMutation.isPending}
              isAdding={addMutation.isPending}
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