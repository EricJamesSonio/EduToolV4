"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { Plus, Search } from "lucide-react";

import { useSections } from "@/hooks/admin/useSectionsHelper";
import { useEnrichedLevels } from "@/hooks/admin/useEnrichedLevels";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";

import { SectionDialog } from "@/components/admin/section/SectionDialog";
import { SectionTable } from "@/components/admin/section/SectionTable";
import { SectionLevelFilter } from "@/components/admin/section/SectionLevelFilter";
import { SectionEmptyState } from "@/components/admin/section/SectionEmptyState";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";

import { programApi } from "@/api/admin/program.api";

import type { Section } from "@/types/admin/section.types";

export default function SectionsPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Section | null>(null);
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
    filterProgramId,
    setFilterProgramId,
    filterCourseId,
    setFilterCourseId,
    filterStrandId,
    setFilterStrandId,
    filterLevelId,
    setFilterLevelId,
    deleteTarget,
    setDeleteTarget,
    deleteMutation,
  } = useSections(schoolYearId);

  const {
    levels,
    grouped,
    levelMap,
    isLoading: levelsLoading,
  } = useEnrichedLevels(schoolYearId);

  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  const isLoading = sectionsLoading || levelsLoading;

  const filteredSections = sections.filter((s) => {
    const matchesSearch = s.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesProgram =
      filterProgramId === "all" ||
      levelMap[s.level_id]?.programId === filterProgramId;

    return matchesSearch && matchesProgram;
  });

  // 🔥 FIXED: full invalidation set
  function handleSaved(): void {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.sections.list({ schoolYearId }) });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.levels.list({ schoolYearId }) });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.programs.list({ schoolYearId }) });

    queryClient.invalidateQueries({ queryKey: queryKeys.admin.enrichedLevels.list({ schoolYearId }) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_sections" />
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={schoolYearId}
              onSelect={(id) => {
                setSchoolYearId(id);
                setFilterProgramId("all");
                setFilterCourseId("all");
                setFilterStrandId("all");
                setFilterLevelId("all");
                setSearch("");
              }}
            />
          </div>
        }
      />

      {schoolYearId && (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Section
          </Button>
        </div>
      )}

      {schoolYearId && !isLoading && (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-56 h-9"
            />
          </div>

          <SectionLevelFilter
            schoolYearId={schoolYearId}
            programs={programs}
            filterProgramId={filterProgramId}
            onProgramChange={(id) => {
              setFilterProgramId(id);
              setSearch("");
            }}
            filterCourseId={filterCourseId}
            onCourseChange={setFilterCourseId}
            filterStrandId={filterStrandId}
            onStrandChange={setFilterStrandId}
            filterLevelId={filterLevelId}
            onLevelChange={setFilterLevelId}
            grouped={grouped}
            levelMap={levelMap}
          />
        </div>
      )}

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
      ) : filteredSections.length === 0 ? (
        <SectionEmptyState
          isFiltered={filterLevelId !== "all" || search !== ""}
          onCreateClick={() => setCreateOpen(true)}
        />
      ) : (
        <SectionTable
          sections={filteredSections}
          levelMap={levelMap}
          programs={programs}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {createOpen && schoolYearId && (
        <SectionDialog
          levels={levels}
          programs={programs}
          schoolYearId={schoolYearId}
          defaultProgramId={
            filterProgramId !== "all" ? filterProgramId : undefined
          }
          defaultCourseId={
            filterCourseId !== "all" ? filterCourseId : undefined
          }
          defaultStrandId={
            filterStrandId !== "all" ? filterStrandId : undefined
          }
          defaultLevelId={
            filterLevelId !== "all" ? filterLevelId : undefined
          }
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            handleSaved();

            // 🔥 FULL RESET
            setFilterLevelId("all");
            setFilterCourseId("all");
            setFilterStrandId("all");
            setSearch("");
          }}
        />
      )}

      {editTarget && (
        <SectionDialog
          section={editTarget}
          levels={levels}
          programs={programs}
          schoolYearId={schoolYearId!}
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
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}