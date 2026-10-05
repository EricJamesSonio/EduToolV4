"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";

import { classApi } from "@/api/admin/class.api";
import { useAuthProfile } from "@/hooks/useAuthProfile";

import { PageHeader } from "@/components/shared/PageHeader";
import { SchedulePanel } from "@/components/shared/SchedulePanel";

export default function EducatorSchedulePage(): React.JSX.Element {
  const { data: profile } = useAuthProfile();
  const educatorId = profile?.id;

  // Reuse the classes endpoint (educator-role allowed) - it already returns
  // schedules as "HH:mm" plus subject/section names. Scoped to this user's own
  // educator id.
  const { data: classes = [], isLoading } = useAsyncQuery(
    [...queryKeys.admin.classes.list({ educatorId }), "own-schedule"] as const,
    () => classApi.getAll({ educatorId }),
    { enabled: !!educatorId },
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" />

      <SchedulePanel
        classes={classes}
        isLoading={isLoading}
        emptyTitle="No classes assigned"
        emptyDescription="You have no active classes yet. Contact your administrator."
        noScheduleTitle="No schedule yet"
        noScheduleDescription="Your classes don't have schedule times assigned yet. Contact your administrator."
      />
    </div>
  );
}