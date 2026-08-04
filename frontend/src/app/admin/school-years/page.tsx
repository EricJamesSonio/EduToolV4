// ===== File: frontend/src/app/admin/school-years/page.tsx =====
"use client";

import { useState } from "react";
import { useListQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";
import { CreateSchoolYearDialog } from "@/components/admin/school-years/CreateSchoolYearDialog";
import { SchoolYearCard } from "@/components/admin/school-years/SchoolYearCard";
import { useOrganizationGuard } from "@/context/OrganizationGuardContext";
import type { SchoolYear } from "@/types/admin/school-year.types";

// ---------------------------------------------------------------------------

export default function SchoolYearsPage(): React.JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);
  const { ensureOrganization } = useOrganizationGuard();

  const {
    data: schoolYears,
    isLoading,
    isError,
    isEmpty,
  } = useListQuery<SchoolYear[]>(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const hasActive = schoolYears.some((y) => y.status === "active");

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="School Years"
        actions={<HelpGuide slug="admin_school_years" />}
      />

      <div className="flex justify-end">
        <Button onClick={() => ensureOrganization(() => setCreateOpen(true))} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New School Year
        </Button>
      </div>

      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        empty={{
          icon: CalendarDays,
          title: "No school years yet",
          description: "Create your first school year to get started.",
          action: {
            label: "Create School Year Now",
            onClick: () => ensureOrganization(() => setCreateOpen(true)),
          },
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {schoolYears.map((year) => (
            <SchoolYearCard key={year.id} year={year} hasActive={hasActive} />
          ))}
        </div>
      </AsyncListState>

      <CreateSchoolYearDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
