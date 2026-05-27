// ===== File: frontend/src/app/admin/school-years/page.tsx =====
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CalendarDays } from "lucide-react";
import { CreateSchoolYearDialog } from "@/components/admin/school-years/CreateSchoolYearDialog";
import { SchoolYearCard } from "@/components/admin/school-years/SchoolYearCard";

// ---------------------------------------------------------------------------

export default function SchoolYearsPage(): React.JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: schoolYears, isLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
  });

  const hasActive = schoolYears?.some((y) => y.status === "active") ?? false;

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="School Years"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_school_years" />
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New School Year
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : !schoolYears?.length ? (
        <EmptyState
          icon={CalendarDays}
          title="No school years yet"
          description="Create your first school year to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schoolYears.map((year) => (
            <SchoolYearCard key={year.id} year={year} hasActive={hasActive} />
          ))}
        </div>
      )}

      <CreateSchoolYearDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}