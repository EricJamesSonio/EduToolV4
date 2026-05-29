import { BarChart2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import type { StudentTermGrade } from "@/api/student/grade.api";

interface GradeSummaryCardProps {
  grades: StudentTermGrade[];
  isLoading: boolean;
  onViewAll: () => void;
}

export function GradeSummaryCard({
  grades,
  isLoading,
  onViewAll,
}: GradeSummaryCardProps): React.JSX.Element {
  const released = grades.filter((g) => g.isReleased);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[5])}>
            <BarChart2 className="h-4 w-4" />
          </div>
          <h3 className="font-semibold">Grade Summary</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={onViewAll}
        >
          View all
          <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <>
            <GradeRowSkeleton />
            <GradeRowSkeleton />
          </>
        )}

        {!isLoading && released.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <BarChart2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              No grades published yet
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              Grades will appear here once your educator releases them
            </p>
          </div>
        )}

        {!isLoading &&
          released.map((g, i) => (
            <GradeRow key={g.termId} grade={g} index={i} />
          ))}
      </div>
    </div>
  );
}

function GradeRow({ grade, index }: { grade: StudentTermGrade; index: number }) {
  const score = grade.finalScore ?? 0;
  const hasGrade = grade.finalGrade !== null;

  const gradeColor =
    score >= 90
      ? "text-emerald-600"
      : score >= 75
        ? "text-blue-600"
        : "text-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-block rounded-sm px-1.5 py-0.5 text-xs font-semibold", WEEK_COLORS[(index + 6) % WEEK_COLORS.length])}>
            Term {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasGrade && (
            <Badge
              variant="outline"
              className="text-[11px] font-semibold border-0 bg-muted"
            >
              {grade.finalGrade}
            </Badge>
          )}
          <span className={cn("text-sm font-bold tabular-nums", gradeColor)}>
            {score.toFixed(1)}%
          </span>
        </div>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}

function GradeRowSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
    </div>
  );
}
