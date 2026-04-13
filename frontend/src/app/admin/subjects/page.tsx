"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { Subject } from "@/types/admin/subject.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SubjectDialog } from "@/components/admin/subject/SubjectDialog";
import type { AxiosError } from "axios";
import type { SubjectType } from "@/types/admin/subject.types";

// Import modular components
import { SubjectFilters } from "@/components/admin/subject/SubjectFilters";
import { SubjectTabs } from "@/components/admin/subject/SubjectTabs";
import { SubjectSearch } from "@/components/admin/subject/SubjectSearch";
import { SubjectTable } from "@/components/admin/subject/SubjectTable";
import { SubjectEmptyState } from "@/components/admin/subject/SubjectEmptyState";
import { useSubjectFilters } from "@/components/admin/subject/hooks/useSubjectFilters";
import { useSubjectQueries } from "@/components/admin/subject/hooks/useSubjectQueries";
import { useSubjectMutations } from "@/components/admin/subject/hooks/useSubjectMutations";

export default function SubjectsPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  // ━━━━━ Filter State ━━━━━
  const filters = useSubjectFilters();

  // ━━━━━ Dialog State ━━━━━
  const [createOpen, setCreateOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<Subject | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ━━━━━ Queries ━━━━━
  const {
    schoolYears,
    syLoading,
    programs,
    programsLoading,
    levels,
    levelsLoading,
    courses,
    strands,
    educators,
    educatorsLoading,
    subjects,
    subjectsLoading,
  } = useSubjectQueries(filters);

  // ━━━━━ Mutations ━━━━━
  const { lockMutation, unlockMutation } = useSubjectMutations(
    queryClient,
    setLockTarget,
    setUnlockTarget
  );

  // ━━━━━ Derived State ━━━━━
  const isLoading =
    levelsLoading || educatorsLoading || subjectsLoading || programsLoading;

  // Filter subjects by search query
  const filteredSubjects = subjects.filter((subject) =>
    subject.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            disabled={!filters.selectedSchoolYearId}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {filters.activeTab === "minor" ? "New Minor Subject" : "New Subject"}
          </Button>
        }
      />

      {/* ━━━━━ Filters ━━━━━ */}
      <SubjectFilters
        filters={filters}
        schoolYears={schoolYears}
        programs={programs}
        courses={courses}
        strands={strands}
        syLoading={syLoading}
        programsLoading={programsLoading}
      />

      {/* ━━━━━ Tabs ━━━━━ */}
      <SubjectTabs filters={filters} />

      {/* ━━━━━ Search ━━━━━ */}
      {filters.selectedSchoolYearId && (
        <SubjectSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={filteredSubjects.length}
        />
      )}

      {/* ━━━━━ Empty State or Table ━━━━━ */}
      {filters.selectedSchoolYearId ? (
        <SubjectTable
          isLoading={isLoading}
          subjects={filteredSubjects}
          activeTab={filters.activeTab}
          filterLevelId={filters.filterLevelId}
          selectedCourseId={filters.selectedCourseId}
          selectedStrandId={filters.selectedStrandId}
          selectedProgramId={filters.selectedProgramId}
          onLockClick={setLockTarget}
          onUnlockClick={setUnlockTarget}
        />
      ) : (
        <SubjectEmptyState
          showNoSchoolYear
          onCreateClick={() => setCreateOpen(true)}
        />
      )}

      {/* ━━━━━ Dialogs ━━━━━ */}
      {createOpen && (
        <SubjectDialog
          levels={levels}
          educators={educators}
          schoolYearId={filters.selectedSchoolYearId ?? undefined}
          defaultSubjectType={filters.activeTab}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() =>
            queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] })
          }
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
          onOpenChange={(o) => {
            if (!o) setLockTarget(null);
          }}
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
          onOpenChange={(o) => {
            if (!o) setUnlockTarget(null);
          }}
        />
      )}
    </div>
  );
}

// Import ConfirmDialog at the end to avoid circular dependencies
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";