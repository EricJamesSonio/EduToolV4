"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  useAssessment,
  useAssessmentSubmissions,
} from "@/hooks/educator/useAssessments";
import { useSubmissionAnswers, useGradeEssay } from "@/hooks/educator/useSubmissions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, Check, X } from "lucide-react";
import type { SubmissionAnswerDetail } from "@/api/educator/submission.api";

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    multiple_choice: "Multiple Choice", true_or_false: "True or False",
    identification: "Identification", enumeration: "Enumeration",
    essay: "Essay", manual: "Manual (Educator-Written)",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;
  const submissionId = params.submissionId as string;

  const { data: assessment } = useAssessment(classId, assessmentId);
  const { data: submissions } = useAssessmentSubmissions(classId, assessmentId);
  const { data: answers, isLoading: answersLoading } = useSubmissionAnswers(assessmentId, submissionId);
  const { mutateAsync: gradeEssay, isPending: isGrading } = useGradeEssay(classId, assessmentId);

  const submission = submissions?.find((s) => s.id === submissionId);
  const [manualScore, setManualScore] = useState(submission?.manualSectionScore ?? 0);

  const hasManualQuestions = answers?.some((a) => a.question.type === 'manual');
  const manualMax = assessment?.manualMaxScore ?? submission?.totalPoints ?? 0;

  async function handleSave() {
    if (!submission) return;
    try {
      await gradeEssay({ submissionId: submission.id, score: manualScore });
      toast.success("Manual score saved.");
      router.back();
    } catch {
      toast.error("Failed to save score.");
    }
  }

  if (!submission) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-muted-foreground">
        {!submissions ? <><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading submission...</> : "Submission not found."}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/educator/classes/${classId}/assessments`} className="hover:text-foreground">Assessments</Link>
        <span>/</span>
        <Link href={`/educator/classes/${classId}/assessments/${assessmentId}`} className="hover:text-foreground">{assessment?.title ?? "..."}</Link>
        <span>/</span>
        <Link href={`/educator/classes/${classId}/assessments/${assessmentId}/submissions`} className="hover:text-foreground">Submissions</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Review</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Submission Review — {submission.studentName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {submission.submittedAt
              ? `Submitted ${new Date(submission.submittedAt).toLocaleString()}`
              : "Not yet submitted"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      {/* Score summary */}
      <div className="flex items-center gap-6 flex-wrap text-sm border rounded-lg px-5 py-3 bg-muted/20">
        <div>
          <span className="text-muted-foreground">System: </span>
          <span className="font-semibold">{submission.systemSectionScore ?? submission.score ?? "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Manual: </span>
          <span className="font-semibold">
            {submission.manualSectionScore != null ? submission.manualSectionScore : "Pending"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold">
            {submission.score != null ? `${submission.score} / ${submission.totalPoints}` : "—"}
          </span>
        </div>
      </div>

      {/* Q&A */}
      {answersLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading answers...
        </div>
      ) : !answers?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No answers submitted.</p>
      ) : (
        <div className="space-y-4">
          {answers.map((a, i) => (
            <AnswerCard key={a.question.id} answer={a} index={i}
              manualScore={manualScore} setManualScore={setManualScore}
              manualMax={manualMax} />
          ))}
        </div>
      )}

      {/* Save button */}
      {hasManualQuestions && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => router.back()}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={isGrading || answersLoading}>
            {isGrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Manual Score
          </Button>
        </div>
      )}
    </div>
  );
}

function AnswerCard({
  answer, index, manualScore, setManualScore, manualMax,
}: {
  answer: SubmissionAnswerDetail; index: number;
  manualScore: number; setManualScore: (v: number) => void;
  manualMax: number;
}) {
  const isManual = answer.question.type === 'manual';

  return (
    <div className={cn(
      "rounded-lg border p-5 space-y-3",
      isManual && "border-l-4 border-l-amber-400 bg-amber-50/10"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Item {index + 1} — {typeLabel(answer.question.type)}
          </span>
          {isManual && (
            <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Manual
            </span>
          )}
        </div>
      </div>

      {/* Question text */}
      <p className="text-sm font-medium">{answer.question.questionText}</p>

      {/* Choices (for MC) */}
      {answer.question.choices && answer.question.choices.length > 0 && (
        <div className="space-y-1">
          {answer.question.choices.map((choice, ci) => {
            const label = String.fromCharCode(65 + ci); // A, B, C, D
            const isCorrect = choice === answer.question.correctAnswer;
            const isSelected = choice === answer.answer;
            return (
              <div key={ci} className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm border",
                isCorrect && "border-green-300 bg-green-50",
                isSelected && !isCorrect && "border-red-300 bg-red-50"
              )}>
                <span className="font-mono text-xs font-bold w-5">{label}.</span>
                <span className="flex-1">{choice}</span>
                {isCorrect && <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                {isSelected && !isCorrect && <X className="h-3.5 w-3.5 text-red-500 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Student answer */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">Student answer:</p>
        <div className={cn(
          "rounded-md px-4 py-3 border text-sm whitespace-pre-wrap bg-white",
          isManual ? "border-amber-200" : "border-border"
        )}>
          {answer.answer || <span className="italic text-muted-foreground">(no answer)</span>}
        </div>
      </div>

      {/* Manual score input */}
      {isManual && (
        <div className="flex items-center gap-3 pt-1">
          <label className="text-sm font-medium">Score:</label>
          <input type="number" min={0} max={manualMax}
            value={manualScore}
            onChange={(e) => setManualScore(Math.max(0, Math.min(manualMax, parseInt(e.target.value, 10) || 0)))}
            className="w-24 rounded-md border bg-background px-3 py-1.5 text-sm text-center" />
          <span className="text-sm text-muted-foreground">/ {manualMax}</span>
        </div>
      )}
    </div>
  );
}
