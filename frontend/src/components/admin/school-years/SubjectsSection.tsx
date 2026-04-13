"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, BookOpen } from "lucide-react";
import type { AxiosError } from "axios";
import { subjectApi } from "@/api/admin/subject.api";
import type { Subject, SubjectType } from "@/types/admin/subject.types";
import type { Level }   from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";
import { DataTable }    from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SubjectDialog } from "@/components/admin/subject/SubjectDialog";
import { useSubjectColumns } from "@/components/admin/subject/SubjectColumns";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SubjectsSectionProps {
  program:        Program;
  schoolYearId:   string;
  levels:         Level[];
  isEnded:        boolean;
  initialLevelId?: string; // pre-select a level (from "View Subjects" button on a level row)
}

export function SubjectsSection({
  program,
  schoolYearId,
  levels,
  isEnded,
  initialLevelId,
}: SubjectsSectionProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const [activeTab,      setActiveTab]      = useState<SubjectType>("major");
  const [filterLevelId,  setFilterLevelId]  = useState<string>(initialLevelId ?? "all");
  const [filterCourseId, setFilterCourseId] = useState<string>("all");
  const [filterStrandId, setFilterStrandId] = useState<string>("all");
  const [createOpen,     setCreateOpen]     = useState(false);
  const [lockTarget,     setLockTarget]     = useState<Subject | null>(null);
  const [unlockTarget,   setUnlockTarget]   = useState<Subject | null>(null);

  const isSHS     = program.type === "shs";
  const isCollege = program.type === "college";

  // When initialLevelId changes (user clicks a different level's "View Subjects"),
  // sync the filter without resetting course/strand filters.
  useEffect(() => {
    if (initialLevelId) setFilterLevelId(initialLevelId);
  }, [initialLevelId]);

  useEffect(() => {
    setFilterLevelId(initialLevelId ?? "all");
    setFilterCourseId("all");
    setFilterStrandId("all");
  }, [activeTab, program.id]);

  const programLevels = levels.filter((l) => l.program_id === program.id);

  const qKey = [
    "admin", "subjects", schoolYearId, program.id,
    activeTab, filterLevelId, filterCourseId, filterStrandId,
  ];

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: qKey,
    queryFn: () =>
      subjectApi
        .getAll({
          schoolYearId,
          subjectType:  activeTab,
          levelId:      filterLevelId  !== "all" ? filterLevelId  : undefined,
          courseId:     filterCourseId !== "all" ? filterCourseId : undefined,
          strandId:     filterStrandId !== "all" ? filterStrandId : undefined,
        })
        .then((subjects) => {
          if (activeTab === "minor") return subjects;
          const courseIds = new Set(program.courses?.map((c) => c.id) ?? []);
          const strandIds = new Set(program.strands?.map((s) => s.id) ?? []);
          const levelIds  = new Set(
            levels.filter((l) => l.program_id === program.id).map((l) => l.id),
          );
          return subjects.filter((s) => {
            if (s.courseId) return courseIds.has(s.courseId);
            if (s.strandId) return strandIds.has(s.strandId);
            return s.levelId ? levelIds.has(s.levelId) : false;
          });
        }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });

  const lockMutation = useMutation({
    mutationFn: (id: string) => subjectApi.lock(id),
    onSuccess: () => {
      toast.success("Subject locked.");
      invalidate();
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
      invalidate();
      setUnlockTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to unlock subject.");
      setUnlockTarget(null);
    },
  });

  const columns = useSubjectColumns(setLockTarget, setUnlockTarget);

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Subjects</span>
            {filterLevelId !== "all" && (
              <span className="text-xs text-muted-foreground">
                — {programLevels.find((l) => l.id === filterLevelId)?.name}
              </span>
            )}
          </div>
          {!isEnded && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-3"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Subject
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3">
          {/* Major / Minor tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as SubjectType)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="major" className="text-xs px-3">
                Major
              </TabsTrigger>
              <TabsTrigger value="minor" className="text-xs px-3">
                Minor
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Level filter */}
          {programLevels.length > 0 && (
            <Select
              value={filterLevelId}
              onValueChange={(v) => setFilterLevelId(v ?? "all")}
            >
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="All Levels">
                  {filterLevelId === "all"
                    ? "All Levels"
                    : programLevels.find((l) => l.id === filterLevelId)?.name ??
                      "All Levels"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {programLevels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Course filter (college only) */}
          {isCollege && (program.courses ?? []).length > 0 && (
            <Select
              value={filterCourseId}
              onValueChange={(v) => setFilterCourseId(v ?? "all")}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Courses">
                  {filterCourseId === "all"
                    ? "All Courses"
                    : program.courses.find((c) => c.id === filterCourseId)
                        ?.name ?? "All Courses"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {program.courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Strand filter (SHS only) */}
          {isSHS && (program.strands ?? []).length > 0 && (
            <Select
              value={filterStrandId}
              onValueChange={(v) => setFilterStrandId(v ?? "all")}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All Strands">
                  {filterStrandId === "all"
                    ? "All Strands"
                    : program.strands.find((s) => s.id === filterStrandId)
                        ?.name ?? "All Strands"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strands</SelectItem>
                {program.strands.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        <div className="p-4">
          <DataTable
            columns={columns}
            data={subjects}
            isLoading={isLoading}
            emptyTitle={`No ${activeTab} subjects found`}
            emptyDescription={
              filterLevelId !== "all" ||
              filterCourseId !== "all" ||
              filterStrandId !== "all"
                ? "No subjects match the selected filters."
                : `No ${activeTab} subjects for this program yet.`
            }
          />
        </div>
      </div>

      {/* Create dialog */}
      {createOpen && (
        <SubjectDialog
          levels={programLevels}
          schoolYearId={schoolYearId}
          defaultSubjectType={activeTab}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            invalidate();
            setCreateOpen(false);
          }}
        />
      )}

      {/* Lock confirm */}
      {lockTarget && (
        <ConfirmDialog
          open
          title="Lock this subject?"
          message={`Lock "${lockTarget.title}"? It will become read-only.`}
          confirmLabel="Lock Subject"
          destructive={false}
          isLoading={lockMutation.isPending}
          onConfirm={() => lockMutation.mutate(lockTarget.id)}
          onOpenChange={(o) => { if (!o) setLockTarget(null); }}
        />
      )}

      {/* Unlock confirm */}
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
    </>
  );
}