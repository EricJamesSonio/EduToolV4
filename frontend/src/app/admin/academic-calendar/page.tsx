// frontend/src/app/admin/academic-calendar/page.tsx
"use client";

import { useState } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi }       from "@/api/admin/school-year.api";
import { PageHeader }          from "@/components/shared/PageHeader";
import { HelpGuide }           from "@/components/shared/help-guide/HelpGuide";
import { SchoolYearSelector }  from "@/components/shared/SchoolYearSelector";
import { ProgramCalendarsTab } from "@/components/admin/academic-calendar/ProgramCalendarsTab";

export default function AcademicCalendarPage(): React.JSX.Element {
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);

  const { data: schoolYears = [], isLoading: syLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const selectedYear = schoolYears.find((sy) => sy.id === selectedSchoolYearId);

  return (
    <div className="space-y-6">
      {/* Full-width header — consistent with all other pages */}
      <PageHeader
        title="Academic Calendar"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_academic_calendar" />
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={syLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
          </div>
        }
      />

      {/* Centered content with equal side breathing room */}
      <div className="max-w-5xl mx-auto space-y-6">
        <ProgramCalendarsTab
          schoolYearId={selectedSchoolYearId ?? ""}
          schoolYearStart={selectedYear?.start_date ?? undefined}
          schoolYearEnd={selectedYear?.end_date ?? undefined}
        />
      </div>
    </div>
  );
}