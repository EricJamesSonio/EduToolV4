// frontend/src/app/admin/academic-calendar/page.tsx
"use client";

import { useState } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { Globe, CalendarRange } from "lucide-react";
import { schoolYearApi }       from "@/api/admin/school-year.api";
import { PageHeader }          from "@/components/shared/PageHeader";
import { HelpGuide }           from "@/components/shared/help-guide/HelpGuide";
import { SchoolYearSelector }  from "@/components/shared/SchoolYearSelector";
import { cn }                  from "@/lib/utils";
import { HolidayBaseTab }      from "@/components/admin/academic-calendar/HolidayBaseTab";
import { ProgramCalendarsTab } from "@/components/admin/academic-calendar/ProgramCalendarsTab";

type PageTab = "holidays" | "programs";

const TABS: { key: PageTab; label: string; icon: React.ReactNode }[] = [
  { key: "holidays", label: "Holiday Base Calendar", icon: <Globe        className="h-4 w-4" /> },
  { key: "programs", label: "Program Calendars",     icon: <CalendarRange className="h-4 w-4" /> },
];

export default function AcademicCalendarPage(): React.JSX.Element {
  const [activeTab,            setActiveTab]            = useState<PageTab>("holidays");
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string | null>(null);

  const { data: schoolYears = [], isLoading: syLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const selectedYear = schoolYears.find((sy) => sy.id === selectedSchoolYearId);
  const displayYear  = selectedYear?.start_date
    ? new Date(selectedYear.start_date).getFullYear()
    : new Date().getFullYear();

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
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "holidays" && (
            <HolidayBaseTab year={displayYear} />
          )}
          {activeTab === "programs" && (
            <ProgramCalendarsTab
              schoolYearId={selectedSchoolYearId ?? ""}
              schoolYearStart={selectedYear?.start_date ?? undefined}
              schoolYearEnd={selectedYear?.end_date ?? undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}