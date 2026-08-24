"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AssessmentType } from "@/types/educator/assessment.types";

const STATUS_COLORS: Record<string, string> = {
  draft: "badge-warning",
  upcoming: "badge-info",
  open: "badge-success",
  closed: "badge-muted",
};

const TYPE_LABELS: Record<string, string> = {
  written_work: "Written Work",
  performance_task: "Performance Task",
  quarterly_assessment: "Quarterly Assessment",
  exam: "Exam",
  quiz: "Quiz",
  project: "Project",
  recitation: "Recitation",
  attendance: "Attendance",
  activity: "Activity",
  custom: "Custom",
  other: "Other",
};

interface AssessmentBadgesProps {
  type: AssessmentType;
  status: string;
  isPublished: boolean;
}

export function AssessmentBadges({ type, status, isPublished }: AssessmentBadgesProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline">{TYPE_LABELS[type] ?? type}</Badge>
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", STATUS_COLORS[status] ?? "")}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {isPublished && (
        <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium badge-purple">
          Published
        </span>
      )}
    </div>
  );
}