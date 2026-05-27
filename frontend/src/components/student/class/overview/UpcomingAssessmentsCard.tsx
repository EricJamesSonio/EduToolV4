import { ClipboardList, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { formatDate } from "@/utils/date.util";
import type { StudentAssessmentItem } from "@/api/student/assessment.api";

interface UpcomingAssessmentsCardProps {
  classId: string;
  assessments: StudentAssessmentItem[];
  isLoading: boolean;
  onViewAll: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600 border-slate-200",
  submitted:   "bg-blue-50   text-blue-700  border-blue-200",
  graded:      "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  submitted:   "Submitted",
  graded:      "Graded",
};

export function UpcomingAssessmentsCard({
  assessments,
  isLoading,
  onViewAll,
}: UpcomingAssessmentsCardProps): React.JSX.Element {
  const upcoming = assessments
    .filter((a) => a.isPublished && a.submissionStatus !== "graded")
    .slice(0, 3);

  const display = upcoming.length > 0 ? upcoming : assessments.slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className={cn("inline-block rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider", WEEK_COLORS[4])}>
          Upcoming Assessments
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

      <CardContent className="space-y-2">
        {isLoading && (
          <>
            <AssessmentRowSkeleton />
            <AssessmentRowSkeleton />
            <AssessmentRowSkeleton />
          </>
        )}

        {!isLoading && display.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No assessments yet</p>
          </div>
        )}

        {!isLoading &&
          display.map((a, i) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <span className={cn("inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize", WEEK_COLORS[i % WEEK_COLORS.length])}>
                  {a.type.replace(/_/g, " ")}
                </span>
                {a.endDate && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                    <p className="text-[11px] text-muted-foreground">
                      Due {formatDate(a.endDate)}
                    </p>
                  </div>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-[11px] font-medium capitalize",
                  STATUS_STYLES[a.submissionStatus] ??
                    "bg-muted text-muted-foreground"
                )}
              >
                {STATUS_LABELS[a.submissionStatus] ?? a.submissionStatus}
              </Badge>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

function AssessmentRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}
