"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useDeleteStrand } from "@/hooks/admin/useStrand";
import { StrandDialog } from "./StrandDialog";
import { ProgramLevelsSection } from "./ProgramLevelsSection";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pickCardColor } from "@/lib/utils";
import type { StrandSnapshot, Program } from "@/types/admin/program.types";

interface StrandsSectionProps {
  program:      Program;
  schoolYearId: string;
  strands:      StrandSnapshot[];
  isEnded:      boolean;
}

export function StrandsSection({
  program,
  schoolYearId,
  strands,
  isEnded,
}: StrandsSectionProps): React.JSX.Element {
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit";
    strand?: { id: string; name: string };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StrandSnapshot | null>(null);

  const deleteMutation = useDeleteStrand();

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base not-interactive">Strands</h3>
          <Badge variant="secondary" className="text-xs font-normal">
            {strands.length}
          </Badge>
        </div>
        {!isEnded && (
          <Button
            size="sm"
            className="h-8 text-xs px-3"
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Strand
          </Button>
        )}
      </div>

      {strands.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground not-interactive">No strands yet.</p>
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
        <div className="space-y-6">
          {strands.map((strand) => (
            <div key={strand.id} className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`icon-container ${pickCardColor(strand.id)} shrink-0 mt-0.5`}>
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate not-interactive">{strand.name}</h3>
                </div>
                {!isEnded && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        setDialog({
                          mode: "edit",
                          strand: { id: strand.id, name: strand.name },
                        })
                      }
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit strand"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(strand)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete strand"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Levels scoped to this strand */}
              <div className="border-t pt-4">
                <ProgramLevelsSection
                  programId={program.id}
                  schoolYearId={schoolYearId}
                  programType={program.type}
                  strandId={strand.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

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
