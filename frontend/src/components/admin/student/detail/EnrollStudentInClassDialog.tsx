"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
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

import { Lock } from "lucide-react";

import {
  hasUnmetPrerequisites,
  prerequisiteBlockMessage,
  type PrerequisiteMiss,
} from "@/utils/prerequisites";

interface Props {
  open: boolean;
  studentId: string;
  programIds?: string[];
  onClose: () => void;
}

type YearLevelFilter = "all" | `year:${number}`;

type EligibleClass = Class & {
  studentLevelRank?: number | null;
  student_level_rank?: number | null;
  has_prerequisite_warning?: boolean;
  prerequisite_warnings?: PrerequisiteMiss[];
};

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function formatSchedules(c: Class): string {
  if (!c.schedules || c.schedules.length === 0) {
    return "No schedule";
  }

  return c.schedules
    .map((schedule) => {
      const day =
        WEEKDAYS[schedule.weekday] ??
        `Day ${schedule.weekday}`;

      return `${day} ${schedule.startTime}–${schedule.endTime}`;
    })
    .join(" · ");
}

function getYearLevelRank(
  levelName?: string | null,
): number | null {
  if (!levelName) return null;

  const numeric = levelName.match(/\d+/);

  if (numeric) {
    const rank = Number.parseInt(numeric[0], 10);
    return Number.isFinite(rank) ? rank : null;
  }

  const words: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    ninth: 9,
    tenth: 10,
    eleventh: 11,
    twelfth: 12,
  };

  const normalized = levelName.trim().toLowerCase();

  for (const [word, rank] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\b`).test(normalized)) {
      return rank;
    }
  }

  return null;
}

function formatYearLevel(rank: number): string {
  const suffix =
    rank % 100 >= 11 && rank % 100 <= 13
      ? "th"
      : rank % 10 === 1
        ? "st"
        : rank % 10 === 2
          ? "nd"
          : rank % 10 === 3
            ? "rd"
            : "th";

  return `${rank}${suffix} Year`;
}

function getStudentLevelRank(c: EligibleClass): number | null {
  return c.studentLevelRank ?? c.student_level_rank ?? null;
}

export function EnrollStudentInClassDialog({
  open,
  studentId,
  onClose,
}: Props): React.JSX.Element {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedYearLevel, setSelectedYearLevel] =
    useState<YearLevelFilter>("all");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSelectedClassId("");
      setSearch("");
      setDebouncedSearch("");
      setSelectedYearLevel("all");
    }
  }, [open]);

  const {
    data: classesRaw,
    isLoading: classesLoading,
    isError: classesError,
  } = useAsyncQuery(
    queryKeys.admin.classes.eligibleForStudent(
      studentId,
      debouncedSearch,
    ),
    () =>
      classApi.getEligibleForStudent(
        studentId,
        debouncedSearch || undefined,
      ),
    {
      enabled: open && Boolean(studentId),
    },
  );

  const allClasses = useMemo<EligibleClass[]>(() => {
    if (!Array.isArray(classesRaw)) {
      return [];
    }

    return classesRaw as EligibleClass[];
  }, [classesRaw]);

  const lowerYearOptions = useMemo(() => {
    const currentRanks = allClasses
      .map(getStudentLevelRank)
      .filter(
        (rank): rank is number =>
          rank !== null &&
          Number.isInteger(rank) &&
          rank > 0,
      );

    if (currentRanks.length === 0) {
      return [];
    }

    const currentRank = Math.max(...currentRanks);

    return Array.from(
      { length: currentRank - 1 },
      (_, index) => index + 1,
    );
  }, [allClasses]);

  const classes = useMemo<EligibleClass[]>(() => {
    if (selectedYearLevel === "all") {
      return allClasses;
    }

    const selectedRank = Number(
      selectedYearLevel.slice("year:".length),
    );

    return allClasses.filter((c) => {
      const classRank = getYearLevelRank(c.levelName);
      const studentRank = getStudentLevelRank(c);

      return (
        classRank === selectedRank &&
        studentRank !== null &&
        selectedRank < studentRank
      );
    });
  }, [allClasses, selectedYearLevel]);

  const blockedClassIds = useMemo(() => {
    const ids = new Set<string>();

    for (const c of classes) {
      if (
        c.has_prerequisite_warning ||
        hasUnmetPrerequisites(c.prerequisite_warnings)
      ) {
        ids.add(c.id);
      }
    }

    return ids;
  }, [classes]);

  const missingPrereqsByClass = useMemo(() => {
    const map = new Map<string, PrerequisiteMiss[]>();

    for (const c of classes) {
      if (c.prerequisite_warnings?.length) {
        map.set(c.id, c.prerequisite_warnings);
      }
    }

    return map;
  }, [classes]);

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) ?? null;
  }, [classes, selectedClassId]);

  const selectedClassBlocked = selectedClass
    ? blockedClassIds.has(selectedClass.id)
    : false;

  const mutation = useMutationWithInvalidation(
    () => studentApi.addEnrollment(studentId, selectedClassId),
    {
      invalidateKeys: [
        queryKeys.admin.students.enrollments(studentId),
        queryKeys.admin.classes.eligibleForStudent(studentId),
      ],

      onSuccess: (data) => {
        const result = data as {
          overflow?: boolean;
          message?: string;
        };

        if (result?.overflow) {
          toast.warning(
            result.message ??
              "Class is at capacity but student was enrolled.",
          );
        } else {
          toast.success("Student enrolled successfully.");
        }

        handleClose();
      },

      onError: (err: AxiosError<{ message?: string }>) => {
        const message =
          err?.response?.data?.message ??
          "Failed to enroll student.";

        toast.error(message);
      },
    },
  );

  function handleClose(): void {
    if (mutation.isPending) return;

    setSelectedClassId("");
    setSearch("");
    setDebouncedSearch("");
    setSelectedYearLevel("all");

    onClose();
  }

  function handleClassSelection(c: EligibleClass): void {
    if (blockedClassIds.has(c.id)) {
      const missing = missingPrereqsByClass.get(c.id) ?? [];

      toast.warning(
        prerequisiteBlockMessage(
          c.subjectName ?? "This class",
          missing,
        ),
      );

      return;
    }

    setSelectedClassId(c.id);
  }

  function handleEnroll(): void {
    if (
      mutation.isPending ||
      !selectedClass ||
      selectedClassBlocked
    ) {
      return;
    }

    mutation.mutate();
  }

  const selectedYearLabel =
    selectedYearLevel === "all"
      ? null
      : formatYearLevel(
          Number(selectedYearLevel.slice("year:".length)),
        );

  const emptyTitle = debouncedSearch
    ? `No eligible classes match "${debouncedSearch}"`
    : selectedYearLabel
      ? `No eligible ${selectedYearLabel} classes`
      : "No eligible classes";

  const emptyHint = debouncedSearch
    ? "Try a different search, or check the class subject / educator name."
    : selectedYearLabel
      ? `No eligible classes are available for ${selectedYearLabel}. Try selecting All eligible years.`
      : [
          "This student has no eligible classes right now. Possible reasons:",
          "• No active program placement for the class school year",
          "• Already enrolled in every eligible class for this subject/semester",
          "• No classes exist for the student's academic placement",
        ].join("\n");

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Enroll in Class"
      size="lg"
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="enroll-class-search">
              Search eligible classes
            </Label>

            <Input
              id="enroll-class-search"
              placeholder="Search by subject, educator, section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enroll-class-year-level">
              Year level
            </Label>

            <select
              id="enroll-class-year-level"
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={selectedYearLevel}
              onChange={(e) => {
                setSelectedYearLevel(
                  e.target.value as YearLevelFilter,
                );
                setSelectedClassId("");
              }}
            >
              <option value="all">All eligible years</option>

              {lowerYearOptions.map((rank) => (
                <option key={rank} value={`year:${rank}`}>
                  {formatYearLevel(rank)}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            Select a specific lower year to show only its eligible
            classes. Available options depend on the student&apos;s
            current placement. Prerequisite requirements still apply.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Select Class</Label>

            <span className="text-xs text-muted-foreground">
              {classesLoading
                ? "Loading…"
                : `${classes.length} eligible ${
                    classes.length === 1
                      ? "class"
                      : "classes"
                  }`}
            </span>
          </div>

          {classesLoading ? (
            <div className="space-y-2 rounded-lg border p-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : classesError ? (
            <div className="rounded-lg border border-destructive/30 p-8 text-center">
              <p className="text-sm font-medium text-destructive">
                Failed to load eligible classes.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Please close the dialog and try again.
              </p>
            </div>
          ) : classes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm font-medium">
                {emptyTitle}
              </p>

              <p className="mx-auto mt-1 max-w-prose whitespace-pre-line text-xs text-muted-foreground">
                {emptyHint}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[320px] rounded-lg border">
              <div className="divide-y">
                {classes.map((c) => {
                  const isSelected = c.id === selectedClassId;
                  const enrolled = c.enrolledCount ?? 0;
                  const capacity = c.capacity ?? 0;

                  const isFull =
                    capacity > 0 && enrolled >= capacity;

                  const capacityLabel =
                    capacity > 0
                      ? `${enrolled}/${capacity}`
                      : `${enrolled} enrolled`;

                  const blocked = blockedClassIds.has(c.id);

                  const classDetails = [
                    c.courseName,
                    c.strandName,
                    c.semesterName,
                    c.schoolYearTitle,
                    c.educatorName,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={isSelected}
                      aria-disabled={blocked}
                      onClick={() => handleClassSelection(c)}
                      className={[
                        "flex w-full items-start gap-3 px-3 py-3 text-left transition",
                        isSelected ? "bg-accent" : "",
                        blocked
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-accent/50",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-1 h-4 w-4 shrink-0 rounded-full border-2",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30",
                        ].join(" ")}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium leading-none">
                            {c.subjectName ?? "Unnamed Class"}
                          </span>

                          {c.levelName ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {c.levelName}
                            </Badge>
                          ) : null}

                          {c.sectionName ? (
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {c.sectionName}
                            </Badge>
                          ) : null}

                          {c.programName ? (
                            <Badge
                              variant="outline"
                              className="text-[10px]"
                            >
                              {c.programName}
                            </Badge>
                          ) : null}

                          {isFull ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px]"
                            >
                              Full
                            </Badge>
                          ) : null}

                          {blocked ? (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-[10px] text-muted-foreground"
                            >
                              <Lock className="h-3 w-3" />
                              Prerequisite
                            </Badge>
                          ) : null}
                        </span>

                        {classDetails ? (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {classDetails}
                          </span>
                        ) : null}

                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatSchedules(c)}
                        </span>
                      </span>

                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {capacityLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {selectedClass ? (
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="font-medium">
                Selected:{" "}
                {selectedClass.subjectName ?? "Unnamed Class"}
              </p>

              <p className="text-muted-foreground">
                {[
                  selectedClass.programName,
                  selectedClass.levelName,
                  selectedClass.sectionName,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <p className="text-muted-foreground">
                {formatSchedules(selectedClass)}
                {" · "}
                {selectedClass.educatorName ?? "No educator"}
              </p>

              {(selectedClass.capacity ?? 0) > 0 &&
                (selectedClass.enrolledCount ?? 0) >=
                  (selectedClass.capacity ?? 0) && (
                  <p className="mt-1 font-medium text-warning">
                    This class is at capacity — enrolling will
                    create an overflow record.
                  </p>
                )}
            </div>
          ) : null}
        </div>
      </div>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>

        <Button
          onClick={handleEnroll}
          disabled={
            mutation.isPending ||
            !selectedClass ||
            selectedClassBlocked
          }
        >
          {mutation.isPending ? "Enrolling..." : "Enroll"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}