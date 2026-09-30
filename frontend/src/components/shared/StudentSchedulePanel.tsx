"use client";

import { CalendarDays } from "lucide-react";

import { WeeklyScheduleGrid } from "@/components/shared/WeeklyScheduleGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { hasAnySchedule } from "@/utils/studentSchedule.utils";
import { useScheduleWindow } from "@/hooks/shared/useScheduleWindow";
import type { Class } from "@/types/admin/class.types";

interface StudentSchedulePanelProps {
  classes: Class[];
  isLoading?: boolean;
  /** Copy shown when the student has no classes at all. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Copy shown when classes exist but have no schedule times assigned. */
  noScheduleTitle?: string;
  noScheduleDescription?: string;
}

/**
 * Weekly schedule derived from the classes a student is enrolled in.
 *
 * Reuses the same WeeklyScheduleGrid as the educator and section views, so all
 * three read identically. The caller supplies the already-mapped `Class[]`
 * (see utils/studentSchedule.utils) - this component owns the empty and
 * loading states, and supplies the school's full operating window so the
 * timetable shows every day and slot rather than only the class span.
 */
export function StudentSchedulePanel({
  classes,
  isLoading = false,
  emptyTitle = "No classes yet",
  emptyDescription = "You are not enrolled in any classes yet.",
  noScheduleTitle = "No schedule yet",
  noScheduleDescription =
    "Your classes don't have schedule times assigned yet.",
}: StudentSchedulePanelProps): React.JSX.Element {
  // Declared before any early return: hooks must run unconditionally.
  const { windowStartMin, windowEndMin, stepMin, showAllDays } =
    useScheduleWindow();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  // Classes exist but none carry schedule times: distinguish this from
  // "no classes", otherwise a blank grid reads as a broken widget.
  if (!hasAnySchedule(classes)) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={noScheduleTitle}
        description={noScheduleDescription}
      />
    );
  }

  return (
    <WeeklyScheduleGrid
      classes={classes}
      windowStartMin={windowStartMin}
      windowEndMin={windowEndMin}
      stepMin={stepMin}
      showAllDays={showAllDays}
    />
  );
}