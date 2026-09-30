"use client";

import { CalendarDays } from "lucide-react";

import { WeeklyScheduleGrid } from "@/components/shared/WeeklyScheduleGrid";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { hasAnySchedule } from "@/utils/studentSchedule.utils";
import { useScheduleWindow } from "@/hooks/shared/useScheduleWindow";
import type { Class } from "@/types/admin/class.types";

interface SchedulePanelProps {
  classes: Class[];
  isLoading?: boolean;
  /** Per-block secondary line, e.g. the educator for a section timetable. */
  getSublabel?: (cls: Class) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Copy shown when classes exist but carry no schedule times. */
  noScheduleTitle?: string;
  noScheduleDescription?: string;
  /** Rendered under the grid, e.g. a caption explaining the time window. */
  footer?: React.ReactNode;
}

/**
 * The single read-only weekly schedule surface.
 *
 * Every timetable view uses this: the educator portal, the student portal, and
 * the admin educator / student / section pages. It owns the school's operating
 * window (Mon-Sun, every slot, even where empty) as well as the loading and
 * empty states, so a schedule fix is one edit instead of per-consumer wiring
 * that can silently drift.
 *
 * The interactive slot-picking grid (ClassSchedulePicker) deliberately does NOT
 * use this - it already supplies its own window while picking.
 */
export function SchedulePanel({
  classes,
  isLoading = false,
  getSublabel,
  emptyTitle = "No classes yet",
  emptyDescription = "There are no classes to show.",
  noScheduleTitle = "No schedule yet",
  noScheduleDescription =
    "These classes don't have schedule times assigned yet.",
  footer,
}: SchedulePanelProps): React.JSX.Element {
  // Declared before any early return: hooks must run unconditionally.
  const {
    windowStartMin,
    windowEndMin,
    stepMin,
    showAllDays,
    activeWeekdays,
    blockedRanges,
  } = useScheduleWindow();

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
    <div className="space-y-2">
      <WeeklyScheduleGrid
        classes={classes}
        getSublabel={getSublabel}
        windowStartMin={windowStartMin}
        windowEndMin={windowEndMin}
        stepMin={stepMin}
        activeWeekdays={activeWeekdays}
        blockedRanges={blockedRanges}
        showAllDays={showAllDays}
      />
      {footer}
    </div>
  );
}