// frontend/src/app/admin/school-years/page.tsx

"use client";

import { useState }   from "react";
import { useQuery }   from "@tanstack/react-query";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { PageHeader }    from "@/components/shared/PageHeader";
import { EmptyState }    from "@/components/shared/EmptyState";
import { Button }        from "@/components/ui/button";
import { Skeleton }      from "@/components/ui/skeleton";
import { Plus, CalendarDays } from "lucide-react";

import { CreateSchoolYearDialog } from "@/components/admin/school-years/CreateSchoolYearDialog";
import { SchoolYearCard }         from "@/components/admin/school-years/SchoolYearCard";

// ---------------------------------------------------------------------------

export default function SchoolYearsPage(): React.JSX.Element {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: schoolYears, isLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  });

  const hasActive = schoolYears?.some((y) => y.status === "active") ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Years"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New School Year
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : !schoolYears?.length ? (
        <EmptyState
          icon={CalendarDays}
          title="No school years yet"
          description="Create your first school year to get started."
        />
      ) : (
        <div className="space-y-3">
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