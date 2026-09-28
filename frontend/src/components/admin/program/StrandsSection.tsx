"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { useDeleteStrand } from "@/hooks/admin/useStrand";
import { StrandDialog } from "./StrandDialog";
import { ProgramUnitCard } from "./ProgramUnitCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CardGrid } from "@/components/shared/CardGrid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
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
          <Button size="sm" className="h-8 text-xs px-3" onClick={() => setDialog({ mode: "create" })}>
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
        <CardGrid count={strands.length}>
          {strands.map((strand) => (
            <ProgramUnitCard
              key={strand.id}
              name={strand.name}
              icon={Layers}
              iconClass="bg-[#DDD6FE] text-[#0B1E3A] border-[#C4B5FD]"
              levelCount={strand.levelCount ?? 0}
              sectionCount={strand.sectionCount ?? 0}
              isEnded={isEnded}
              onView={() => router.push(`/admin/programs/${program.id}/strands/${strand.id}`)}
              onEdit={() => setDialog({ mode: "edit", strand: { id: strand.id, name: strand.name } })}
              onDelete={() => setDeleteTarget(strand)}
            />
          ))}
        </CardGrid>
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