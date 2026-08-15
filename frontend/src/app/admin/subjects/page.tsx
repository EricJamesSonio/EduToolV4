"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner"; // kept for potential future use; harmless
import type { Subject } from "@/types/admin/subject.types";
import { PageHeader }   from "@/components/shared/PageHeader";
import { HelpGuide }    from "@/components/shared/help-guide/HelpGuide";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { Pagination }   from "@/components/shared/Pagination";
import { Button }       from "@/components/ui/button";
import { Plus }         from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SubjectDialog } from "@/components/admin/subject/SubjectDialog";
import { SubjectFilters }    from "@/components/admin/subject/SubjectFilters";
import { SubjectTabs }       from "@/components/admin/subject/SubjectTabs";
import { SubjectSearch }     from "@/components/admin/subject/SubjectSearch";
import { SubjectTable }      from "@/components/admin/subject/SubjectTable";
import { SubjectEmptyState } from "@/components/admin/subject/SubjectEmptyState";
import { useOrganizationGuard } from "@/context/OrganizationGuardContext";
import { useSubjectFilters } from "@/components/admin/subject/hooks/useSubjectFilters";
import { useSubjectQueries } from "@/components/admin/subject/hooks/useSubjectQueries";
import { useSubjectMutations } from "@/components/admin/subject/hooks/useSubjectMutations";
import { DEFAULT_PAGE_SIZE } from "@/api/admin/subject.api";
import { useSubjectPreset } from "@/hooks/admin/useSubjectPreset";
import { SubjectPresetButton } from "@/components/admin/subject/SubjectPresetButton";

