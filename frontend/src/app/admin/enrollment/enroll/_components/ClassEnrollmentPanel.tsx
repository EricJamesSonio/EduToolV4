"use client";

import { CalendarDays, Users, ChevronUp, ChevronDown, CheckSquare, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSchedule } from "./utils";

import type { Class } from "@/types/admin/class.types";

interface EnrichedClass extends Class {
  subjectName: string;
  educatorName: string;
  semesterName: string;
}

interface ClassEnrollmentPanelProps {
  classes: EnrichedClass[];
  isLoading: boolean;
  expandedClassId: string | null;
  onToggleExpand: (classId: string) => void;
  eligibleStudents: { id: string; fullName: string; studentId: string | null }[];
  classStudentSelections: Record<string, Set<string>>;
  onToggleStudent: (classId: string, studentId: string) => void;
  onToggleAllStudents: (classId: string, studentIds: string[]) => void;
  onEnrollInClass: (cls: EnrichedClass) => void;
  enrollingClassIds: Set<string>;
}

export function ClassEnrollmentPanel({
  classes,
  isLoading,
  expandedClassId,
  onToggleExpand,
  eligibleStudents,
  classStudentSelections,
  onToggleStudent,
  onToggleAllStudents,
  onEnrollInClass,
  enrollingClassIds,
}: ClassEnrollmentPanelProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Classes</span>
        <Badge variant="secondary" className="text-xs ml-auto">
          {classes.length}
        </Badge>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Select a class to enroll students from this department and level into it.
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No classes found</p>
            <p className="text-xs text-muted-foreground">No classes are available for this department and level.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((cls) => {
              const isExpanded = expandedClassId === cls.id;
              const selections = classStudentSelections[cls.id] ?? new Set<string>();
              const isFull = cls.enrolledCount >= cls.capacity;
              const isEnrolling = enrollingClassIds.has(cls.id);
              const eligibleStudentIds = eligibleStudents.map((s) => s.id);
              const allSelected =
                eligibleStudentIds.length > 0 &&
                eligibleStudentIds.every((id) => selections.has(id));

              return (
                <div
                  key={cls.id}
                  className="rounded-lg border bg-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => onToggleExpand(cls.id)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {cls.subjectName ?? "Unnamed Subject"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {cls.semesterName ?? "—"} &middot;{" "}
                        {cls.educatorName ?? "No educator"}
                      </p>
                    </div>

                    <Badge variant="outline" className="text-xs shrink-0">
                      {cls.sectionName ?? "No Section"}
                    </Badge>

                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                      {formatSchedule(cls.schedules)}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="space-y-1 text-right">
                        <p
                          className={cn(
                            "text-xs font-medium",
                            isFull ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {cls.enrolledCount}/{cls.capacity}
                        </p>
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              isFull ? "bg-destructive" : "bg-primary",
                            )}
                            style={{
                              width: `${Math.min((cls.enrolledCount / cls.capacity) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/10">
                      {eligibleStudents.length === 0 ? (
                        <div className="px-5 py-8 text-center space-y-1">
                          <Users className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                          <p className="text-sm text-muted-foreground font-medium">
                            No eligible students
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enroll students into this department and level first.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/20 text-xs font-medium text-muted-foreground">
                            <button
                              type="button"
                              onClick={() =>
                                onToggleAllStudents(cls.id, eligibleStudentIds)
                              }
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                allSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40",
                              )}
                            >
                              {allSelected && <CheckSquare className="h-3 w-3" />}
                            </button>
                            <span className="w-24">Student ID</span>
                            <span className="flex-1">Name</span>
                          </div>

                          <div className="max-h-60 overflow-y-auto divide-y">
                            {eligibleStudents.map((student) => {
                              const isChecked = selections.has(student.id);
                              return (
                                <button
                                  key={student.id}
                                  type="button"
                                  onClick={() => onToggleStudent(cls.id, student.id)}
                                  className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30",
                                    isChecked && "bg-primary/5",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                      isChecked
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-muted-foreground/40",
                                    )}
                                  >
                                    {isChecked && <CheckSquare className="h-3 w-3" />}
                                  </div>
                                  <span className="w-24 text-sm text-muted-foreground truncate">
                                    {student.studentId ?? "—"}
                                  </span>
                                  <span className="flex-1 text-sm font-medium truncate">
                                    {student.fullName}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                            <p className="text-xs text-muted-foreground">
                              {selections.size > 0
                                ? `${selections.size} student${selections.size > 1 ? "s" : ""} selected`
                                : "Select students to enroll in this class"}
                            </p>
                            <Button
                              size="sm"
                              disabled={selections.size === 0 || isEnrolling || isFull}
                              onClick={() => onEnrollInClass(cls)}
                            >
                              {isEnrolling ? (
                                "Enrolling..."
                              ) : isFull ? (
                                "Class Full"
                              ) : (
                                <>
                                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                  {`Enroll${selections.size > 0 ? ` (${selections.size})` : ""}`}
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
