"use client";

import { useMemo } from "react";
import { UserRoundCheck, Users, CheckSquare } from "lucide-react";
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
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

import type { ContextTableRow } from "./types";
import type { StudentSchoolYearEnrollment } from "@/types/admin/student-enrollment.types";
import type { Section } from "@/types/admin/section.types";
import type { Student } from "@/types/admin/student.types";

interface EnrollStudentPanelProps {
  leftTab: "all" | "pending" | "enroll";
  onTabChange: (tab: "all" | "pending" | "enroll") => void;
  contextColumns: ColumnDef<ContextTableRow>[];
  allContextEnrollments: StudentSchoolYearEnrollment[];
  pendingSectionEnrollments: StudentSchoolYearEnrollment[];
  programId: string;
  courseId: string;
  strandId: string;
  levelId: string;
  studentMap: Map<string, { fullName: string; studentId: string | null }>;
  pageLoading: boolean;
  sections: Section[];
  sectionAssignments: Record<string, string>;
  onSectionAssign: (programEnrollmentId: string, sectionId: string) => void;
  updateProgEnrollPending: boolean;
  /** Enroll Student tab */
  search: string;
  filtered: Student[];
  selected: Set<string>;
  onToggleAll: () => void;
  onToggle: (id: string) => void;
  onConfirmEnroll: () => void;
  bulkEnrollPending: boolean;
  /** Enroll student tab loading */
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
  pageLoading,
  sections,
  sectionAssignments,
  onSectionAssign,
  updateProgEnrollPending,
  search,
  filtered,
  selected,
  onToggleAll,
  onToggle,
  onConfirmEnroll,
  bulkEnrollPending,
}: EnrollStudentPanelProps) {
  const mapEnrollments = (
    enrollments: StudentSchoolYearEnrollment[],
  ): ContextTableRow[] =>
    enrollments.map((enr) => {
      const pe = enr.programEnrollments.find(
        (pe) =>
          pe.program_id === programId &&
          (!courseId || pe.course?.id === courseId) &&
          (!strandId || pe.strand?.id === strandId) &&
          (!levelId || pe.level?.id === levelId),
      );
      const student = studentMap.get(enr.student_id);
      return {
        id: enr.id,
        peId: pe?.id ?? "",
        studentId: student?.studentId ?? null,
        studentName: student?.fullName ?? "Unknown Student",
        programName: pe?.program.name ?? "",
        sectionId: pe?.section?.id ?? null,
        sectionName: pe?.section?.name ?? null,
      };
    });

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
        <UserRoundCheck className="h-4 w-4 text-primary" />
        <Tabs value={leftTab} onValueChange={(v) => onTabChange(v as typeof leftTab)}>
          <TabsList>
            <TabsTrigger value="all">All Students</TabsTrigger>
            <TabsTrigger value="pending">Pending Section</TabsTrigger>
            <TabsTrigger value="enroll">Enroll Student</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {leftTab === "all" && (
        <div className="p-4">
          <DataTable
            columns={contextColumns}
            data={mapEnrollments(allContextEnrollments)}
            isLoading={pageLoading}
            emptyTitle="No students in this context"
            emptyDescription="No students are enrolled in this context yet."
          />
        </div>
      )}

      {leftTab === "pending" && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Students enrolled in a department who haven&apos;t been assigned to a section yet.
          </p>
          <DataTable
            columns={contextColumns}
            data={mapEnrollments(pendingSectionEnrollments)}
            isLoading={pageLoading}
            emptyTitle="All sections assigned"
            emptyDescription="No pending section assignments for this school year."
            className="rounded-lg border"
          />
          {sections.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick section assignment</p>
              <div className="flex items-center gap-2">
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (!v) return;
                    const pending = pendingSectionEnrollments.map((enr) => {
                      const pe = enr.programEnrollments.find(
                        (pe) =>
                          pe.program_id === programId &&
                          pe.section === null &&
                          (!courseId || pe.course?.id === courseId) &&
                          (!strandId || pe.strand?.id === strandId) &&
                          (!levelId || pe.level?.id === levelId),
                      );
                      return pe?.id;
                    }).filter(Boolean) as string[];
                    pending.forEach((peId) => onSectionAssign(peId, v));
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-48">
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
            <div className="space-y-0 divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center space-y-2">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                {search
                  ? "No students match your search."
                  : "All students are already enrolled in this school year."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-2 border-b bg-muted/20 text-xs font-medium text-muted-foreground">
                <button
                  onClick={onToggleAll}
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    selected.size === filtered.length && filtered.length > 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40",
                  )}
                >
                  {selected.size === filtered.length && filtered.length > 0 && (
                    <CheckSquare className="h-3 w-3" />
                  )}
                </button>
                <span className="w-24">Student ID</span>
                <span className="flex-1">Name</span>
                <span className="w-20">Status</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y">
                {filtered.map((student) => {
                  const isSelected = selected.has(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => onToggle(student.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-muted/30",
                        isSelected && "bg-primary/5",
                      )}
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
                      <span className="w-24 text-sm text-muted-foreground truncate">
                        {student.studentId ?? "—"}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate">
                        {student.fullName}
                      </span>
                      <span className="w-20">
                        <Badge
                          variant={student.status === "active" ? "default" : "secondary"}
                          className="text-[10px] capitalize"
                        >
                          {student.status}
                        </Badge>
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                {selected.size > 0
                  ? `${selected.size} student${selected.size > 1 ? "s" : ""} selected`
                  : "Select students to enroll"}
              </p>
              <Button
                size="sm"
                onClick={onConfirmEnroll}
                disabled={selected.size === 0 || bulkEnrollPending}
              >
                {bulkEnrollPending
                  ? "Enrolling..."
                  : `Enroll ${selected.size > 0 ? `(${selected.size})` : ""}`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
