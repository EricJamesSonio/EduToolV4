"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, CheckCircle2, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { formatDateTime } from "@/utils/date.util";
import { useStudentAssessment } from "@/hooks/student/useStudentAssessments";
import {
  useStartSubmission,
  useSaveDraft,
  useFinishSubmission,
} from "@/hooks/student/useSubmission";
import type { StudentAssessmentDetail } from "@/api/student/assessment.api";

function useCountdown(endDate?: string) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Time's up"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ""}${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return timeLeft;
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    multiple_choice: "Multiple Choice",
    true_false: "True or False",
    true_or_false: "True or False",
    identification: "Identification",
    enumeration: "Enumeration",
    essay: "Essay",
  };
  return map[type] ?? type;
}

export default function AssessmentTakerPage(): React.JSX.Element {
  const { classId, assessmentId } = useParams<{
    classId: string;
    assessmentId: string;
  }>();
  const router = useRouter();

  const { data: rawAssessment, isLoading } = useStudentAssessment(
    classId,
    assessmentId
  );

  const assessment = rawAssessment as StudentAssessmentDetail | undefined;
  const questions = assessment?.questions ?? [];

  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [showConfirm, setShowConfirm] = useState(false);
  const [started, setStarted] = useState(false);

  const timeLeft = useCountdown(assessment?.endDate);
  const isManual = assessment?.gradingMode === 'manual';

  const { mutate: startSubmission } = useStartSubmission();
  const { mutate: saveDraft } = useSaveDraft();
  const { mutate: finish } = useFinishSubmission();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!assessment || assessment.locked || started) return;
    setStarted(true);
    startSubmission(assessmentId, {
      onSuccess: (res) => {
        setSubmissionId(res.id);
        const restored: Record<string, string> = {};
        for (const a of res.answers ?? []) {
          restored[a.questionId] = a.answer;
        }
        setAnswers(restored);
      },
    });
  }, [assessment, assessmentId, started, startSubmission]);

  const triggerSave = useCallback(
    (currentAnswers: Record<string, string>) => {
      if (!submissionId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus("saving");
      saveTimer.current = setTimeout(() => {
        saveDraft(
          {
            assessmentId,
            answers: Object.entries(currentAnswers).map(([questionId, answer]) => ({
              questionId,
              answer,
            })),
          },
          { onSuccess: () => setSaveStatus("saved") }
        );
      }, 1000);
    },
    [assessmentId, saveDraft, submissionId]
  );

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      triggerSave(next);
      return next;
    });
  };

  const handleSubmit = () => {
    finish(
      {
        assessmentId,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
      },
      {
        onSuccess: () => {
          router.push(
            `/student/classes/${classId}/assessments/${assessmentId}/result`
          );
        },
      }
    );
  };

  const answeredCount = questions.filter((q) => answers[q.id]).length;

  if (!isLoading && assessment?.locked) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <Clock className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">
          This assessment is not yet available
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/student/classes/${classId}/assessments`)}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
        </Button>
      </div>
    );
  }

  if (isLoading || !assessment) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const colorIdx = assessmentId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isManual ? "Instructions" : (assessment.type?.replace(/_/g, " ") ?? "Assessment")}
        breadcrumbs={[
          { label: "Assessments", href: `/student/classes/${classId}/assessments` },
          { label: isManual ? "Instructions" : (assessment.type?.replace(/_/g, " ") ?? "Assessment") },
        ]}
      />

      {/* Info card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[colorIdx % WEEK_COLORS.length])}>
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold capitalize">{assessment.type?.replace(/_/g, " ")}</h2>
            <div className="flex items-center gap-3 flex-wrap mt-1">
              {assessment.releaseDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Released {formatDateTime(assessment.releaseDate)}
                </span>
              )}
              {assessment.endDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Due {formatDateTime(assessment.endDate)}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{assessment.totalItems} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky progress bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/60 pb-3 pt-2 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{answeredCount} of {questions.length} answered</span>
            {saveStatus === "saving" && <span className="italic">Saving...</span>}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {assessment.endDate && (
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {timeLeft}
              </div>
            )}
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowConfirm(true)}
              className="gap-1.5 text-xs h-8"
            >
              <Send className="h-3.5 w-3.5" />
              Submit
            </Button>
          </div>
        </div>
        <Progress value={questions.length ? (answeredCount / questions.length) * 100 : 0} className="h-1.5" />
      </div>

      {/* Question list */}
      <div className="space-y-4 pb-20">
        {questions.map((q, i) => {
          const isAnswered = !!answers[q.id];
          const isManualQuestion = isManual && i === 0;
          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={cn(
                "rounded-xl border bg-card p-5 space-y-4 transition-shadow",
                isManualQuestion
                  ? "border-l-4 border-l-blue-400"
                  : isAnswered
                  ? "border-emerald-200/60 shadow-sm"
                  : "border-border/60"
              )}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isManualQuestion ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        <span>✏️</span>
                      </span>
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                    )}
                    <span className={cn("text-[11px] font-medium uppercase tracking-wider", isManualQuestion ? "text-blue-700" : "text-muted-foreground")}>
                      {isManualQuestion ? 'Instructions' : typeLabel(q.type)}
                    </span>
                    {isAnswered && !isManualQuestion && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
                    )}
                  </div>
                  <p className={cn("text-sm leading-relaxed pt-1", isManualQuestion ? "text-foreground font-medium whitespace-pre-wrap" : "text-foreground")}>
                    {q.questionText}
                  </p>
                  {isManualQuestion && (
                    <p className="text-xs text-muted-foreground pt-2">
                      Write your response below and submit when finished.
                    </p>
                  )}
                </div>
              </div>

              {/* Answer input */}
              <div>
                {isManualQuestion && (
                  <Textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Type your response here..."
                    className="min-h-[160px] text-sm resize-none bg-muted"
                  />
                )}

                {!isManual && q.type === "multiple_choice" && (
                  <RadioGroup
                    value={answers[q.id] ?? ""}
                    onValueChange={(v) => setAnswer(q.id, v)}
                    className="space-y-1.5"
                  >
                    {(q.choices ?? []).map((choice, ci) => {
                      const label = String.fromCharCode(65 + ci);
                      return (
                        <label
                          key={ci}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-accent/30",
                            answers[q.id] === choice
                              ? "border-primary bg-primary/5"
                              : "border-border/60"
                          )}
                        >
                          <RadioGroupItem value={choice} id={`${q.id}-${ci}`} />
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold border-muted-foreground/30 text-muted-foreground">
                            {label}
                          </span>
                          <span>{choice}</span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}

                {!isManual && (q.type === "true_or_false" || q.type === "true_false") && (
                  <RadioGroup
                    value={answers[q.id] ?? ""}
                    onValueChange={(v) => setAnswer(q.id, v)}
                    className="flex gap-3"
                  >
                    {["True", "False"].map((opt) => (
                      <label
                        key={opt}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer transition-colors hover:bg-accent/30",
                          answers[q.id] === opt
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border/60 text-muted-foreground"
                        )}
                      >
                        <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                        {opt}
                      </label>
                    ))}
                  </RadioGroup>
                )}

                {!isManual && q.type === "identification" && (
                  <Input
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Type your answer..."
                    className="text-sm"
                  />
                )}

                {!isManual && q.type === "enumeration" && (
                  <div className="space-y-2">
                    {(answers[q.id]?.split("||") ?? Array(assessment.totalItems).fill("")).map((item, ei) => (
                      <div key={ei} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground w-5 shrink-0 text-right">
                          {ei + 1}.
                        </span>
                        <Input
                          value={item}
                          onChange={(e) => {
                            const items = answers[q.id]?.split("||") ?? Array(assessment.totalItems).fill("");
                            items[ei] = e.target.value;
                            setAnswer(q.id, items.join("||"));
                          }}
                          placeholder={`Item ${ei + 1}`}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {!isManual && (q.type === "essay" || q.type === "manual") && (
                  <Textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Write your answer here..."
                    className="min-h-[120px] text-sm resize-none"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom submit */}
      <div className="sticky bottom-0 bg-background border-t border-border/60 py-3 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {answeredCount} of {questions.length} answered
        </span>
        <Button
          size="default"
          onClick={() => setShowConfirm(true)}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Submit Assessment
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Submit Assessment"
        message={
          answeredCount < questions.length
            ? `You have ${questions.length - answeredCount} unanswered question${questions.length - answeredCount > 1 ? "s" : ""}. Submit anyway?`
            : "Are you sure you want to submit? You cannot change your answers after submitting."
        }
        confirmLabel="Submit"
        destructive
        onConfirm={handleSubmit}
      />
    </div>
  );
}
