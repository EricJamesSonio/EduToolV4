// filepath: app/admin/sections/page.tsx

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus } from "lucide-react";
import { useSections } from "@/hooks/admin/useSectionsHelper";
import { useEnrichedLevels } from "@/hooks/admin/useEnrichedLevels";
import { SectionDialog } from "@/components/admin/section/SectionDialog";
import { SectionTable } from "@/components/admin/section/SectionTable";
import { SectionLevelFilter } from "@/components/admin/section/SectionLevelFilter";
import { SectionEmptyState } from "@/components/admin/section/SectionEmptyState";
import type { Section } from "@/types/admin/section.types";

export default function SectionsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Section | null>(null);

  const {
    sections,
    isLoading: sectionsLoading,
    filterLevelId,
    setFilterLevelId,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  } = useSections();

  const {
    levels,
    grouped,
    levelMap,
    isLoading: levelsLoading,
  } = useEnrichedLevels();

  const isLoading = sectionsLoading || levelsLoading;

  function handleSaved(): void {
    queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Section
          </Button>
        }
      />

      <SectionLevelFilter
        filterLevelId={filterLevelId}
        onFilterChange={setFilterLevelId}
        grouped={grouped}
        levelMap={levelMap}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <SectionEmptyState
          isFiltered={filterLevelId !== "all"}
          onCreateClick={() => setCreateOpen(true)}
        />
      ) : (
        <SectionTable
          sections={sections}
          levelMap={levelMap}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {createOpen && (
        <SectionDialog
          levels={levels}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {editTarget && (
        <SectionDialog
          section={editTarget}
          levels={levels}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this section?"
          message={`Delete "${deleteTarget.name}"? Students enrolled in this section may be affected.`}
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