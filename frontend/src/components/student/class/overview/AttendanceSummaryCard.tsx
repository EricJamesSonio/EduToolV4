import { CalendarCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import type { AttendanceSummary } from "@/api/student/attendance.api";

interface AttendanceSummaryCardProps {
  summary: AttendanceSummary | undefined;
  isLoading: boolean;
  onViewAll: () => void;
}

interface StatItem {
  label: string;
  value: number;
  color: string;
}

export function AttendanceSummaryCard({
  summary,
  isLoading,
  onViewAll,
}: AttendanceSummaryCardProps): React.JSX.Element {
  const recorded = summary ? summary.total - summary.unrecorded : 0;
  const attended = summary ? summary.present + summary.late : 0;
  const rate = recorded > 0 ? (attended / recorded) * 100 : 0;

  const stats: StatItem[] = summary
    ? [
        { label: "Present", value: summary.present, color: "text-success" },
        { label: "Late", value: summary.late, color: "text-info" },
        { label: "Absent", value: summary.absent, color: "text-destructive" },
        { label: "Excused", value: summary.excused, color: "text-muted-foreground" },
      ]
    : [];

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[2])}>
            <CalendarCheck className="h-4 w-4" />
          </div>
          <h3 className="font-semibold">Attendance</h3>
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

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!isLoading && (!summary || recorded === 0) && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">
            No attendance recorded yet
          </p>
        </div>
      )}

      {!isLoading && summary && recorded > 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Attendance rate
              </span>
              <span className="text-sm font-bold tabular-nums">
                {rate.toFixed(1)}%
              </span>
            </div>
            <Progress value={rate} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">
              {attended} of {recorded} recorded sessions attended
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border px-2 py-2 text-center"
              >
                <p className={cn("text-base font-bold tabular-nums", s.color)}>
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}