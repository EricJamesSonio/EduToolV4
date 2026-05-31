// src/app/student/classes/[classId]/assessments/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { ClipboardList, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { formatDateTime } from "@/utils/date.util";
import { useStudentAssessments } from "@/hooks/student/useStudentAssessments";
import type { StudentAssessmentItem } from "@/api/student/assessment.api";

// ── Status helpers ──────────────────────────────────────────────────────────

function deriveStatus(a: StudentAssessmentItem): string {
  const now = new Date();
  if (a.submissionStatus === "submitted") return "submitted";
  if (a.submissionStatus === "graded")    return "graded";
  if (a.submissionStatus === "exempted")  return "exempted";
  if (a.releaseDate && new Date(a.releaseDate) > now) return "not_yet_open";
  if (a.endDate && new Date(a.endDate) < now)         return "missed";
  return "open";
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open:         { label: "Open",         className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  submitted:    { label: "Submitted",    className: "bg-blue-50   text-blue-700   border-blue-200"    },
  graded:       { label: "Graded",       className: "bg-violet-50 text-violet-700 border-violet-200"  },
  not_yet_open: { label: "Not Yet Open", className: "bg-slate-100 text-slate-500  border-slate-200"   },
  missed:       { label: "Missed",       className: "bg-red-50    text-red-600    border-red-200"     },
  draft:        { label: "Draft",        className: "bg-amber-50  text-amber-700  border-amber-200"   },
  exempted:     { label: "Exempted",     className: "bg-slate-100 text-slate-500  border-slate-200"   },
  not_started:  { label: "Not Started",  className: "bg-slate-100 text-slate-500  border-slate-200"   },
};

function getAction(
  status: string,
  a: StudentAssessmentItem,
  classId: string,
  router: ReturnType<typeof useRouter>
): React.ReactNode {
  if (status === "open") {
    return (
      <Button
        size="sm"
        onClick={() =>
          router.push(`/student/classes/${classId}/assessments/${a.id}`)
        }
      >
        Take Assessment
      </Button>
    );
  }
  if (status === "submitted" && a.isPublished) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          router.push(`/student/classes/${classId}/assessments/${a.id}/result`)
        }
      >
        View Result
      </Button>
    );
  }
  if (status === "graded") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          router.push(`/student/classes/${classId}/assessments/${a.id}/result`)
        }
      >
        View Result
      </Button>
    );
  }
  return null;
}

// ── Row ─────────────────────────────────────────────────────────────────────

function AssessmentRow({
  item,
  classId,
  index,
}: {
  item: StudentAssessmentItem;
  classId: string;
  index: number;
}) {
  const router = useRouter();
  const status = deriveStatus(item);
  const meta = STATUS_META[status] ?? STATUS_META["not_started"];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3">
      {/* Icon */}
      <div className="shrink-0 h-9 w-9 rounded-md bg-muted flex items-center justify-center">
        <ClipboardList className="h-4 w-4 text-muted-foreground/60" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold capitalize", WEEK_COLORS[index % WEEK_COLORS.length])}>
            {item.type.replace(/_/g, " ")}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[11px] font-medium shrink-0", meta.className)}
          >
            {meta.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {item.releaseDate && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Opens {formatDateTime(item.releaseDate)}
              </span>
            )}
            {item.endDate && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                Due {formatDateTime(item.endDate)}
            </span>
          )}
          {item.isPublished && (
            <span className="text-[11px] text-muted-foreground">
              {item.totalItems} items
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {getAction(status, item, classId, router)}
      </div>
    </div>
  );
}

function AssessmentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 px-4 py-3">
      <Skeleton className="h-9 w-9 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md shrink-0" />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function StudentAssessmentsPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();

  const { data: raw, isLoading, isError } = useStudentAssessments(classId);
  const assessments = raw ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" />

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Could not load assessments.</p>
        </div>
      )}

      {!isError && isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <AssessmentRowSkeleton key={i} />
          ))}
        </div>
      )}

      {!isError && !isLoading && assessments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No assessments yet</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Assessments will appear here once your educator publishes them
          </p>
        </div>
      )}

      {!isError && !isLoading && assessments.length > 0 && (
        <div className="space-y-2">
          {assessments.map((a, i) => (
            <AssessmentRow key={a.id} item={a} classId={classId} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}