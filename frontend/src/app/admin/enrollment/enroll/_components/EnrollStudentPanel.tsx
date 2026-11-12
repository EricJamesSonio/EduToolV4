"use client";

import { useMemo, useState } from "react";
import { Users, CheckSquare, AlertCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { StudentDetailModal } from "@/components/admin/enrollment/enroll/StudentDetailModal";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

import type { ContextTableRow } from "./types";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";
import type { Section } from "@/types/admin/section.types";
import type { Student } from "@/types/admin/student.types";

type LeftTab = "all" | "pending" | "enroll";

interface ViewTarget {
  id: string;
  programName?: string | null;
  sectionName?: string | null;
}

interface RowContext {
  programId: string;
  courseId: string;
  strandId: string;
  levelId: string;
}

interface EnrollStudentPanelProps {
  leftTab: LeftTab;
  onTabChange: (tab: LeftTab) => void;
  contextColumns: ColumnDef<ContextTableRow>[];
  allContextEnrollments: StudentSchoolYearEnrollment[];
  pendingSectionEnrollments: StudentSchoolYearEnrollment[];
  programId: string;
  courseId: string;
  strandId: string;
  levelId: string;
  studentMap: Map<string, { fullName: string; studentId: string | null }>;
  studentsById: Map<string, Student>;
  pageLoading: boolean;
  sections: Section[];
  sectionAssignments: Record<string, string>;
  onSectionAssign: (programEnrollmentId: string, sectionId: string) => void;
  updateProgEnrollPending: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filtered: Student[];
  selected: Set<string>;
  onToggleAll: () => void;
  onToggle: (id: string) => void;
  onConfirmEnroll: () => void;
  enrollBlocked: boolean;
  bulkEnrollPending: boolean;
}

function buildRows(
  enrollments: StudentSchoolYearEnrollment[],
  ctx: RowContext,
  studentMap: Map<string, { fullName: string; studentId: string | null }>,
): ContextTableRow[] {
  return enrollments.map((enr) => {
    const pe = enr.programEnrollments.find(
      (p) =>
        p.program_id === ctx.programId &&
        (!ctx.courseId || p.course?.id === ctx.courseId) &&
        (!ctx.strandId || p.strand?.id === ctx.strandId) &&
        (!ctx.levelId || p.level?.id === ctx.levelId),
    );
    const student = studentMap.get(enr.student_id);
    return {
      id: enr.id,
      peId: pe?.id ?? "",
      studentUuid: enr.student_id,
      studentId: student?.studentId ?? null,
      studentName: student?.fullName ?? "Unknown Student",
      programName: pe?.program.name ?? "",
      sectionId: pe?.section?.id ?? null,
      sectionName: pe?.section?.name ?? null,
    };
  });
}

function rowMatches(row: ContextTableRow, q: string): boolean {
  if (!q) return true;
  return (
    row.studentName.toLowerCase().includes(q) ||
    (row.studentId ?? "").toLowerCase().includes(q) ||
    row.programName.toLowerCase().includes(q) ||
    (row.sectionName ?? "").toLowerCase().includes(q)
  );
}

export function EnrollStudentPanel({
  leftTab,
  onTabChange,
  contextColumns,
  allContextEnrollments,
  pendingSectionEnrollments,
  programId,
  courseId,
  strandId,
  levelId,
  studentMap,
  studentsById,
  pageLoading,
  sections,
  onSectionAssign,
  search,
  onSearchChange,
  filtered,
  selected,
  onToggleAll,
  onToggle,
  onConfirmEnroll,
  enrollBlocked,
  bulkEnrollPending,
}: EnrollStudentPanelProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [viewTarget, setViewTarget] = useState<ViewTarget | null>(null);

  const q = search.trim().toLowerCase();

  const allRows = useMemo(
    () =>
      buildRows(
        allContextEnrollments,
        { programId, courseId, strandId, levelId },
        studentMap,
      ).filter((r) => rowMatches(r, q)),
    [allContextEnrollments, programId, courseId, strandId, levelId, studentMap, q],
  );

  const pendingRows = useMemo(
    () =>
      buildRows(
        pendingSectionEnrollments,
        { programId, courseId, strandId, levelId },
        studentMap,
      ).filter((r) => rowMatches(r, q)),
    [pendingSectionEnrollments, programId, courseId, strandId, levelId, studentMap, q],
  );

  const columns: ColumnDef<ContextTableRow>[] = useMemo(
    () => [
      ...contextColumns,
      {
        id: "view",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-xs"
            aria-label={`View ${row.original.studentName}`}
            onClick={() =>
              setViewTarget({
                id: row.original.studentUuid,
                programName: row.original.programName,
                sectionName: row.original.sectionName,
              })
            }
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        ),
      } satisfies ColumnDef<ContextTableRow>,
    ],
    [contextColumns],
  );

  const activeTotal =
    leftTab === "all"
      ? allRows.length
      : leftTab === "pending"
        ? pendingRows.length
        : filtered.length;

  const totalPages = Math.max(1, Math.ceil(activeTotal / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const end = start + limit;

  const pagedAll = allRows.slice(start, end);
  const pagedPending = pendingRows.slice(start, end);
  const pagedEnroll = filtered.slice(start, end);

  const handleTabChange = (tab: LeftTab) => {
    setPage(1);
    onTabChange(tab);
  };

  const handleSearchChange = (value: string) => {
    setPage(1);
    onSearchChange(value);
  };

  const allSelected = selected.size === filtered.length && filtered.length > 0;

  return (
    <div>
      <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={leftTab} onValueChange={(v) => handleTabChange(v as LeftTab)}>
          <TabsList>
            <TabsTrigger value="all" className="px-3">
              All Students ({allContextEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="px-3">
              Pending Section ({pendingSectionEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="enroll" className="px-3">
              Enroll Student ({filtered.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex w-full items-center gap-3 lg:w-auto">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, student ID, or email..."
            disabled={pageLoading}
            className="w-full lg:w-80"
          />
          {leftTab === "enroll" && filtered.length > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {selected.size} of {filtered.length} selected
            </span>
          )}
        </div>
      </div>

      {leftTab === "all" && (
        <div className="space-y-4 p-5">
          <DataTable
            columns={columns}
            data={pagedAll}
            isLoading={pageLoading}
            emptyTitle="No students in this context"
            emptyDescription="No students are enrolled in this context yet."
          />
          {allRows.length > 0 && (
            <Pagination
              page={safePage}
              limit={limit}
              total={allRows.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </div>
      )}

      {leftTab === "pending" && (
        <div className="space-y-4 p-5">
          <p className="text-xs text-muted-foreground">
            Students enrolled in a department who haven&apos;t been assigned to a section yet.
          </p>
          <DataTable
            columns={columns}
            data={pagedPending}
            isLoading={pageLoading}
            emptyTitle="All sections assigned"
            emptyDescription="No pending section assignments for this school year."
          />
          {pendingRows.length > 0 && (
            <Pagination
              page={safePage}
              limit={limit}
              total={pendingRows.length}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
          {sections.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick section assignment</p>
              <div className="flex items-center gap-2">
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (!v) return;
                    const pending = pendingSectionEnrollments
                      .map((enr) => {
                        const pe = enr.programEnrollments.find(
                          (p) =>
                            p.program_id === programId &&
                            p.section === null &&
                            (!courseId || p.course?.id === courseId) &&
                            (!strandId || p.strand?.id === strandId) &&
                            (!levelId || p.level?.id === levelId),
                        );
                        return pe?.id;
                      })
                      .filter(Boolean) as string[];
                    pending.forEach((peId) => onSectionAssign(peId, v));
                  }}
                >
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue placeholder="Assign all to section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id} className="text-xs">
                        {sec.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      {leftTab === "enroll" && (
        <div>
          {pageLoading ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="space-y-2 px-5 py-14 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "No students match your search."
                  : "All students are already enrolled in this school year."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b bg-muted/20 px-5 py-2 text-xs font-medium text-muted-foreground">
                <button
                  type="button"
                  onClick={onToggleAll}
                  aria-label="Select all results"
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    allSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {allSelected && <CheckSquare className="h-3 w-3" />}
                </button>
                <span className="w-28">Student ID</span>
                <span className="flex-1">Name (select all {filtered.length})</span>
                <span className="w-20">Status</span>
                <span className="w-16" />
              </div>

              <div className="divide-y">
                {pagedEnroll.map((student) => {
                  const isSelected = selected.has(student.id);
                  return (
                    <div
                      key={student.id}
                      className={cn(
                        "flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/30",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onToggle(student.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {isSelected && <CheckSquare className="h-3 w-3" />}
                        </div>
                        <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">
                          {student.studentId ?? "—"}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium">
                          {student.fullName}
                        </span>
                        <span className="w-20 shrink-0">
                          <Badge
                            variant={student.status === "active" ? "default" : "secondary"}
                            className="text-[10px] capitalize"
                          >
                            {student.status}
                          </Badge>
                        </span>
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-16 shrink-0 gap-1 text-xs"
                        aria-label={`View ${student.fullName}`}
                        onClick={() => setViewTarget({ id: student.id })}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="border-t px-5 py-3">
                <Pagination
                  page={safePage}
                  limit={limit}
                  total={filtered.length}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                />
              </div>
            </>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-t bg-muted/10 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {selected.size > 0
                  ? `${selected.size} student${selected.size > 1 ? "s" : ""} selected`
                  : "Select students to enroll"}
              </p>
              {enrollBlocked ? (
                <div className="flex items-center gap-2">
                  <p className="flex items-center gap-1.5 text-xs text-warning">
                    <AlertCircle className="h-3.5 w-3.5" />
                    School year not ready
                  </p>
                  <Button size="sm" variant="outline" onClick={onConfirmEnroll}>
                    See why
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={onConfirmEnroll}
                  disabled={selected.size === 0 || bulkEnrollPending}
                >
                  {bulkEnrollPending
                    ? "Enrolling..."
                    : `Enroll ${selected.size > 0 ? `(${selected.size})` : ""}`}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <StudentDetailModal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        student={viewTarget ? studentsById.get(viewTarget.id) ?? null : null}
        context={viewTarget}
      />
    </div>
  );
}