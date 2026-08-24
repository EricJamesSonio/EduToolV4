"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, AlertCircle } from "lucide-react";
import type { GradingScheme } from "@/types/admin/grading-scheme.types";

interface ClassGradingSchemeCardProps {
  classId: string;
  scheme: GradingScheme | null;
  isLoading: boolean;
  isArchived: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  written_work:         "Written Work",
  performance_task:     "Performance Task",
  quarterly_assessment: "Quarterly Assessment",
  exam:                 "Exam",
  quiz:                 "Quiz",
  project:              "Project",
  recitation:           "Recitation",
  attendance:           "Attendance",
  activity:             "Activity",
  custom:               "Custom",
  manual:               "Manual",
  other:                "Other",
};

const TYPE_COLORS: Record<string, string> = {
  written_work:         "bg-chart-1/15 text-[var(--chart-1)] border border-[var(--chart-1)]/20",
  performance_task:     "bg-chart-2/15 text-[var(--chart-2)] border border-[var(--chart-2)]/20",
  quarterly_assessment: "bg-chart-3/15 text-[var(--chart-3)] border border-[var(--chart-3)]/20",
  exam:                 "bg-chart-4/15 text-[var(--chart-4)] border border-[var(--chart-4)]/20",
  quiz:                 "bg-chart-5/15 text-[var(--chart-5)] border border-[var(--chart-5)]/20",
  project:              "bg-chart-6/15 text-[var(--chart-6)] border border-[var(--chart-6)]/20",
  recitation:           "bg-chart-7/15 text-[var(--chart-7)] border border-[var(--chart-7)]/20",
  attendance:           "bg-chart-8/15 text-[var(--chart-8)] border border-[var(--chart-8)]/20",
  activity:             "bg-chart-9/15 text-[var(--chart-9)] border border-[var(--chart-9)]/20",
  custom:               "bg-chart-10/15 text-[var(--chart-10)] border border-[var(--chart-10)]/20",
  manual:               "bg-chart-1/15 text-[var(--chart-1)] border border-[var(--chart-1)]/20",
  other:                "bg-chart-2/15 text-[var(--chart-2)] border border-[var(--chart-2)]/20",
};

export function ClassGradingSchemeCard({
  scheme,
  isLoading,
}: ClassGradingSchemeCardProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-4 py-6 flex items-center gap-3 text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">No grading scheme applied</p>
          <p className="text-xs mt-0.5">
            Apply a template from the Grading Schemes page to set up this class.
          </p>
        </div>
      </div>
    );
  }

  const totalWeight = scheme.components.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="rounded-lg border bg-card divide-y">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{scheme.name}</span>
          {scheme.isLocked && (
            <Badge variant="secondary" className="text-xs py-0 px-1.5">
              Locked
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {scheme.components.length} component{scheme.components.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Weight bar */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-0 h-2 rounded-full overflow-hidden w-full">
          {scheme.components.map((comp, i) => (
            <div
              key={comp.id ?? i}
              className="h-full transition-all"
              style={{
                width: `${comp.weight}%`,
                backgroundColor: `var(--chart-${(i % 10) + 1})`,
              }}
              title={`${comp.name}: ${comp.weight}%`}
            />
          ))}
        </div>

        {/* Component rows */}
        <div className="space-y-1.5 pt-1">
          {scheme.components.map((comp, i) => (
            <div key={comp.id ?? i} className="flex items-center gap-2">
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium border ${
                  TYPE_COLORS[comp.type] ?? "bg-muted text-muted-foreground border-border"
                }`}
              >
                {TYPE_LABELS[comp.type] ?? comp.type}
              </span>
              <span className="text-xs text-muted-foreground flex-1 truncate">
                {comp.name}
              </span>
              <span className="text-xs font-semibold tabular-nums">
                {comp.weight}%
              </span>
              {comp.maxScore != null && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  / {comp.maxScore}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Total weight indicator */}
        <div className="flex justify-end pt-1">
          <span
            className={`text-xs font-medium tabular-nums ${
              totalWeight === 100 ? "text-success" : "text-destructive"
            }`}
          >
            Total: {totalWeight}%
          </span>
        </div>
      </div>
    </div>
  );
}