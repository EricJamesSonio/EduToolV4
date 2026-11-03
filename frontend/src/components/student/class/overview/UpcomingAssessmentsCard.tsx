import { ClipboardList, ChevronRight, Clock } from "lucide-react";
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
  onOpenAssessment?: (assessmentId: string) => void;
}

type Phase = "pending" | "upcoming" | "missed" | "done";

interface PhasedItem {
  item: StudentAssessmentItem;
  phase: Phase;
}

const MAX_ROWS = 5;
const DONE_STATUSES = ["submitted", "graded", "exempted"];

function toTime(value?: string | null): number | null {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function getPhase(a: StudentAssessmentItem): Phase {
  if (DONE_STATUSES.includes(a.submissionStatus)) return "done";

  const now = Date.now();
  const release = toTime(a.releaseDate);
  const end = toTime(a.endDate);
  const reopened = toTime(a.reopenedUntil);

  if (release !== null && now < release) return "upcoming";
  if (reopened !== null && now <= reopened) return "pending";
  if (end !== null && now > end) return "missed";
  return "pending";
}

function sortKey(entry: PhasedItem): number {
  const key =
    entry.phase === "upcoming"
      ? toTime(entry.item.releaseDate)
      : toTime(entry.item.endDate);
  return key ?? Number.MAX_SAFE_INTEGER;
}

const PHASE_ORDER: Record<Phase, number> = {
  pending: 0,
  upcoming: 1,
  missed: 2,
  done: 3,
};

function badgeLabel(entry: PhasedItem): string {
  const { item, phase } = entry;
  if (phase === "missed") return "Missed";
  if (phase === "upcoming") {
    return item.releaseDate ? `Opens ${formatDate(item.releaseDate)}` : "Upcoming";
  }
  return item.submissionStatus === "draft" ? "In progress" : "To do";
}

function badgeStyle(phase: Phase): string {
  if (phase === "missed") return "bg-destructive/10 text-destructive";
  if (phase === "upcoming") return "badge-muted";
  return "badge-info";
}

export function UpcomingAssessmentsCard({
  assessments,
  isLoading,
  onViewAll,
  onOpenAssessment,
}: UpcomingAssessmentsCardProps): React.JSX.Element {
  const phased: PhasedItem[] = assessments
    .map((item) => ({ item, phase: getPhase(item) }))
    .filter((entry) => entry.phase !== "done")
    .sort((a, b) => {
      if (a.phase !== b.phase) return PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase];
      return sortKey(a) - sortKey(b);
    });

  const pendingCount = phased.filter((e) => e.phase === "pending").length;
  const missedCount = phased.filter((e) => e.phase === "missed").length;
  const display = phased.slice(0, MAX_ROWS);

  const summaryParts: string[] = [];
  if (pendingCount > 0) summaryParts.push(`${pendingCount} to do`);
  if (missedCount > 0) summaryParts.push(`${missedCount} missed`);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[4])}>
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">Pending Assessments</h3>
            {!isLoading && summaryParts.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {summaryParts.join(" · ")}
              </p>
            )}
          </div>
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

      <div className="space-y-2">
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
            <p className="text-sm text-muted-foreground">
              {assessments.length === 0
                ? "No assessments yet"
                : "You're all caught up"}
            </p>
          </div>
        )}

        {!isLoading &&
          display.map((entry, i) => (
            <AssessmentRow
              key={entry.item.id}
              entry={entry}
              index={i}
              onOpen={
                entry.phase === "pending" && onOpenAssessment
                  ? () => onOpenAssessment(entry.item.id)
                  : undefined
              }
            />
          ))}
      </div>
    </div>
  );
}

function AssessmentRow({
  entry,
  index,
  onOpen,
}: {
  entry: PhasedItem;
  index: number;
  onOpen?: () => void;
}): React.JSX.Element {
  const { item, phase } = entry;

  const content = (
    <>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">
          {item.title ?? item.type.replace(/_/g, " ")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
              WEEK_COLORS[index % WEEK_COLORS.length],
            )}
          >
            {item.type.replace(/_/g, " ")}
          </span>
          {item.endDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground">
                Due {formatDate(item.endDate)}
              </span>
            </span>
          )}
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 text-[11px] font-medium",
          badgeStyle(phase),
        )}
      >
        {badgeLabel(entry)}
      </Badge>
    </>
  );

  const baseClass =
    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left";

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          baseClass,
          "transition-colors hover:border-primary/40 hover:bg-muted/40",
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

function AssessmentRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}