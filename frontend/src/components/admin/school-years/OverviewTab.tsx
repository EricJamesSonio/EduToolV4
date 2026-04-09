import { formatDate } from "@/utils/date.util";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { SchoolYear } from "@/types/admin/school-year.types";

interface OverviewTabProps {
  schoolYear: SchoolYear;
}

export function OverviewTab({ schoolYear }: OverviewTabProps): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card divide-y">
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Title</span>
        <span className="text-sm font-medium">{schoolYear.name}</span>
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Status</span>
        <StatusBadge status={schoolYear.status} />
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Start Date</span>
        <span className="text-sm">
          {schoolYear.start_date ? formatDate(schoolYear.start_date) : "—"}
        </span>
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">End Date</span>
        <span className="text-sm">
          {schoolYear.end_date ? formatDate(schoolYear.end_date) : "—"}
        </span>
      </div>
    </div>
  );
}