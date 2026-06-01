"use client";

import { format } from "date-fns";

interface AssessmentInfoCardProps {
  assessment: {
    weekNumber?: number | null;
    releaseDate?: string | null;
    endDate?: string | null;
    totalItems: number;
    submittedCount: number;
    termName?: string | null;
  };
}

export function AssessmentInfoCard({ assessment }: AssessmentInfoCardProps): React.JSX.Element {
  const rows = [
    { label: "Week", value: assessment.weekNumber ? `Week ${assessment.weekNumber}` : "—" },
    { label: "Term", value: assessment.termName ?? "—" },
    {
      label: "Release Date",
      value: assessment.releaseDate
        ? format(new Date(assessment.releaseDate), "MMM d, yyyy h:mm a")
        : "Immediate",
    },
    {
      label: "End Date",
      value: assessment.endDate
        ? format(new Date(assessment.endDate), "MMM d, yyyy h:mm a")
        : "No end date",
    },
    { label: "Total Items", value: String(assessment.totalItems) },
    { label: "Submitted", value: String(assessment.submittedCount) },
  ];

  return (
    <div className="rounded-lg border bg-card divide-y divide-border">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0">{row.label}</span>
          <span className="text-sm">{row.value}</span>
        </div>
      ))}
    </div>
  );
}