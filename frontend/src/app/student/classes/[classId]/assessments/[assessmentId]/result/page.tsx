"use client";

import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, FileText, Lock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { useAssessmentResult, useStudentAssessment } from "@/hooks/student/useStudentAssessments";

export default function AssessmentResultPage(): React.JSX.Element {
  const { classId, assessmentId } = useParams<{
    classId: string;
    assessmentId: string;
  }>();
  const router = useRouter();

  const { data: result, isLoading: resultLoading } = useAssessmentResult(classId, assessmentId);
  const { data: rawAssessment, isLoading: assessmentLoading } = useStudentAssessment(classId, assessmentId);
  const assessment = rawAssessment as { totalItems?: number } | undefined;

  const isLoading = resultLoading || assessmentLoading;

  const isManual = result?.gradingMode === 'manual';
  const canViewScore = result?.isPublished === true;
  const scorePercent = result?.score != null && assessment?.totalItems
    ? Math.round((result.score / assessment.totalItems) * 100)
    : null;

  const gradeColor = scorePercent === null
    ? "text-muted-foreground"
    : scorePercent >= 90 ? "text-emerald-600"
    : scorePercent >= 75 ? "text-blue-600"
    : "text-red-500";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Result"
        breadcrumbs={[
          { label: "Assessments", href: `/student/classes/${classId}/assessments` },
          { label: "Result" },
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : result ? (
        <>
          {/* Score card */}
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground/60" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Result
              </h2>
            </div>

            {canViewScore && result.score != null ? (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className={cn("text-4xl font-bold tabular-nums", gradeColor)}>
                    {result.score}
                  </span>
                  <span className="text-lg text-muted-foreground mb-0.5">
                    / {assessment?.totalItems ?? "—"}
                  </span>
                  {scorePercent !== null && (
                    <span className={cn("ml-2 text-sm font-semibold mb-0.5", gradeColor)}>
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
                {isManual ? (
                  <Clock className="h-4 w-4 text-amber-500" />
                ) : result.isPublished ? (
                  <Lock className="h-4 w-4 text-muted-foreground/50" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <p className="text-sm text-muted-foreground">
                  {isManual
                    ? "Your educator will review your response and assign a score."
                    : result.isPublished
                    ? "Score not yet published by your educator"
                    : "Assessment submitted"}
                </p>
              </div>
            )}

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
                    month: "short", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              )}
              {result.isPublished && (
                <span className="text-[11px] text-emerald-600 font-medium">Published</span>
              )}
            </div>

            {result.isPublished && result.score == null && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Pending manual grading</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your educator will review essay answers and release your score.
                  </p>
                </div>
              </div>
            )}

            {result.isPublished && result.score != null && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-800">Your score has been officially recorded.</p>
              </div>
            )}
          </div>

          {/* Full review — always for manual, only if published for system/hybrid */}
          {(isManual || canViewScore) && result.questions && result.questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground/60" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {isManual ? 'Your Response' : 'Review'}
                </h2>
              </div>
              {result.questions.map((q, i) => {
                const isCorrect = q.isCorrect === true;
                const isWrong = q.isCorrect === false;
                const isManualQuestion = q.type === 'manual' || q.isManual === true;
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "rounded-xl border bg-card p-6 space-y-4",
                      isManualQuestion ? "border-l-4 border-l-blue-400 bg-blue-50/20" : isCorrect ? "border-emerald-200" : isWrong ? "border-red-200" : "border-border/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isManualQuestion ? (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">✏️</span>
                          ) : (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {i + 1}
                            </span>
                          )}
                          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {isManualQuestion ? 'Manual' : q.type?.replace(/_/g, " ")}
                          </span>
                          {!isManualQuestion && isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          {!isManualQuestion && isWrong && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                        </div>
                        <p className={cn("text-base text-foreground leading-relaxed pt-1", isManualQuestion && "font-medium")}>
                          {q.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Student answer */}
                    <div className="text-sm space-y-1.5">
                      <p className="text-xs text-muted-foreground font-medium">Your answer:</p>
                      <p className={cn(
                        "rounded-md px-4 py-3 border text-sm whitespace-pre-wrap",
                        isManualQuestion ? "bg-white border-blue-200 text-foreground" : isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : isWrong ? "bg-red-50 border-red-200 text-red-800" : "bg-muted border-border"
                      )}>
                        {q.studentAnswer || "(no answer)"}
                      </p>
                    </div>

                    {/* Correct answer (only if wrong or different) */}
                    {!isManualQuestion && isWrong && q.correctAnswer && (
                      <div className="text-sm space-y-1.5">
                        <p className="text-xs text-emerald-600 font-medium">Correct answer:</p>
                        <p className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800">
                          {q.correctAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-4">No result found.</p>
      )}
    </div>
  );
}
