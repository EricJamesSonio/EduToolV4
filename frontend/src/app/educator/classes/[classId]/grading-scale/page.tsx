"use client";

// frontend/src/app/educator/classes/[classId]/grading-scale/page.tsx

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, TrendingUp, TrendingDown,
  Lock, Info,
} from "lucide-react";
import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api";
import type { GradeRange } from "@/types/admin/grading-scale.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge }      from "@/components/ui/badge";
import { Skeleton }   from "@/components/ui/skeleton";
import { cn }         from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Range Row ────────────────────────────────────────────────────────────────

function RangeRow({
  range,
  index,
  total,
}: {
  range:  GradeRange;
  index:  number;
  total:  number;
}) {
  const isTop    = index === total - 1;
  const isBottom = index === 0;

  return (
    <div
      className={cn(
        "grid grid-cols-[60px_1fr_120px_100px_80px] items-center gap-4",
        "px-4 py-3 border-b last:border-0 transition-colors",
        range.isPassing
          ? "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10"
          : "hover:bg-red-50/50 dark:hover:bg-red-950/10",
      )}
    >
      {/* Grade value */}
      <div className="text-sm font-bold tabular-nums text-center">
        {range.gradeValue}
      </div>

      {/* Percent range bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
          {range.minPercent}%
        </span>
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              range.isPassing ? "bg-emerald-500" : "bg-red-400",
            )}
            style={{ width: `${range.maxPercent - range.minPercent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums w-8">
          {range.maxPercent}%
        </span>
      </div>

      {/* Remark */}
      <div className="text-sm text-muted-foreground truncate">
        {range.remark}
      </div>

      {/* Passing badge */}
      <div>
        {range.isPassing ? (
          <Badge
            variant="secondary"
            className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Passing
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="text-xs bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400"
          >
            <TrendingDown className="h-3 w-3 mr-1" />
            Failing
          </Badge>
        )}
      </div>

      {/* Indicator */}
      <div className="flex justify-end text-muted-foreground/40">
        {isTop    && <span className="text-[10px]">Highest</span>}
        {isBottom && <span className="text-[10px]">Lowest</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ classId: string }>;
}

export default function GradingScalePage({ params }: Props) {
  const { classId } = use(params);

  const { data: scale, isLoading } = useQuery({
    queryKey: ["educator", "grading-scale", classId],
    queryFn:  () => educatorGradingSchemeApi.getScaleForClass(classId),
    enabled:  !!classId,
  });

  // Sort ranges highest → lowest for display
  const sortedRanges = scale
    ? [...scale.ranges].sort((a, b) => b.minPercent - a.minPercent)
    : [];

  const passingCount = sortedRanges.filter((r) => r.isPassing).length;
  const failingCount = sortedRanges.filter((r) => !r.isPassing).length;
  const lowestPassing = sortedRanges
    .filter((r) => r.isPassing)
    .reduce<GradeRange | null>(
      (min, r) => (!min || r.minPercent < min.minPercent ? r : min),
      null,
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Grading Scale"
        description="The grading scale applied to this class's program. Set by your administrator."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : !scale ? (
        /* ── No scale configured ── */
        <div className="rounded-lg border bg-card px-6 py-12 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No grading scale configured
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Your administrator hasn't set up a grading scale for this program yet.
            Grades will use raw scores until a scale is assigned.
          </p>
        </div>
      ) : (
        <>
          {/* ── Scale header card ── */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold">{scale.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applied to this class's program
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {scale.isLocked ? (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Active</Badge>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md bg-muted/40 px-3 py-2.5 text-center">
                <p className="text-xl font-bold tabular-nums">{sortedRanges.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Grade levels</p>
              </div>
              <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 text-center">
                <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {passingCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Passing</p>
              </div>
              <div className="rounded-md bg-red-50 dark:bg-red-950/20 px-3 py-2.5 text-center">
                <p className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
                  {failingCount}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Failing</p>
              </div>
            </div>

            {/* Lowest passing */}
            {lowestPassing && (
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 px-3 py-2">
                <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Minimum passing grade:{" "}
                  <strong>{lowestPassing.gradeValue}</strong> ({lowestPassing.minPercent}% and above)
                </p>
              </div>
            )}

            {scale.isLocked && scale.lockedAt && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 px-3 py-2">
                <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This scale was locked on {formatDate(scale.lockedAt)} and cannot be changed.
                </p>
              </div>
            )}
          </div>

          {/* ── Ranges table ── */}
          <div className="rounded-lg border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[60px_1fr_120px_100px_80px] gap-4 px-4 py-2.5 border-b bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground text-center">Grade</p>
              <p className="text-xs font-semibold text-muted-foreground">Percent Range</p>
              <p className="text-xs font-semibold text-muted-foreground">Remark</p>
              <p className="text-xs font-semibold text-muted-foreground">Status</p>
              <div />
            </div>

            {/* Rows — sorted highest to lowest */}
            {sortedRanges.map((range, idx) => (
              <RangeRow
                key={`${range.gradeValue}-${range.minPercent}`}
                range={range}
                index={sortedRanges.length - 1 - idx} // original index for top/bottom label
                total={sortedRanges.length}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}