export default function SubjectsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const filters = useSubjectFilters();
  const { ensureOrganization } = useOrganizationGuard();

  const [createOpen,    setCreateOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState<Subject | null>(null);
  const [lockTarget,    setLockTarget]    = useState<Subject | null>(null);
  const [unlockTarget,  setUnlockTarget]  = useState<Subject | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [page,          setPage]          = useState(1);
  const [limit,         setLimit]         = useState(DEFAULT_PAGE_SIZE);

  const {
    schoolYears, syLoading,
    programs, programsLoading,
    levels, levelsLoading,
    courses, strands,
    educatorsLoading,
    subjects, subjectsTotal, subjectsTotalPages, subjectsLoading,
  } = useSubjectQueries(filters, { search: searchQuery, page, limit });

  const { lockMutation, unlockMutation } = useSubjectMutations(
    setLockTarget,
    setUnlockTarget,
  );
  const { preset, savePreset, setEnabled, clearPreset } = useSubjectPreset(
    filters.selectedSchoolYearId,
  );

  // Only trust the preset if its department still exists in the currently
  // loaded programs for this school year — a program may have been deleted
  // since the preset was saved.
  const presetActive =
    !!preset?.enabled && programs.some((p) => p.id === preset.programId);


  const isLoading =
    levelsLoading || educatorsLoading || subjectsLoading || programsLoading;

  // Reset to page 1 whenever the school year changes
  useEffect(() => { setPage(1); }, [filters.selectedSchoolYearId]);

  // Clamp page when the result set shrinks (Educators/Students pattern)
  useEffect(() => {
    if (page > subjectsTotalPages) setPage(Math.max(1, subjectsTotalPages));
  }, [page, subjectsTotalPages]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_subjects" />
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={filters.selectedSchoolYearId}
              onSelect={filters.setSelectedSchoolYearId}
            />
          </div>
        }
      />

      {/* New Subject — own row, right-aligned (matches Sections/Programs pages) */}
      {filters.selectedSchoolYearId && (
        <div className="flex justify-end gap-2">
          <SubjectPresetButton
            schoolYearId={filters.selectedSchoolYearId}
            programs={programs}
            preset={preset}
            savePreset={savePreset}
            setEnabled={setEnabled}
            clearPreset={clearPreset}
          />
          <Button onClick={() => ensureOrganization(() => setCreateOpen(true))} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {filters.activeTab === "minor" ? "New Minor Subject" : "New Subject"}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <SubjectTabs
        filters={filters}
        onTabChange={(tab) => { filters.setActiveTab(tab); setPage(1); }}
      />

      {/* Search + Filters — one row (matches Sections page) */}
      {filters.selectedSchoolYearId && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <SubjectSearch
            searchQuery={searchQuery}
            onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
            resultCount={subjectsTotal}
          />
          <SubjectFilters
            {...filters}
            setSelectedProgramId={(v) => { filters.setSelectedProgramId(v); setPage(1); }}
            setFilterLevelId={(v) => { filters.setFilterLevelId(v); setPage(1); }}
            setSelectedCourseId={(v) => { filters.setSelectedCourseId(v); setPage(1); }}
            setSelectedStrandId={(v) => { filters.setSelectedStrandId(v); setPage(1); }}
            programs={programs}
            levels={levels}
            courses={courses}
            strands={strands}
            programsLoading={programsLoading}
            levelsLoading={levelsLoading}
          />
        </div>
      )}

      {/* Table or empty state */}
      {filters.selectedSchoolYearId ? (
        <SubjectTable
          isLoading={isLoading}
          subjects={subjects}
          activeTab={filters.activeTab}
          filterLevelId={filters.filterLevelId}
          selectedCourseId={filters.selectedCourseId}
          selectedStrandId={filters.selectedStrandId}
          selectedProgramId={filters.selectedProgramId}
          onEditClick={setEditTarget}
          onLockClick={setLockTarget}
          onUnlockClick={setUnlockTarget}
        />
      ) : (
        <SubjectEmptyState
          showNoSchoolYear
          onCreateClick={() => ensureOrganization(() => setCreateOpen(true))}
        />
      )}

      {filters.selectedSchoolYearId && (
        <Pagination
          page={page}
          limit={limit}
          total={subjectsTotal}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          pageSizeOptions={[20, 50, 100]}
        />
      )}

      {/* Dialogs */}
{createOpen && (
  <SubjectDialog
    levels={levels}
    schoolYearId={filters.selectedSchoolYearId ?? undefined}
    defaultSubjectType={filters.activeTab}
    defaultProgramId={
      presetActive
        ? preset!.programId
        : filters.selectedProgramId !== "all" ? filters.selectedProgramId : undefined
    }
    defaultCourseId={
      presetActive
        ? preset!.courseId ?? undefined
        : filters.selectedCourseId !== "all" ? filters.selectedCourseId : undefined
    }
    defaultStrandId={
      presetActive
        ? preset!.strandId ?? undefined
        : filters.selectedStrandId !== "all" ? filters.selectedStrandId : undefined
    }
    defaultLevelId={
      presetActive
        ? preset!.levelId ?? undefined
        : filters.filterLevelId !== "all" ? filters.filterLevelId : undefined
    }
    open={createOpen}
    onClose={() => setCreateOpen(false)}
    onSaved={() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.subjects.all });
    }}
  />
)}

      {editTarget && (
        <SubjectDialog
          subject={editTarget}
          levels={levels}
          schoolYearId={filters.selectedSchoolYearId ?? undefined}
          defaultSubjectType={editTarget.subjectType}
          open
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.subjects.all });
          }}
        />
      )}

      {lockTarget && (
        <ConfirmDialog
          open
          title="Lock this subject?"
          message={`Lock "${lockTarget.title}"? It will become read-only. You can unlock it between school years.`}
          confirmLabel="Lock Subject"
          destructive={false}
          isLoading={lockMutation.isPending}
          onConfirm={() => lockMutation.mutate(lockTarget.id)}
          onOpenChange={(o) => { if (!o) setLockTarget(null); }}
        />
      )}

      {unlockTarget && (
        <ConfirmDialog
          open
          title="Unlock this subject?"
          message={`Unlock "${unlockTarget.title}"? It will become editable again.`}
          confirmLabel="Unlock Subject"
          destructive={false}
          isLoading={unlockMutation.isPending}
          onConfirm={() => unlockMutation.mutate(unlockTarget.id)}
          onOpenChange={(o) => { if (!o) setUnlockTarget(null); }}
        />
      )}
    </div>
  );
}