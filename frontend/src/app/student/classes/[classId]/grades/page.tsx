// src/app/student/classes/[classId]/grades/page.tsx
"use client";

import { useParams } from "next/navigation";
import { BarChart2, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { useStudentGrades } from "@/hooks/student/useStudentGrades";
import type { StudentTermGrade } from "@/api/student/grade.api";

// ── Grade color helper ────────────────────────────────────────────────────────

function gradeColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  return "text-red-500";
}

// ── Term card ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, dp = 1): string {
  if (n == null) return "\u2014";
  return n.toFixed(dp);
}

function TermGradeCard({
  grade,
  index,
}: {
  grade: StudentTermGrade;
  index: number;
}) {
  const isReleased = grade.isReleased;
  const score = grade.finalScore ?? 0;
  const color = gradeColor(score);
  const termColor = WEEK_COLORS[index % WEEK_COLORS.length];

  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className={termColor + " flex items-center justify-between gap-3 px-5 py-3 border-b"}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{grade.termName}</p>
          {grade.semesterName && (
            <Badge variant="outline" className="text-[10px] bg-background/60">
              {grade.semesterName}
            </Badge>
          )}
        </div>

        {isReleased ? (
          <div className="text-right">
            <p className={cn("text-2xl font-bold tabular-nums", color)}>
              {score.toFixed(1)}%
            </p>
            {grade.finalGrade && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-semibold border-0 bg-background/60 mt-0.5",
                  color
                )}
              >
                {grade.finalGrade}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Not yet released
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Progress bar — only if released */}
        {isReleased && (
          <div className="space-y-1.5">
            <Progress value={score} className="h-2" />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Not released placeholder */}
        {!isReleased && (
          <div className="rounded-md bg-muted/50 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              Your grade will appear here once your educator computes and locks it.
            </p>
          </div>
        )}

        {/* Category breakdown */}
        {grade.categoryBreakdown?.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category Breakdown
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {grade.categoryBreakdown.map((cat, ci) => {
                const catColor = WEEK_COLORS[ci % WEEK_COLORS.length];
                return (
                  <div
                    key={cat.category}
                    className={cn("flex items-center justify-between rounded-lg border px-3 py-2", catColor)}
                  >
                    <span className="text-sm capitalize">{cat.category}</span>
                    <div className="text-right">
                        {cat.isAllExempted ? (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          Exempted
                        </Badge>
                      ) : (
                        <>
                          <span className="text-sm font-semibold tabular-nums">
                            {fmt(cat.rawAverage)}%
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            (w{fmt(cat.weightedScore)})
                          </span>
                          {cat.effectiveWeight != null && Math.abs(cat.effectiveWeight - cat.weight * 100) > 0.01 && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              redistributed: {fmt(cat.effectiveWeight, 1)}%
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TermGradeCardSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-7 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentGradesPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();

  const { data: rawData, isLoading } = useStudentGrades(classId);

  const grades: StudentTermGrade[] = Array.isArray(rawData)
    ? rawData
    : (((rawData as unknown) as Record<string, unknown>)
        ?.data as StudentTermGrade[]) ?? [];

  const releasedGrades = grades.filter((g) => g.isReleased);
  const hasAnyReleased = releasedGrades.length > 0;

  // Simple average of released scores as overall indicator
  const overallAvg =
    hasAnyReleased
      ? releasedGrades.reduce((sum, g) => sum + (g.finalScore ?? 0), 0) /
        releasedGrades.length
      : null;

  return (
    <div className="space-y-6">
      <PageHeader title="My Grades" description="View your grades and performance across terms." />

      {/* Overall summary — only if at least one term is released */}
      {!isLoading && hasAnyReleased && overallAvg !== null && (
        <div className="rounded-lg border border-border/60 bg-card px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Overall Average
            </p>
            <p className={cn("text-3xl font-bold tabular-nums mt-0.5", gradeColor(overallAvg))}>
              {overallAvg.toFixed(1)}%
            </p>
          </div>
          <div className="flex-1 max-w-xs">
            <Progress value={overallAvg} className="h-2.5" />
          </div>
        </div>
      )}

      {/* Term cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => <TermGradeCardSkeleton key={i} />)}
        </div>
      ) : grades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No grades yet</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Grades will appear here once your educator computes and releases them
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {grades.map((g, i) => (
            <TermGradeCard key={g.termId} grade={g} index={i} />
          ))}
        </div>
      )}

      {/* Note about locked grades */}
      {!isLoading && grades.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Final grades are shown only after your educator locks the grading period
        </p>
      )}
    </div>
  );
}