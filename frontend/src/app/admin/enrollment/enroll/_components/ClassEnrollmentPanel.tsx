"use client";

import { useState } from "react";
import {
  CalendarDays, Users, CheckSquare, UserPlus, UserCheck, Eye,
  AlertCircle, Lock, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";
import { formatSchedule } from "./utils";
import {
  hasUnmetPrerequisites,
  prerequisiteBlockMessage,
  type PrerequisiteMiss,
} from "@/utils/prerequisites";

import type { Class } from "@/types/admin/class.types";

interface EnrichedClass extends Class {
  subjectName: string;
  educatorName: string;
  semesterName: string;
}

interface EligibleStudent {
  id: string;
  fullName: string;
  studentId: string | null;
  missingPrerequisites?: PrerequisiteMiss[];
}

interface EnrolledStudent {
  id: string;
  studentId: string | null;
  fullName: string;
  status: "active" | "pending" | "removed";
}

type ClassMode = "enroll" | "view";

interface ClassEnrollmentPanelProps {
  classes: EnrichedClass[];
  isLoading: boolean;
  expandedClassId: string | null;
  onOpenClass: (classId: string) => void;
  onClose: () => void;
  eligibleStudentsByClass: Record<string, EligibleStudent[]>;
  enrolledStudentsByClass: Record<string, EnrolledStudent[]>;
  classEnrollmentsLoading: boolean;
  classStudentSelections: Record<string, Set<string>>;
  onToggleStudent: (classId: string, studentId: string) => void;
  onToggleAllStudents: (classId: string, studentIds: string[]) => void;
  onEnrollInClass: (cls: EnrichedClass) => void;
  enrollBlocked: boolean;
  enrollingClassIds: Set<string>;
  prerequisiteCheckPending?: boolean;
}

interface ClassModalBodyProps {
  cls: EnrichedClass;
  eligibleStudents: EligibleStudent[];
  enrolledStudents: EnrolledStudent[];
  enrolledLoading: boolean;
  selections: Set<string>;
  onToggleStudent: (studentId: string) => void;
  onToggleAll: (studentIds: string[]) => void;
  onEnroll: () => void;
  enrollBlocked: boolean;
  isEnrolling: boolean;
  prerequisiteCheckPending: boolean;
}

const MODAL_PAGE_SIZES = [5, 10, 25];

function ClassModalBody({
  cls,
  eligibleStudents,
  enrolledStudents,
  enrolledLoading,
  selections,
  onToggleStudent,
  onToggleAll,
  onEnroll,
  enrollBlocked,
  isEnrolling,
  prerequisiteCheckPending,
}: ClassModalBodyProps) {
  const [mode, setMode] = useState<ClassMode>("enroll");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const isFull = cls.enrolledCount >= cls.capacity;

  const eligibleStudentIds = eligibleStudents
    .filter((s) => !hasUnmetPrerequisites(s.missingPrerequisites))
    .map((s) => s.id);
  const allSelected =
    eligibleStudentIds.length > 0 &&
    eligibleStudentIds.every((id) => selections.has(id));

  const activeTotal =
    mode === "enroll" ? eligibleStudents.length : enrolledStudents.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  const pagedEligible = eligibleStudents.slice(start, start + limit);
  const pagedEnrolled = enrolledStudents.slice(start, start + limit);

  const switchMode = (next: ClassMode) => {
    setMode(next);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg bg-muted/40 p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === "enroll" ? "secondary" : "ghost"}
          className="h-8 flex-1 text-xs"
          onClick={() => switchMode("enroll")}
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Enroll ({eligibleStudents.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "view" ? "secondary" : "ghost"}
          className="h-8 flex-1 text-xs"
          onClick={() => switchMode("view")}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View Enrolled ({cls.enrolledCount})
        </Button>
      </div>

      {mode === "view" ? (
        <div className="overflow-hidden rounded-lg border">
          {enrolledLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="space-y-1 px-5 py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                No students enrolled
              </p>
              <p className="text-xs text-muted-foreground">
                Enroll students into this class from the Enroll tab.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-2 text-xs font-medium text-muted-foreground">
                <UserCheck className="h-3.5 w-3.5" />
                <span className="w-28">Student ID</span>
                <span className="flex-1">Name</span>
                <span className="w-16 text-right">Status</span>
              </div>
              <div className="divide-y">
                {pagedEnrolled.map((student) => (
                  <div key={student.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-28 truncate pl-6 text-sm text-muted-foreground">
                      {student.studentId ?? "—"}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">
                      {student.fullName}
                    </span>
                    <Badge
                      variant={student.status === "active" ? "outline" : "secondary"}
                      className="w-16 shrink-0 justify-center text-[10px] capitalize"
                    >
                      {student.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : eligibleStudents.length === 0 ? (
        <div className="space-y-1 rounded-lg border px-5 py-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            No eligible students
          </p>
          <p className="text-xs text-muted-foreground">
            No students in this class&apos;s section are enrolled in this program and level yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-2 text-xs font-medium text-muted-foreground">
            <button
              type="button"
              aria-label="Select all eligible students"
              onClick={() => onToggleAll(eligibleStudentIds)}
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
            <span className="flex-1">Name</span>
          </div>

          <div className="divide-y">
            {pagedEligible.map((student) => {
              const isChecked = selections.has(student.id);
              const blocked = hasUnmetPrerequisites(student.missingPrerequisites);
              return (
                <button
                  key={student.id}
                  type="button"
                  aria-disabled={blocked}
                  onClick={() => {
                    if (blocked) {
                      toast.warning(
                        prerequisiteBlockMessage(
                          student.fullName,
                          student.missingPrerequisites,
                        ),
                      );
                      return;
                    }
                    onToggleStudent(student.id);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    blocked ? "cursor-not-allowed opacity-60" : "hover:bg-muted/30",
                    isChecked && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      blocked
                        ? "border-muted-foreground/30 bg-muted"
                        : isChecked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40",
                    )}
                  >
                    {blocked ? (
                      <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                    ) : (
                      isChecked && <CheckSquare className="h-3 w-3" />
                    )}
                  </div>
                  <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">
                    {student.studentId ?? "—"}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {student.fullName}
                  </span>
                  {blocked && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 gap-1 text-[10px] text-muted-foreground"
                    >
                      <AlertCircle className="h-3 w-3" />
                      Prerequisite
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTotal > 0 && !(mode === "view" && enrolledLoading) && (
        <Pagination
          page={safePage}
          limit={limit}
          total={activeTotal}
          onPageChange={setPage}
          onLimitChange={setLimit}
          pageSizeOptions={MODAL_PAGE_SIZES}
        />
      )}

      {mode === "enroll" && eligibleStudents.length > 0 && (
        <ModalFooter className="items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selections.size > 0
              ? `${selections.size} student${selections.size > 1 ? "s" : ""} selected`
              : "Select students to enroll in this class"}
          </p>
          {enrollBlocked ? (
            <Button size="sm" variant="outline" onClick={onEnroll}>
              <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
              See why
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={
                selections.size === 0 ||
                isEnrolling ||
                isFull ||
                prerequisiteCheckPending
              }
              onClick={onEnroll}
            >
              {isEnrolling ? (
                "Enrolling..."
              ) : isFull ? (
                "Class Full"
              ) : prerequisiteCheckPending ? (
                "Checking prerequisites..."
              ) : (
                <>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  {`Enroll${selections.size > 0 ? ` (${selections.size})` : ""}`}
                </>
              )}
            </Button>
          )}
        </ModalFooter>
      )}
    </div>
  );
}

export function ClassEnrollmentPanel({
  classes,
  isLoading,
  expandedClassId,
  onOpenClass,
  onClose,
  eligibleStudentsByClass,
  enrolledStudentsByClass,
  classEnrollmentsLoading,
  classStudentSelections,
  onToggleStudent,
  onToggleAllStudents,
  onEnrollInClass,
  enrollBlocked,
  enrollingClassIds,
  prerequisiteCheckPending = false,
}: ClassEnrollmentPanelProps) {
  const openClass = classes.find((c) => c.id === expandedClassId) ?? null;

  const openEnrolled = openClass ? enrolledStudentsByClass[openClass.id] ?? [] : [];
  const openEnrolledIds = new Set(openEnrolled.map((s) => s.id));
  const openEligible = openClass
    ? (eligibleStudentsByClass[openClass.id] ?? []).filter(
        (s) => !openEnrolledIds.has(s.id),
      )
    : [];

  return (
    <div className="space-y-5 p-5">
      <p className="text-sm text-muted-foreground">
        Select a class to enroll students from its section into it.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="space-y-2 py-14 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No classes found</p>
          <p className="text-xs text-muted-foreground">
            No classes are available for this department and level.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => {
            const isFull = cls.enrolledCount >= cls.capacity;
            const percent =
              cls.capacity > 0
                ? Math.min((cls.enrolledCount / cls.capacity) * 100, 100)
                : 0;

            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => onOpenClass(cls.id)}
                className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">
                      {cls.subjectName ?? "Unnamed Subject"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {cls.educatorName ?? "No educator"}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {cls.sectionName ?? "No Section"}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{cls.semesterName ?? "—"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{formatSchedule(cls.schedules)}</span>
                  </div>
                </div>

                <div className="mt-auto space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Enrolled</span>
                    <span
                      className={cn(
                        "font-medium",
                        isFull ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {cls.enrolledCount}/{cls.capacity}
                      {isFull ? " · Full" : ""}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full transition-all",
                        isFull ? "bg-destructive" : "bg-primary",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={!!openClass}
        onClose={onClose}
        title={openClass?.subjectName ?? "Class"}
        description={
          openClass
            ? `${openClass.sectionName ?? "No Section"} · ${openClass.educatorName ?? "No educator"} · ${openClass.semesterName ?? "—"}`
            : undefined
        }
        size="3xl"
      >
        {openClass && (
          <ClassModalBody
            key={openClass.id}
            cls={openClass}
            eligibleStudents={openEligible}
            enrolledStudents={openEnrolled}
            enrolledLoading={classEnrollmentsLoading}
            selections={classStudentSelections[openClass.id] ?? new Set<string>()}
            onToggleStudent={(studentId) => onToggleStudent(openClass.id, studentId)}
            onToggleAll={(studentIds) => onToggleAllStudents(openClass.id, studentIds)}
            onEnroll={() => onEnrollInClass(openClass)}
            enrollBlocked={enrollBlocked}
            isEnrolling={enrollingClassIds.has(openClass.id)}
            prerequisiteCheckPending={prerequisiteCheckPending}
          />
        )}
      </Modal>
    </div>
  );
}