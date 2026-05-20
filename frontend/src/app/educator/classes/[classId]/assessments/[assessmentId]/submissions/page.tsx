"use client";

// filepath: frontend/src/app/educator/classes/[classId]/assessments/[assessmentId]/submissions/page.tsx

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  useAssessment,
  useAssessmentSubmissions,
  useUpdateSubmissionStatus,
  useGradeEssay,
  usePublishAssessment,
  useUnpublishAssessment,
} from "@/hooks/educator/useAssessments";
import { useSubmissionAnswers, useGradeEssay as useGradeEssayAlt } from "@/hooks/educator/useSubmissions";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/types/educator/submission.types";
import type { SubmissionAnswerDetail } from "@/api/educator/submission.api";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  not_started: "bg-zinc-100 text-zinc-500 border-zinc-200",
  draft: "bg-blue-50 text-blue-600 border-blue-200",
  submitted: "bg-green-50 text-green-700 border-green-200",
  exempted: "bg-purple-50 text-purple-700 border-purple-200",
  custom_score: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  not_started: "Not Started", draft: "Draft", submitted: "Submitted",
  exempted: "Exempted", custom_score: "Custom Score",
};

// ─── Essay Grader dialog ──────────────────────────────────────────────────────

function EssayGraderDialog({
  submission,
  assessmentId,
  classId,
  onClose,
}: {
  submission: Submission;
  assessmentId: string;
  classId: string;
  onClose: () => void;
}): React.JSX.Element {
  const [score, setScore] = useState(submission.score ?? 0);
  const { mutateAsync: gradeEssay, isPending } = useGradeEssay(classId, assessmentId);

  async function handleSave(): Promise<void> {
    await gradeEssay({ submissionId: submission.id, score });
    toast.success("Essay score saved.");
    onClose();
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Grade Essay — {submission.studentName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Student Response</p>
          <div className="rounded-lg border bg-muted/20 p-3 text-sm max-h-48 overflow-y-auto">
            {submission.answers.filter((a) => a.answer).map((a) => (
              <p key={a.questionId} className="mb-2">{a.answer}</p>
            ))}
            {!submission.answers.some((a) => a.answer) && (
              <p className="text-muted-foreground italic">No response submitted.</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Score (0 – {submission.totalPoints})</label>
          <input
            type="number"
            min={0}
            max={submission.totalPoints}
            value={score}
            onChange={(e) => setScore(parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save Score
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Set Status dialog ────────────────────────────────────────────────────────

function SetStatusDialog({
  submission,
  assessmentId,
  classId,
  onClose,
}: {
  submission: Submission;
  assessmentId: string;
  classId: string;
  onClose: () => void;
}): React.JSX.Element {
  const [status, setStatus] = useState<"exempted" | "custom">("exempted");
  const [manualScore, setManualScore] = useState(submission.score ?? 0);
  const { mutateAsync: updateStatus, isPending } = useUpdateSubmissionStatus(classId, assessmentId);

  async function handleSave(): Promise<void> {
    await updateStatus({ submissionId: submission.id, status, manualScore: status === "custom" ? manualScore : undefined });
    toast.success("Status updated.");
    onClose();
  }

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Set Status — {submission.studentName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as "exempted" | "custom")} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="exempted">Exempted</option>
            <option value="custom">Custom Score</option>
          </select>
        </div>
        {status === "custom" && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Score</label>
            <input type="number" min={0} max={submission.totalPoints} value={manualScore} onChange={(e) => setManualScore(parseInt(e.target.value, 10) || 0)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

// ─── Submission Review dialog (all Q&A + manual grading) ──────────────────────

function SubmissionReviewDialog({
  submission, classId, assessmentId, onClose,
}: {
  submission: Submission;
  classId: string;
  assessmentId: string;
  onClose: () => void;
}): React.JSX.Element {
  const [manualScore, setManualScore] = useState(submission.manualSectionScore ?? 0);
  const maxManualScore = submission.totalPoints;
  const { data: answers, isLoading } = useSubmissionAnswers(assessmentId, submission.id);
  const { mutateAsync: gradeEssay, isPending } = useGradeEssayAlt(classId, assessmentId);

  const hasManualQuestions = answers?.some((a) => a.question.type === 'manual');

  async function handleSaveManual() {
    await gradeEssay({ submissionId: submission.id, score: manualScore });
    toast.success("Manual score saved.");
    onClose();
  }

  function typeLabel(type: string): string {
    const map: Record<string, string> = {
      multiple_choice: "Multiple Choice", true_or_false: "True or False",
      identification: "Identification", enumeration: "Enumeration",
      essay: "Essay", manual: "Manual (Educator-Written)",
    };
    return map[type] ?? type.replace(/_/g, " ");
  }

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Submission Review — {submission.studentName}</DialogTitle>
        <DialogDescription>
          {submission.submittedAt
            ? `Submitted ${new Date(submission.submittedAt).toLocaleString()}`
            : "Not yet submitted"}
        </DialogDescription>
      </DialogHeader>

      {/* Score summary */}
      <div className="flex items-center gap-4 flex-wrap text-sm border rounded-lg p-3 bg-muted/20">
        <div>
          <span className="text-muted-foreground">System Score: </span>
          <span className="font-semibold">{submission.systemSectionScore ?? submission.score ?? "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Manual Score: </span>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />Loading answers...
        </div>
      ) : !answers?.length ? (
        <p className="text-sm text-muted-foreground py-4">No answers submitted.</p>
      ) : (
        <div className="space-y-4 pt-1">
          {answers.map((a, i) => {
            const isManual = a.question.type === 'manual';
            return (
              <div key={a.question.id} className={cn(
                "rounded-lg border p-4 space-y-2",
                isManual && "border-l-4 border-l-blue-400 bg-blue-50/20"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Item {i + 1} — {typeLabel(a.question.type)}
                  </span>
                  {a.question.type === 'manual' && (
                    <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Manual
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{a.question.questionText}</p>

                {/* Student answer */}
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Student answer:</p>
                  <p className={cn(
                    "rounded-md px-3 py-2 border text-sm whitespace-pre-wrap bg-white",
                    isManual ? "border-blue-200" : "border-border"
                  )}>
                    {a.answer || <span className="italic text-muted-foreground">(no answer)</span>}
                  </p>
                </div>

                {/* Score input for manual questions */}
                {isManual && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs text-muted-foreground shrink-0">Score:</label>
                    <input
                      type="number" min={0} max={maxManualScore}
                      value={manualScore}
                      onChange={(e) => setManualScore(parseInt(e.target.value, 10) || 0)}
                      className="w-20 rounded-md border bg-background px-2 py-1 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">/ {maxManualScore}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual section save button */}
      {hasManualQuestions && (
        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          <Button size="sm" onClick={handleSaveManual} disabled={isPending || isLoading}>
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save Manual Score
          </Button>
        </div>
      )}
    </DialogContent>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SubmissionsPage(): React.JSX.Element {
  const params = useParams();
  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;

  const { data: assessment } = useAssessment(classId, assessmentId);
  const { data: submissions, isLoading } = useAssessmentSubmissions(classId, assessmentId);
  const { mutateAsync: publish, isPending: isPublishing } = usePublishAssessment(classId);
  const { mutateAsync: unpublish, isPending: isUnpublishing } = useUnpublishAssessment(classId);

  const [reviewTarget, setReviewTarget] = useState<Submission | null>(null);
  const [essayTarget, setEssayTarget] = useState<Submission | null>(null);
  const [statusTarget, setStatusTarget] = useState<Submission | null>(null);

  async function handlePublishAll(): Promise<void> {
    await publish(assessmentId);
    toast.success("All scores published.");
  }

  async function handleUnpublishAll(): Promise<void> {
    await unpublish(assessmentId);
    toast.success("All scores unpublished.");
  }

  const hasEssayQuestions = assessment?.questions.some((q) => q.type === "essay") ?? false;
  const hasManualQuestions = assessment?.questions.some((q) => q.type === "manual") ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/educator/classes/${classId}/assessments`} className="hover:text-foreground transition-colors">Assessments</Link>
            <span>/</span>
            <Link href={`/educator/classes/${classId}/assessments/${assessmentId}`} className="hover:text-foreground transition-colors">{assessment?.title ?? "..."}</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Submissions</span>
          </div>
          <h1 className="text-xl font-semibold">Submissions</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePublishAll} disabled={isPublishing}>
            {isPublishing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Publish All
          </Button>
          <Button variant="outline" size="sm" onClick={handleUnpublishAll} disabled={isUnpublishing}>
            {isUnpublishing && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Unpublish All
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />Loading submissions...
        </div>
      ) : !submissions?.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No submissions yet.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Published</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Essay</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{sub.studentName}</p>
                    <p className="text-xs text-muted-foreground">{sub.studentCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", STATUS_STYLES[sub.status])}>
                      {STATUS_LABELS[sub.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sub.score !== null ? `${sub.score} / ${sub.totalPoints}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium", sub.isPublished ? "text-green-600" : "text-muted-foreground")}>
                      {sub.isPublished ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {hasManualQuestions ? (
                      sub.manualSectionScore != null ? (
                        <span className="text-xs text-green-600">Graded</span>
                      ) : (
                        <span className="text-xs text-amber-600">Pending</span>
                      )
                    ) : hasEssayQuestions ? (
                      sub.essayGraded ? (
                        <span className="text-xs text-green-600">Graded</span>
                      ) : (
                        <span className="text-xs text-amber-600">Pending</span>
                      )
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {(hasEssayQuestions || hasManualQuestions) && sub.status === "submitted" && (
                        <Button variant="ghost" size="sm" onClick={() => setReviewTarget(sub)}>
                          {hasManualQuestions && sub.manualSectionScore == null ? "Grade" : "Review"}
                        </Button>
                      )}
                      {hasEssayQuestions && !sub.essayGraded && sub.status === "submitted" && !hasManualQuestions && (
                        <Button variant="ghost" size="sm" onClick={() => setEssayTarget(sub)}>Grade Essay</Button>
                      )}
                      {sub.status !== "not_started" && (
                        <Button variant="ghost" size="sm" onClick={() => setStatusTarget(sub)}>Set Status</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
        {reviewTarget && (
          <SubmissionReviewDialog submission={reviewTarget} classId={classId} assessmentId={assessmentId} onClose={() => setReviewTarget(null)} />
        )}
      </Dialog>

      <Dialog open={!!essayTarget} onOpenChange={(o) => !o && setEssayTarget(null)}>
        {essayTarget && (
          <EssayGraderDialog submission={essayTarget} assessmentId={assessmentId} classId={classId} onClose={() => setEssayTarget(null)} />
        )}
      </Dialog>

      <Dialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)}>
        {statusTarget && (
          <SetStatusDialog submission={statusTarget} assessmentId={assessmentId} classId={classId} onClose={() => setStatusTarget(null)} />
        )}
      </Dialog>
    </div>
  );
}