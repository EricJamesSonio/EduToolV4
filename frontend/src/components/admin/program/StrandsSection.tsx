"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useDeleteStrand } from "@/hooks/admin/useStrand";
import { StrandDialog } from "./StrandDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StrandSnapshot } from "@/types/admin/program.types";

interface StrandsSectionProps {
  programId:    string;
  schoolYearId: string;
  strands:      StrandSnapshot[];
}

export function StrandsSection({
  programId,
  schoolYearId,
  strands,
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
      onSuccess: () => {
        toast.success("Strand deleted.");
        setDeleteTarget(null);
      },
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
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Strands</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {strands.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-3"
            onClick={() => setDialog({ mode: "create" })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Strand
          </Button>
        </div>

        {strands.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No strands yet.</p>
            <button
              onClick={() => setDialog({ mode: "create" })}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Add the first strand
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {strands.map((strand) => (
              <div
                key={strand.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm truncate">{strand.name}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() =>
                      setDialog({ mode: "edit", strand: { id: strand.id, name: strand.name } })
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
              </div>
            ))}
          </div>
        )}
      </div>

      {dialog && (
        <StrandDialog
          programId={programId}
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