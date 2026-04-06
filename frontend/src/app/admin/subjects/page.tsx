"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import { levelApi } from "@/api/admin/level.api";
import { educatorApi } from "@/api/admin/educator.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { Subject } from "@/types/admin/subject.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen } from "lucide-react";
import { SubjectDialog } from "@/components/admin/subject/SubjectDialog";
import { useSubjectColumns } from "@/components/admin/subject/SubjectColumns";
import type { AxiosError } from "axios";
import type { SubjectType } from "@/types/admin/subject.types";

export default function SubjectsPage(): React.JSX.Element {
  const queryClient = useQueryClient();

  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
  });

  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (schoolYears.length > 0 && !selectedSchoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedSchoolYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears, selectedSchoolYearId]);

  // Tab: "major" | "minor"
  const [activeTab, setActiveTab] = useState<SubjectType>("major");

  const [filterLevelId, setFilterLevelId] = useState<string>("all");

  // Reset level filter when school year or tab changes
  useEffect(() => {
    setFilterLevelId("all");
  }, [selectedSchoolYearId, activeTab]);

  const [createOpen, setCreateOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<Subject | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<Subject | null>(null);

  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", selectedSchoolYearId],
    queryFn: () => levelApi.getBySchoolYear(selectedSchoolYearId!),
    enabled: !!selectedSchoolYearId,
  });

  const { data: educators = [], isLoading: educatorsLoading } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<
    Subject[]
  >({
    queryKey: [
      "admin",
      "subjects",
      selectedSchoolYearId,
      filterLevelId,
      activeTab,
    ],
    queryFn: () =>
      subjectApi.getAll({
        schoolYearId: selectedSchoolYearId!,
        levelId: filterLevelId !== "all" ? filterLevelId : undefined,
        subjectType: activeTab,
      }),
    enabled: !!selectedSchoolYearId,
  });

  const lockMutation = useMutation({
    mutationFn: (id: string) => subjectApi.lock(id),
    onSuccess: () => {
      toast.success("Subject locked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setLockTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to lock subject.");
      setLockTarget(null);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => subjectApi.unlock(id),
    onSuccess: () => {
      toast.success("Subject unlocked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setUnlockTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to unlock subject.",
      );
      setUnlockTarget(null);
    },
  });

  const columns = useSubjectColumns(setLockTarget, setUnlockTarget);
  const isLoading = levelsLoading || educatorsLoading || subjectsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            disabled={!selectedSchoolYearId}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {activeTab === "minor" ? "New Minor Subject" : "New Subject"}
          </Button>
        }
      />

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <SchoolYearSelector
          schoolYears={schoolYears}
          isLoading={syLoading}
          selectedId={selectedSchoolYearId}
          onSelect={setSelectedSchoolYearId}
        />

        {selectedSchoolYearId && (
          <Select
            value={filterLevelId}
            onValueChange={(v) => setFilterLevelId(v ?? "all")}
          >
            <SelectTrigger className="w-52 h-9 text-sm">
              <SelectValue placeholder="All Levels">
                {filterLevelId === "all"
                  ? "All Levels"
                  : levels.find((l) => l.id === filterLevelId)?.name ??
                    "All Levels"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Major / Minor tabs ── */}
      {selectedSchoolYearId && (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SubjectType)}
        >
          <TabsList className="h-9">
            <TabsTrigger value="major" className="text-sm px-4">
              Major Subjects
            </TabsTrigger>
            <TabsTrigger value="minor" className="text-sm px-4">
              Minor Subjects
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* ── No school year ── */}
      {!selectedSchoolYearId && !syLoading && (
        <EmptyState
          icon={BookOpen}
          title="No school year selected"
          description="Select a school year above to view subjects."
        />
      )}

      {/* ── Table ── */}
      {selectedSchoolYearId && (
        <>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={`No ${activeTab} subjects found`}
              description={
                filterLevelId !== "all"
                  ? `No ${activeTab} subjects for this level yet.`
                  : `No ${activeTab} subjects found for this school year.`
              }
              action={{
                label:
                  activeTab === "minor"
                    ? "New Minor Subject"
                    : "New Subject",
                onClick: () => setCreateOpen(true),
              }}
            />
          ) : (
            <>
              {/* Minor tab: show sharing badges above the table */}
              {activeTab === "minor" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Minor subjects can be shared to courses, strands, or levels within their program.</span>
                </div>
              )}
              <DataTable columns={columns} data={subjects} />
            </>
          )}
        </>
      )}

      {/* ── Dialogs ── */}
      {createOpen && (
        <SubjectDialog
          levels={levels}
          educators={educators}
          schoolYearId={selectedSchoolYearId ?? undefined}
          // Pre-set subjectType based on active tab
          defaultSubjectType={activeTab}
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