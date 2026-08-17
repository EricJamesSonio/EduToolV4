"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { Pagination } from "@/components/shared/Pagination";

import { Plus, Search } from "lucide-react";

import { useSections } from "@/hooks/admin/useSectionsHelper";
import { useEnrichedLevels } from "@/hooks/admin/useEnrichedLevels";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";

import { SectionDialog } from "@/components/admin/section/SectionDialog";
import { SectionTable } from "@/components/admin/section/SectionTable";
import { SectionLevelFilter } from "@/components/admin/section/SectionLevelFilter";
import { SectionEmptyState } from "@/components/admin/section/SectionEmptyState";
import { SectionPresetButton } from "@/components/admin/section/SectionPresetButton";
import { useSectionPreset } from "@/hooks/admin/useSectionPreset";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { useOrganizationGuard } from "@/context/OrganizationGuardContext";

import { programApi } from "@/api/admin/program.api";
import { DEFAULT_PAGE_SIZE } from "@/api/admin/section.api";

import type { Section } from "@/types/admin/section.types";

export default function SectionsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { ensureOrganization } = useOrganizationGuard();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Section | null>(null);
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const { data: schoolYears = [], isLoading: syLoading } = useSchoolYears();

  useEffect(() => {
    if (schoolYears.length > 0 && !schoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSchoolYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, schoolYearId]);

  const {
    sections,
    total: sectionsTotal,
    totalPages: sectionsTotalPages,
    isLoading: sectionsLoading,
    isError: sectionsError,
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
  } = useSections(schoolYearId, { search, page, limit });

  const {
    levels,
    grouped,
    levelMap,
    isLoading: levelsLoading,
    isError: levelsError,
  } = useEnrichedLevels(schoolYearId);

  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );

  const { preset, savePreset, setEnabled, clearPreset } = useSectionPreset(schoolYearId);

  // Only trust the preset if its department still exists for this school year.
  const presetActive =
    !!preset?.enabled && programs.some((p) => p.id === preset.programId);

  const isLoading = sectionsLoading || levelsLoading;
  const isError = sectionsError || levelsError;

  // Reset to page 1 whenever the school year changes
  useEffect(() => { setPage(1); }, [schoolYearId]);

  // Clamp page when the result set shrinks (Educators/Students pattern)
  useEffect(() => {
    if (page > sectionsTotalPages) setPage(Math.max(1, sectionsTotalPages));
  }, [page, sectionsTotalPages]);

  // 🔥 FIXED: full invalidation set
  function handleSaved(): void {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.sections.all });
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
                setPage(1);
              }}
            />
          </div>
        }
      />

      {schoolYearId && (
        <div className="flex items-center justify-end gap-2">
          <SectionPresetButton
            schoolYearId={schoolYearId}
            programs={programs}
            preset={preset}
            savePreset={savePreset}
            setEnabled={setEnabled}
            clearPreset={clearPreset}
          />
          <Button onClick={() => ensureOrganization(() => setCreateOpen(true))} size="sm">
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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
              setPage(1);
            }}
            filterCourseId={filterCourseId}
            onCourseChange={(id) => { setFilterCourseId(id); setPage(1); }}
            filterStrandId={filterStrandId}
            onStrandChange={(id) => { setFilterStrandId(id); setPage(1); }}
            filterLevelId={filterLevelId}
            onLevelChange={(id) => { setFilterLevelId(id); setPage(1); }}
            grouped={grouped}
            levelMap={levelMap}
          />
        </div>
      )}

{!schoolYearId && !syLoading ? (
        <SectionEmptyState
          noSchoolYear
          isFiltered={false}
          onCreateClick={() => ensureOrganization(() => setCreateOpen(true))}
        />
      ) : (
        <AsyncListState
          isLoading={isLoading}
          isError={isError}
          isEmpty={sections.length === 0}
          empty={
            <SectionEmptyState
              isFiltered={
                filterProgramId !== "all" ||
                filterCourseId  !== "all" ||
                filterStrandId  !== "all" ||
                filterLevelId   !== "all" ||
                search !== ""
              }
              onCreateClick={() => ensureOrganization(() => setCreateOpen(true))}
            />
          }
          loading={
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          }
        >
          <>
            <SectionTable
              sections={sections}
              levelMap={levelMap}
              programs={programs}
              onView={(section) =>
                router.push(`/admin/sections/${section.id}?schoolYearId=${schoolYearId}`)
              }
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
            <Pagination
              page={page}
              limit={limit}
              total={sectionsTotal}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
              pageSizeOptions={[20, 50, 100]}
            />
          </>
        </AsyncListState>
      )}

      {createOpen && schoolYearId && (
        <SectionDialog
          levels={levels}
          programs={programs}
          schoolYearId={schoolYearId}
          defaultProgramId={
            presetActive
              ? preset!.programId
              : filterProgramId !== "all" ? filterProgramId : undefined
          }
          defaultCourseId={
            presetActive
              ? preset!.courseId ?? undefined
              : filterCourseId !== "all" ? filterCourseId : undefined
          }
          defaultStrandId={
            presetActive
              ? preset!.strandId ?? undefined
              : filterStrandId !== "all" ? filterStrandId : undefined
          }
          defaultLevelId={
            presetActive
              ? preset!.levelId ?? undefined
              : filterLevelId !== "all" ? filterLevelId : undefined
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
            setPage(1);
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
