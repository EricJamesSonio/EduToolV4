"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import { programApi } from "@/api/admin/program.api";
import { levelApi } from "@/api/admin/level.api";
import { courseApi } from "@/api/admin/course.api";
import { strandApi } from "@/api/admin/strand.api";
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

  // ━━━━━ School Year Selection ━━━━━
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

  // ━━━━━ Tab & Filter State ━━━━━
  const [activeTab, setActiveTab] = useState<SubjectType>("major");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("all");
  const [filterLevelId, setFilterLevelId] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedStrandId, setSelectedStrandId] = useState<string>("all");

  // Reset filters when school year or tab changes
  useEffect(() => {
    setSelectedProgramId("all");
    setFilterLevelId("all");
    setSelectedCourseId("all");
    setSelectedStrandId("all");
  }, [selectedSchoolYearId, activeTab]);

  // Reset level when course/strand changes
  useEffect(() => {
    setFilterLevelId("all");
  }, [selectedCourseId, selectedStrandId]);

  // ━━━━━ Dialog State ━━━━━
  const [createOpen, setCreateOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<Subject | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<Subject | null>(null);

  // ━━━━━ Queries ━━━━━

  // Programs for selected school year
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["admin", "programs", selectedSchoolYearId],
    queryFn: () =>
      programApi.findAll({ schoolYearId: selectedSchoolYearId! }),
    enabled: !!selectedSchoolYearId,
  });

  // Levels - smart filtering based on what's selected
  // If course is selected → fetch levels for that course
  // If strand is selected → fetch levels for that strand
  // Otherwise → fetch levels for school year
  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: [
      "admin",
      "levels",
      selectedSchoolYearId,
      selectedCourseId,
      selectedStrandId,
    ],
    queryFn: async () => {
      if (!selectedSchoolYearId) return [];

      // If course is selected, fetch levels for that course
      if (selectedCourseId !== "all") {
        return levelApi.getByCourse(selectedSchoolYearId, selectedCourseId);
      }

      // If strand is selected, fetch levels for that strand
      if (selectedStrandId !== "all") {
        return levelApi.getByStrand(selectedSchoolYearId, selectedStrandId);
      }

      // Otherwise, fetch all levels for the school year
      return levelApi.getBySchoolYear(selectedSchoolYearId);
    },
    enabled: !!selectedSchoolYearId,
  });

  // Courses - only if program selected and supports courses
  const { data: courses = [] } = useQuery({
    queryKey: ["admin", "courses", selectedProgramId],
    queryFn: () => courseApi.getAll({ schoolYearId: selectedSchoolYearId!, programId: selectedProgramId }),
    enabled: selectedProgramId !== "all" && !!selectedSchoolYearId,
  });

  // Strands - only if program selected and supports strands
  const { data: strands = [] } = useQuery({
    queryKey: ["admin", "strands", selectedProgramId],
    queryFn: () => strandApi.getAll({ program_id: selectedProgramId }),
    enabled: selectedProgramId !== "all",
  });

  // Educators
  const { data: educators = [], isLoading: educatorsLoading } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  // Subjects with cascading filters
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<
    Subject[]
  >({
    queryKey: [
      "admin",
      "subjects",
      selectedSchoolYearId,
      selectedProgramId,
      filterLevelId,
      selectedCourseId,
      selectedStrandId,
      activeTab,
    ],
    queryFn: () =>
      subjectApi.getAll({
        schoolYearId: selectedSchoolYearId!,
        programId: selectedProgramId !== "all" ? selectedProgramId : undefined,
        levelId: filterLevelId !== "all" ? filterLevelId : undefined,
        courseId: selectedCourseId !== "all" ? selectedCourseId : undefined,
        strandId: selectedStrandId !== "all" ? selectedStrandId : undefined,
        subjectType: activeTab,
      }),
    enabled: !!selectedSchoolYearId,
  });

  // ━━━━━ Mutations ━━━━━
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
        err?.response?.data?.message ?? "Failed to unlock subject."
      );
      setUnlockTarget(null);
    },
  });

  const columns = useSubjectColumns(setLockTarget, setUnlockTarget);
  const isLoading =
    levelsLoading || educatorsLoading || subjectsLoading || programsLoading;

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
          <>
            {/* Program filter */}
            <Select
              value={selectedProgramId}
              onValueChange={(v) => {
                setSelectedProgramId(v ?? "all");
                setFilterLevelId("all");
                setSelectedCourseId("all");
                setSelectedStrandId("all");
              }}
            >
              <SelectTrigger className="w-48 h-9 text-sm">
                <SelectValue placeholder="All Programs">
                  {selectedProgramId === "all"
                    ? "All Programs"
                    : programs.find((p) => p.id === selectedProgramId)?.name ??
                      "All Programs"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Course filter - show only if program selected and has courses */}
            {selectedProgramId !== "all" && courses.length > 0 && (
              <Select
                value={selectedCourseId}
                onValueChange={(v) => setSelectedCourseId(v ?? "all")}
              >
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue placeholder="All Courses">
                    {selectedCourseId === "all"
                      ? "All Courses"
                      : courses.find((c) => c.id === selectedCourseId)?.name ??
                        "All Courses"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Strand filter - show only if program selected and has strands */}
            {selectedProgramId !== "all" && strands.length > 0 && (
              <Select
                value={selectedStrandId}
                onValueChange={(v) => setSelectedStrandId(v ?? "all")}
              >
                <SelectTrigger className="w-40 h-9 text-sm">
                  <SelectValue placeholder="All Strands">
                    {selectedStrandId === "all"
                      ? "All Strands"
                      : strands.find((s) => s.id === selectedStrandId)?.name ??
                        "All Strands"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strands</SelectItem>
                  {strands.map((strand) => (
                    <SelectItem key={strand.id} value={strand.id}>
                      {strand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Level filter - now dynamically populated based on course/strand */}
            <Select
              value={filterLevelId}
              onValueChange={(v) => setFilterLevelId(v ?? "all")}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
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
          </>
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
                  : selectedCourseId !== "all"
                  ? `No ${activeTab} subjects for this course yet.`
                  : selectedStrandId !== "all"
                  ? `No ${activeTab} subjects for this strand yet.`
                  : selectedProgramId !== "all"
                  ? `No ${activeTab} subjects for this program yet.`
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
              {/* Minor tab: show sharing info */}
              {activeTab === "minor" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Minor subjects can be shared to courses, strands, or
                    levels within their program.
                  </span>
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