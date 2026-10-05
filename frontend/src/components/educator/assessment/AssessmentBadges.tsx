"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TYPE_LABELS } from "@/components/educator/assessment-builder/constants";
import type { AssessmentType } from "@/types/educator/assessment.types";

const STATUS_COLORS: Record<string, string> = {
  draft: "badge-warning",
  upcoming: "badge-info",
  open: "badge-success",
  closed: "badge-muted",
};

// Type labels come from the shared assessment-builder constants so every
// canonical type (incl. assignment/participation/behavior) renders correctly.

interface AssessmentBadgesProps {
  type: AssessmentType;
  status: string;
  isPublished: boolean;
}

export function AssessmentBadges({ type, status, isPublished }: AssessmentBadgesProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline">{TYPE_LABELS[type] ?? type}</Badge>
      <span className={cn("inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium", STATUS_COLORS[status] ?? "")}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {isPublished && (
        <span className="inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium badge-purple">
          Published
        </span>
      )}
    </div>
  );
}