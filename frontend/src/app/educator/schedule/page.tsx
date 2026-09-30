"use client";

import { useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { CalendarDays } from "lucide-react";

import { classApi } from "@/api/admin/class.api";
import { useAuthProfile } from "@/hooks/useAuthProfile";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { WeeklyScheduleGrid } from "@/components/shared/WeeklyScheduleGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleWindow } from "@/hooks/shared/useScheduleWindow";

export default function EducatorSchedulePage(): React.JSX.Element {
  const { data: profile } = useAuthProfile();
  const educatorId = profile?.id;

  // Reuse the admin classes endpoint (educator-role allowed) — it already
  // returns schedules as "HH:mm" plus subject/section names, which is exactly
  // what WeeklyScheduleGrid consumes. Schedules are only loaded for the
  // current user's own educator id.
  const { data: classes = [], isLoading } = useAsyncQuery(
    [...queryKeys.admin.classes.list({ educatorId }), "own-schedule"] as const,
    () => classApi.getAll({ educatorId }),
    { enabled: !!educatorId },
  );

  const window = useScheduleWindow();

  const hasAnySchedule = useMemo(
    () => classes.some((cls) => (cls.schedules?.length ?? 0) > 0),
    [classes],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes assigned"
          description="You have no active classes yet. Contact your administrator."
        />
      ) : !hasAnySchedule ? (
        <EmptyState
          icon={CalendarDays}
          title="No schedule yet"
          description="Your classes don't have schedule times assigned yet. Contact your administrator."
        />
      ) : (
        <WeeklyScheduleGrid
          classes={classes}
          windowStartMin={window.windowStartMin}
          windowEndMin={window.windowEndMin}
          stepMin={window.stepMin}
          showAllDays
        />
      )}
    </div>
  );
}