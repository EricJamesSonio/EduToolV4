// frontend/src/app/admin/sections/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // ✅ added useQuery
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Plus } from "lucide-react";
import { useSections } from "@/hooks/admin/useSectionsHelper";
import { useEnrichedLevels } from "@/hooks/admin/useEnrichedLevels";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { programApi } from "@/api/admin/program.api"; // ✅ added
import { SectionDialog } from "@/components/admin/section/SectionDialog";
import { SectionTable } from "@/components/admin/section/SectionTable";
import { SectionLevelFilter } from "@/components/admin/section/SectionLevelFilter";
import { SectionEmptyState } from "@/components/admin/section/SectionEmptyState";
import { SchoolYearSelector } from "@/components/admin/program/SchoolYearSelector";
import type { Section } from "@/types/admin/section.types";

export default function SectionsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Section | null>(null);
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);

  // fetch school years and auto-select active one
  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  useEffect(() => {
    if (schoolYears.length > 0 && !schoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSchoolYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, schoolYearId]);

  const {
    sections,
    isLoading: sectionsLoading,
    filterLevelId,
    setFilterLevelId,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  } = useSections(schoolYearId);

  const { levels, grouped, levelMap, isLoading: levelsLoading } =
    useEnrichedLevels(schoolYearId);

  // ✅ PROGRAMS QUERY (FIX)
  const { data: programs = [] } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn: () => programApi.getAll(schoolYearId!),
    enabled: !!schoolYearId,
  });

  const isLoading = sectionsLoading || levelsLoading;

  function handleSaved(): void {
    queryClient.invalidateQueries({
      queryKey: ["admin", "sections", schoolYearId],
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            disabled={!schoolYearId}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Section
          </Button>
        }
      />

      {/* School Year Selector */}
      <SchoolYearSelector
        schoolYears={schoolYears}
        isLoading={syLoading}
        selectedId={schoolYearId}
        onSelect={(id) => {
          setSchoolYearId(id);
          setFilterLevelId("all");
        }}
      />

      {/* Level filter */}
      {schoolYearId && !isLoading && (
        <SectionLevelFilter
          filterLevelId={filterLevelId}
          onFilterChange={setFilterLevelId}
          grouped={grouped}
          levelMap={levelMap}
        />
      )}

      {/* Content */}
      {!schoolYearId && !syLoading ? (
        <SectionEmptyState
          noSchoolYear
          isFiltered={false}
          onCreateClick={() => setCreateOpen(true)}
        />
      ) : isLoading ? (
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

      {/* Create Dialog */}
      {createOpen && schoolYearId && (
        <SectionDialog
          levels={levels}
          programs={programs} // ✅ now defined
          schoolYearId={schoolYearId}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <SectionDialog
          section={editTarget}
          levels={levels}
          programs={programs} // ✅ now defined
          schoolYearId={schoolYearId!}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete this section?"
          message={`Delete "${deleteTarget.name}"? Students enrolled in this section may be affected.`}
          confirmLabel="Delete Section"
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