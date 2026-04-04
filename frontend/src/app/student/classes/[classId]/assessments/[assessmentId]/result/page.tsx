// src/app/student/classes/[classId]/assessments/[assessmentId]/result/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAssessmentResult, useStudentAssessment } from "@/hooks/student/useStudentAssessments";

export default function AssessmentResultPage(): React.JSX.Element {
  const { classId, assessmentId } = useParams<{
    classId: string;
    assessmentId: string;
  }>();
  const router = useRouter();

  const { data: rawResult, isLoading: resultLoading } = useAssessmentResult(
    classId,
    assessmentId
  );
  const { data: rawAssessment, isLoading: assessmentLoading } =
    useStudentAssessment(classId, assessmentId);

  const result = (rawResult as any)?.data ?? rawResult;
  const assessment = (rawAssessment as any)?.data ?? rawAssessment;

  const isLoading = resultLoading || assessmentLoading;

  const scorePercent =
    result?.score !== null && assessment?.totalItems
      ? Math.round((result.score / assessment.totalItems) * 100)
      : null;

  const gradeColor =
    scorePercent === null
      ? "text-muted-foreground"
      : scorePercent >= 90
      ? "text-emerald-600"
      : scorePercent >= 75
      ? "text-blue-600"
      : "text-red-500";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1"
        onClick={() =>
          router.push(`/student/classes/${classId}/assessments`)
        }
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Assessments
      </Button>

      {/* Score card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground/60" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Result
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : result ? (
          <>
            {/* Score display */}
            {result.score !== null ? (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className={cn("text-4xl font-bold tabular-nums", gradeColor)}>
                    {result.score}
                  </span>
                  <span className="text-lg text-muted-foreground mb-0.5">
                    / {assessment?.totalItems ?? "—"}
                  </span>
                  {scorePercent !== null && (
                    <span
                      className={cn(
                        "ml-2 text-sm font-semibold mb-0.5",
                        gradeColor
                      )}
                    >
                      ({scorePercent}%)
                    </span>
                  )}
                </div>
                {scorePercent !== null && (
                  <Progress value={scorePercent} className="h-2" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-4">
                <Lock className="h-4 w-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Score not yet published by your educator
                </p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-medium capitalize",
                  result.status === "submitted"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : result.status === "graded"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {result.status}
              </Badge>
              {result.submittedAt && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Submitted{" "}
                  {new Date(result.submittedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            {/* Essay pending notice */}
            {result.status === "submitted" && result.score === null && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Pending manual grading
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your educator will review essay answers and release your score.
                  </p>
                </div>
              </div>
            )}

            {/* Published confirmation */}
            {result.isPublished && result.score !== null && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-800">
                  Your score has been officially recorded.
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No result found for this assessment.
          </p>
        )}
      </div>
    </div>
  );
}