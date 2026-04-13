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
  written_work:         "bg-blue-100 text-blue-700",
  performance_task:     "bg-violet-100 text-violet-700",
  quarterly_assessment: "bg-amber-100 text-amber-700",
  exam:                 "bg-red-100 text-red-700",
  quiz:                 "bg-orange-100 text-orange-700",
  project:              "bg-green-100 text-green-700",
  recitation:           "bg-cyan-100 text-cyan-700",
  attendance:           "bg-teal-100 text-teal-700",
  activity:             "bg-lime-100 text-lime-700",
  custom:               "bg-gray-100 text-gray-700",
  manual:               "bg-gray-100 text-gray-700",
  other:                "bg-gray-100 text-gray-700",
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
                backgroundColor: `hsl(${(i * 47) % 360}, 65%, 55%)`,
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
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  TYPE_COLORS[comp.type] ?? "bg-gray-100 text-gray-700"
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
              totalWeight === 100 ? "text-emerald-600" : "text-destructive"
            }`}
          >
            Total: {totalWeight}%
          </span>
        </div>
      </div>
    </div>
  );
}