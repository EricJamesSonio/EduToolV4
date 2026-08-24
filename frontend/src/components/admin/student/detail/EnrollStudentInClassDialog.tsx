"use client";

import { useEffect, useMemo, useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { studentApi } from "@/api/admin/student.api";
import { classApi } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  studentId: string;
  programIds?: string[];
  onClose: () => void;
}

function formatSchedules(c: Class): string {
  if (!c.schedules || c.schedules.length === 0) return "No schedule";
  return c.schedules
    .map((s) => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const day = days[s.weekday] ?? `Day ${s.weekday}`;
      return `${day} ${s.startTime}–${s.endTime}`;
    })
    .join(" · ");
}

export function EnrollStudentInClassDialog({ open, studentId, onClose }: Props): React.JSX.Element {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSelectedClassId("");
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  const { data: classesRaw, isLoading: classesLoading } = useAsyncQuery(
    queryKeys.admin.classes.eligibleForStudent(studentId, debouncedSearch),
    () => classApi.getEligibleForStudent(studentId, debouncedSearch || undefined),
    { enabled: open && !!studentId },
  );

  const classes = useMemo(() => (Array.isArray(classesRaw) ? classesRaw : []), [classesRaw]);
  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId) ?? null, [classes, selectedClassId]);

  const mutation = useMutationWithInvalidation(
    () => studentApi.addEnrollment(studentId, selectedClassId),
    {
      invalidateKeys: [queryKeys.admin.students.enrollments(studentId), queryKeys.admin.classes.eligibleForStudent(studentId)],
      onSuccess: (data) => {
        if ((data as { overflow?: boolean })?.overflow) {
          toast.warning((data as { message?: string }).message ?? "Class is at capacity but student was enrolled.");
        } else {
          toast.success("Student enrolled successfully.");
        }
        handleClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        const msg = err?.response?.data?.message ?? "Failed to enroll student.";
        // This should now rarely happen because the list is pre-filtered, but keep a human-readable fallback
        toast.error(msg);
      },
    },
  );

  function handleClose(): void {
    setSelectedClassId("");
    setSearch("");
    setDebouncedSearch("");
    onClose();
  }

  const emptyTitle = debouncedSearch ? `No eligible classes match “${debouncedSearch}”` : "No eligible classes";
  const emptyHint = debouncedSearch
    ? "Try a different search, or check the class subject / educator name."
    : "This student has no eligible classes right now. Possible reasons:\n• No active program placement for the class school year\n• Already enrolled in every eligible class for this subject/semester\n• No classes exist for the student's program / course / strand / level / section";

  return (
    <Modal open={open} onClose={handleClose} title="Enroll in Class" size="lg">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="enroll-class-search">Search eligible classes</Label>
          <Input
            id="enroll-class-search"
            placeholder="Search by subject, educator, section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Only classes that match the student&apos;s program, course/strand, level and section are shown — you won&apos;t get “not eligible” errors.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Class</Label>
            <span className="text-xs text-muted-foreground">
              {classesLoading ? "Loading…" : `${classes.length} eligible ${classes.length === 1 ? "class" : "classes"}`}
            </span>
          </div>

          {classesLoading ? (
            <div className="space-y-2 rounded-lg border p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm font-medium">{emptyTitle}</p>
              <p className="mx-auto mt-1 max-w-prose whitespace-pre-line text-xs text-muted-foreground">{emptyHint}</p>
            </div>
          ) : (
            <ScrollArea className="h-[320px] rounded-lg border">
              <div className="divide-y">
                {classes.map((c) => {
                  const isSelected = c.id === selectedClassId;
                  const enrolled = c.enrolledCount ?? 0;
                  const cap = c.capacity ?? 0;
                  const isFull = cap > 0 && enrolled >= cap;
                  const capacityLabel = cap > 0 ? `${enrolled}/${cap}` : `${enrolled} enrolled`;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClassId(c.id)}
                      className={`flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-accent/50 ${isSelected ? "bg-accent" : ""}`}
                    >
                      <span
                        className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium leading-none">{c.subjectName ?? "Unnamed Class"}</span>
                          {c.levelName ? <Badge variant="secondary" className="text-[10px]">{c.levelName}</Badge> : null}
                          {c.sectionName ? <Badge variant="outline" className="text-[10px]">{c.sectionName}</Badge> : null}
                          {c.programName ? <Badge variant="outline" className="text-[10px]">{c.programName}</Badge> : null}
                          {isFull ? <Badge variant="destructive" className="text-[10px]">Full</Badge> : null}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {[c.courseName, c.strandName].filter(Boolean).join(" · ") || null}
                          {[c.courseName || c.strandName ? " · " : "", c.semesterName, c.schoolYearTitle].filter(Boolean).join("")}
                          {c.educatorName ? ` · ${c.educatorName}` : ""}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">{formatSchedules(c)}</span>
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">{capacityLabel}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {selectedClass ? (
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="font-medium">Selected: {selectedClass.subjectName}</p>
              <p className="text-muted-foreground">
                {[selectedClass.programName, selectedClass.levelName, selectedClass.sectionName].filter(Boolean).join(" · ")}
              </p>
              <p className="text-muted-foreground">{formatSchedules(selectedClass)} · {selectedClass.educatorName ?? "No educator"}</p>
              {(selectedClass.capacity ?? 0) > 0 && (selectedClass.enrolledCount ?? 0) >= (selectedClass.capacity ?? 0) && (
                <p className="mt-1 font-medium text-amber-600">This class is at capacity — enrolling will create an overflow record.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !selectedClassId}>
          {mutation.isPending ? "Enrolling..." : "Enroll"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
