"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { sectionApi } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";
import type { Level }   from "@/types/admin/level.types";
import { ConfirmDialog }    from "@/components/shared/ConfirmDialog";
import { Skeleton }         from "@/components/ui/skeleton";
import { Badge }            from "@/components/ui/badge";
import { SectionFormDialog } from "./SectionFormDialog";
import type { SectionFormValues } from "./SectionFormDialog";

interface SectionsPanelProps {
  level:        Level;
  schoolYearId: string;
  isEnded:      boolean;
  courseId?:    string; // college
  strandId?:    string; // SHS
}

export function SectionsPanel({
  level,
  schoolYearId,
  isEnded,
  courseId,
  strandId,
}: SectionsPanelProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<Section | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

  // Query key scoped to course/strand if present
  const qKey = [
    "admin", "sections", schoolYearId, level.id,
    ...(courseId ? [courseId] : []),
    ...(strandId ? [strandId] : []),
  ];

  const { data: sections = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn:  () => sectionApi.getAll(schoolYearId, level.id),
  });

  const visibleSections = sections.filter((s) => {
    if (courseId) {
      const sc = s as Section & { course_id?: string | null };
      // show if explicitly matched OR if section has no course scoping (shared/seeded)
      return sc.course_id === courseId || sc.course_id == null;
    }
    if (strandId) {
      const ss = s as Section & { strand_id?: string | null };
      return ss.strand_id === strandId || ss.strand_id == null;
    }
    return true;
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const createMutation = useMutation({
    mutationFn: (vals: SectionFormValues) =>
      sectionApi.create({
        levelId:      level.id,
        schoolYearId,
        courseId:     courseId ?? undefined,
        strandId:     strandId ?? undefined,
        name:         vals.name,
        capacity:     Number(vals.capacity),
      }),
    onSuccess: () => {
      toast.success("Section created.");
      invalidate();
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to create section."),
  });

  const updateMutation = useMutation({
    mutationFn: (vals: SectionFormValues) =>
      sectionApi.update(editTarget!.id, {
        name:     vals.name,
        capacity: Number(vals.capacity),
      }),
    onSuccess: () => {
      toast.success("Section updated.");
      invalidate();
      setEditTarget(null);
    },
    onError: () => toast.error("Failed to update section."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sectionApi.delete(id),
    onSuccess: () => {
      toast.success("Section deleted.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete section."),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="border-t bg-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sections
          {visibleSections.length > 0 && (
            <span className="ml-1.5 font-normal normal-case">
              ({visibleSections.length})
            </span>
          )}
        </span>
        {!isEnded && (
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add section
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="px-6 pb-3 space-y-1.5">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-7 w-full rounded" />
          ))}
        </div>
      ) : visibleSections.length === 0 ? (
        <p className="px-6 pb-3 text-xs text-muted-foreground">No sections yet.</p>
      ) : (
        <div className="px-6 pb-3 space-y-1">
          {visibleSections.map((sec) => (
            <div
              key={sec.id}
              className="flex items-center justify-between gap-3 group rounded px-2 py-1.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium truncate">{sec.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  cap. {sec.capacity}
                </span>
                {sec.studentCount > 0 && (
                  <Badge variant="secondary" className="text-xs font-normal px-1.5 py-0">
                    {sec.studentCount}{" "}
                    {sec.studentCount === 1 ? "student" : "students"}
                  </Badge>
                )}
              </div>
              {!isEnded && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => setEditTarget(sec)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(sec)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {dialogOpen && (
        <SectionFormDialog
          mode="create"
          isLoading={isMutating}
          onClose={() => setDialogOpen(false)}
          onSubmit={(vals) => createMutation.mutate(vals)}
        />
      )}
      {editTarget && (
        <SectionFormDialog
          mode="edit"
          defaultValues={{
            name:     editTarget.name,
            capacity: String(editTarget.capacity),
          }}
          isLoading={isMutating}
          onClose={() => setEditTarget(null)}
          onSubmit={(vals) => updateMutation.mutate(vals)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this section?"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete Section"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}