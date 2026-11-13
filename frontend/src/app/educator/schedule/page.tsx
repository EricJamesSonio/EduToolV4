"use client";

import { useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";

import { classApi } from "@/api/admin/class.api";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useEducatorTermScope } from "@/hooks/educator/useEducatorTermScope";

import { PageHeader } from "@/components/shared/PageHeader";
import { SchedulePanel } from "@/components/shared/SchedulePanel";
import { EducatorTermFilters } from "@/components/educator/EducatorTermFilters";

export default function EducatorSchedulePage(): React.JSX.Element {
  const { data: profile } = useAuthProfile();
  const educatorId = profile?.id;
  const scope = useEducatorTermScope();

  // Reuse the classes endpoint (educator-role allowed) - it already returns
  // schedules as "HH:mm" plus subject/section names. Scoped to this user's own
  // educator id.
  const { data: classes = [], isLoading } = useAsyncQuery(
    [...queryKeys.admin.classes.list({ educatorId }), "own-schedule"] as const,
    () => classApi.getAll({ educatorId }),
    { enabled: !!educatorId },
  );

  const scopedClasses = useMemo(
    () => classes.filter((cls) => scope.scopedClassIds.has(cls.id)),
    [classes, scope.scopedClassIds],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule"
        actions={<EducatorTermFilters scope={scope} />}
      />

      <SchedulePanel
        classes={scopedClasses}
        isLoading={isLoading || scope.isLoading}
        emptyTitle="No classes assigned"
        emptyDescription="You have no active classes for the selected school year and semester."
        noScheduleTitle="No schedule yet"
        noScheduleDescription="Your classes don't have schedule times assigned yet. Contact your administrator."
      />
    </div>
  );
}