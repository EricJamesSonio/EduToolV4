// src/app/student/classes/[classId]/assessments/[assessmentId]/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Flag, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useStudentAssessment } from "@/hooks/student/useStudentAssessments";
import {
  useStartSubmission,
  useSaveDraft,
  useFinishSubmission,
} from "@/hooks/student/useSubmission";
import type { StudentAssessmentDetail } from "@/api/student/assessment.api";

// ── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  questionText: string;
  type: string;
  choices?: string[];
}

// ── Timer ────────────────────────────────────────────────────────────────────

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

// ── Answer inputs ─────────────────────────────────────────────────────────────

function MCQInput({
  choices,
  value,
  onChange,
}: {
  choices: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {choices.map((choice, i) => {
        const label = String.fromCharCode(65 + i);
        const selected = value === choice;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(choice)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-sm text-left transition-colors",
              selected
                ? "border-primary bg-primary/5 text-foreground font-medium"
                : "border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground"
              )}
            >
              {label}
            </span>
            {choice}
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-3">
      {["True", "False"].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
            value === opt
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border/60 hover:border-border text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function EnumerationInput({
  count,
  value,
  onChange,
}: {
  count: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const items: string[] = value
    ? value.split("||")
    : Array(count).fill("");

  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next.join("||"));
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">
            {i + 1}.
          </span>
          <Input
            value={items[i] ?? ""}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Item ${i + 1}`}
            className="text-sm"
          />
        </div>
      ))}
    </div>
  );
}

// ── Question navigator ────────────────────────────────────────────────────────

function QuestionNav({
  total,
  current,
  answers,
  flagged,
  onSelect,
}: {
  total: number;
  current: number;
  answers: Record<string, string>;
  flagged: Set<string>;
  questions: Question[];
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === current;
        const isAnswered = !!Object.values(answers)[i];
        const isFlagged = Array.from(flagged)[i];
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              "h-8 w-8 rounded-md text-xs font-semibold transition-colors border",
              isCurrent
                ? "bg-primary text-primary-foreground border-primary"
                : isAnswered
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-muted text-muted-foreground border-border/60 hover:border-border",
              isFlagged && !isCurrent && "border-amber-400 bg-amber-50 text-amber-700"
            )}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

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
  const questions: Question[] =
    (assessment?.questions as Question[] | undefined) ?? [];

  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [showConfirm, setShowConfirm] = useState(false);
  const [started, setStarted] = useState(false);

  const timeLeft = useCountdown(assessment?.endDate);

  const { mutate: startSubmission } = useStartSubmission();
  const { mutate: saveDraft } = useSaveDraft();
  const { mutate: finish } = useFinishSubmission();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start / resume attempt on load
  useEffect(() => {
    if (!assessment || assessment.locked || started) return;
    setStarted(true);
    startSubmission(assessmentId, {
      onSuccess: (res) => {
        setSubmissionId(res.id);
        // Restore saved answers
        const restored: Record<string, string> = {};
        for (const a of res.answers ?? []) {
          restored[a.questionId] = a.answer;
        }
        setAnswers(restored);
      },
    });
  }, [assessment, assessmentId, started, startSubmission]);

  // Auto-save debounced
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

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
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

  const unanswered = questions.filter((q) => !answers[q.id]).length;
  const currentQuestion = questions[currentIndex];

  // ── Locked / not released ──
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
      <div className="space-y-5 max-w-3xl mx-auto">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() =>
              router.push(`/student/classes/${classId}/assessments`)
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold capitalize">
            {assessment.type?.replace(/_/g, " ")}
          </h1>
        </div>
        {assessment.endDate && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            {timeLeft}
          </div>
        )}
      </div>

      {/* Question navigator */}
      <div className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Question Navigator
        </p>
        <QuestionNav
          total={questions.length}
          current={currentIndex}
          answers={answers}
          flagged={flagged}
          questions={questions}
          onSelect={setCurrentIndex}
        />
        <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-200 inline-block" />
            Answered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-50 border border-amber-400 inline-block" />
            Flagged
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-muted border border-border inline-block" />
            Unanswered
          </span>
        </div>
      </div>

      {/* Question area */}
      {currentQuestion && (
        <div className="rounded-lg border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleFlag(currentQuestion.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors",
                flagged.has(currentQuestion.id)
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-border/60 text-muted-foreground hover:border-border"
              )}
            >
              <Flag className="h-3 w-3" />
              {flagged.has(currentQuestion.id) ? "Flagged" : "Flag"}
            </button>
          </div>

          {/* Answer input */}
          <div>
            {currentQuestion.type === "multiple_choice" && (
              <MCQInput
                choices={currentQuestion.choices ?? []}
                value={answers[currentQuestion.id] ?? ""}
                onChange={(v) => setAnswer(currentQuestion.id, v)}
              />
            )}
            {currentQuestion.type === "true_or_false" && (
              <TrueFalseInput
                value={answers[currentQuestion.id] ?? ""}
                onChange={(v) => setAnswer(currentQuestion.id, v)}
              />
            )}
            {currentQuestion.type === "identification" && (
              <Input
                value={answers[currentQuestion.id] ?? ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                placeholder="Type your answer..."
                className="text-sm"
              />
            )}
            {currentQuestion.type === "enumeration" && (
              <EnumerationInput
                count={assessment.totalItems}
                value={answers[currentQuestion.id] ?? ""}
                onChange={(v) => setAnswer(currentQuestion.id, v)}
              />
            )}
            {currentQuestion.type === "essay" && (
              <Textarea
                value={answers[currentQuestion.id] ?? ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                placeholder="Write your answer here..."
                className="min-h-[140px] text-sm resize-none"
              />
            )}
          </div>

          {/* Auto-save indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {saveStatus === "saving" && <span>Saving...</span>}
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>All answers saved</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation + Submit */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Previous
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowConfirm(true)}
        >
          Submit Assessment
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="gap-1.5"
        >
          Next <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Confirm submit dialog */}
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Submit Assessment"
        description={
          unanswered > 0
            ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`
            : "Are you sure you want to submit? You cannot change your answers after submitting."
        }
        confirmLabel="Submit"
        onConfirm={handleSubmit}
      />
    </div>
  );
}