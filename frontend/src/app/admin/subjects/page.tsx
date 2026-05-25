"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // kept for potential future use; harmless
import type { Subject } from "@/types/admin/subject.types";
import { PageHeader }   from "@/components/shared/PageHeader";
import { HelpGuide }    from "@/components/shared/help-guide/HelpGuide";
import { Button }       from "@/components/ui/button";
import { Plus }         from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SubjectDialog } from "@/components/admin/subject/SubjectDialog";
import { SubjectFilters }    from "@/components/admin/subject/SubjectFilters";
import { SubjectTabs }       from "@/components/admin/subject/SubjectTabs";
import { SubjectSearch }     from "@/components/admin/subject/SubjectSearch";
import { SubjectTable }      from "@/components/admin/subject/SubjectTable";
import { SubjectEmptyState } from "@/components/admin/subject/SubjectEmptyState";
import { useSubjectFilters } from "@/components/admin/subject/hooks/useSubjectFilters";
import { useSubjectQueries } from "@/components/admin/subject/hooks/useSubjectQueries";
import { useSubjectMutations } from "@/components/admin/subject/hooks/useSubjectMutations";

export default function SubjectsPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const filters = useSubjectFilters();

  const [createOpen,    setCreateOpen]    = useState(false);
  const [lockTarget,    setLockTarget]    = useState<Subject | null>(null);
  const [unlockTarget,  setUnlockTarget]  = useState<Subject | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");

  const {
    schoolYears, syLoading,
    programs, programsLoading,
    levels, levelsLoading,
    courses, strands,
    educators, educatorsLoading,
    subjects, subjectsLoading,
  } = useSubjectQueries(filters);

  const { lockMutation, unlockMutation } = useSubjectMutations(
    queryClient,
    setLockTarget,
    setUnlockTarget,
  );

  const isLoading =
    levelsLoading || educatorsLoading || subjectsLoading || programsLoading;

  const filteredSubjects = subjects.filter((subject) =>
    subject.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_subjects" />
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              disabled={!filters.selectedSchoolYearId}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {filters.activeTab === "minor" ? "New Minor Subject" : "New Subject"}
            </Button>
          </div>
        }
      />

      {/* Filters — spread so each setter is passed as an individual prop */}
      <SubjectFilters
        {...filters}
        schoolYears={schoolYears}
        programs={programs}
        levels={levels}
        courses={courses}
        strands={strands}
        syLoading={syLoading}
        programsLoading={programsLoading}
        levelsLoading={levelsLoading}
      />

      {/* Tabs — pass setActiveTab so clicking Minor/Major actually works */}
      <SubjectTabs
        filters={filters}
        onTabChange={filters.setActiveTab}
      />

      {/* Search */}
      {filters.selectedSchoolYearId && (
        <SubjectSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={filteredSubjects.length}
        />
      )}

      {/* Table or empty state */}
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

      {/* Dialogs */}
{createOpen && (
  <SubjectDialog
    levels={levels}
    educators={educators}
    schoolYearId={filters.selectedSchoolYearId ?? undefined}
    defaultSubjectType={filters.activeTab}
    defaultProgramId={filters.selectedProgramId !== "all" ? filters.selectedProgramId : undefined}
    defaultCourseId={filters.selectedCourseId  !== "all" ? filters.selectedCourseId  : undefined}
    defaultStrandId={filters.selectedStrandId  !== "all" ? filters.selectedStrandId  : undefined}
    defaultLevelId={filters.filterLevelId      !== "all" ? filters.filterLevelId     : undefined}
    open={createOpen}
    onClose={() => setCreateOpen(false)}
    onSaved={() => {
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
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