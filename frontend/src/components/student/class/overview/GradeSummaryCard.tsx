// frontend/src/components/student/class/overview/GradeSummaryCard.tsx
import { BarChart2, ChevronRight, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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
  // Only show released grades
  const released = grades.filter((g) => g.isReleased);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Grade Summary
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={onViewAll}
        >
          View all
          <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
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
          released.map((g) => (
            <GradeRow key={g.termId} grade={g} />
          ))}
      </CardContent>
    </Card>
  );
}

function GradeRow({ grade }: { grade: StudentTermGrade }): React.JSX.Element {
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
          <Lock className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-sm font-medium text-foreground">
            Term {grade.termId.slice(-4)}
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