"use client";

// filepath: frontend/src/app/educator/classes/[classId]/assessments/[assessmentId]/submissions/page.tsx

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useAssessment,
  useAssessmentSubmissions,
  useUpdateSubmissionStatus,
  usePublishAssessment,
  useUnpublishAssessment,
} from "@/hooks/educator/useAssessments";
import { useClassGradeLock } from "@/hooks/educator/useGradeLock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Loader2, Users, CheckCircle2, Ban, XCircle, UserPlus, Clock,
  FileText, Calendar, ListOrdered, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Submission, SubmissionStatus } from "@/types/educator/submission.types";
import type { AssessmentType } from "@/types/educator/assessment.types";

const TYPE_LABELS: Record<string, string> = {
  written_work: "Written Work", performance_task: "Performance Task",
  quarterly_assessment: "Quarterly Assessment", exam: "Exam", quiz: "Quiz",
  assignment: "Assignment", project: "Project", recitation: "Recitation",
  participation: "Participation", behavior: "Behavior",
  attendance: "Attendance", activity: "Activity", custom: "Custom", other: "Other",
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  not_started: "bg-zinc-100 text-zinc-500 border-zinc-200",
  draft: "bg-blue-50 text-blue-600 border-blue-200",
  submitted: "bg-green-50 text-green-700 border-green-200",
  exempted: "bg-purple-50 text-purple-700 border-purple-200",
  custom: "bg-amber-50 text-amber-700 border-amber-200",
  custom_score: "bg-amber-50 text-amber-700 border-amber-200",
};

function getStatusLabel(sub: Submission): string {
  if (sub.isMissed) return "Missed";
  if (sub.isExempted) return "Exempted";
  if (sub.status === "custom" || sub.status === "custom_score") return "Custom Score";
  return STATUS_LABELS[sub.status] ?? sub.status;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  not_started: "Not Started", draft: "Draft", submitted: "Submitted",
  exempted: "Exempted", custom: "Custom Score", custom_score: "Custom Score",
};

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
  const [status, setStatus] = useState<"exempted" | "custom" | "missed">("exempted");
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
          <select value={status} onChange={(e) => setStatus(e.target.value as "exempted" | "custom" | "missed")} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="exempted">Exempted</option>
            <option value="missed">Missed</option>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SubmissionsPage(): React.JSX.Element {
  const params = useParams();
  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;

  const { data: assessment } = useAssessment(classId, assessmentId);
  const { data: submissions, isLoading } = useAssessmentSubmissions(classId, assessmentId);
  const { mutateAsync: publish, isPending: isPublishing } = usePublishAssessment(classId);
  const { mutateAsync: unpublish, isPending: isUnpublishing } = useUnpublishAssessment(classId);
  const { data: lockInfo } = useClassGradeLock(classId);

  const [statusTarget, setStatusTarget] = useState<Submission | null>(null);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "submitted" | "exempted" | "missed" | "not_assigned" | "not_started">("all");

  const isNotAssigned = (sub: Submission) => sub.id.startsWith("not_started_");
  const isNotStarted = (sub: Submission) => !isNotAssigned(sub) && (sub.status === "not_started" || sub.status === "draft");

  const filteredSubmissions = submissions?.filter((sub) => {
    switch (filter) {
      case "submitted": return sub.status === "submitted";
      case "exempted": return sub.isExempted;
      case "missed": return sub.isMissed;
      case "not_assigned": return isNotAssigned(sub);
      case "not_started": return isNotStarted(sub);
      default: return true;
    }
  });

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
      <PageHeader
        title="Submissions"
        breadcrumbs={[
          { label: "Assessments", href: `/educator/classes/${classId}/assessments` },
          { label: assessment?.title ?? "...", href: `/educator/classes/${classId}/assessments/${assessmentId}` },
          { label: "Submissions" },
        ]}
        actions={
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
        }
      />

      {/* Assessment details card */}
      {assessment && (
        <div className="w-full rounded-lg border border-border bg-card px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{assessment.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {assessment.termName} &middot; {assessment.lessonTitle}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ListOrdered className="h-4 w-4" />
                <span><strong className="text-foreground">{assessment.totalItems ?? assessment.questions.length}</strong> items</span>
              </div>
              <Badge variant="outline">{TYPE_LABELS[assessment.type] ?? assessment.type}</Badge>
              {assessment.gradingMode && (
                <Badge variant="secondary" className="capitalize">{assessment.gradingMode}</Badge>
              )}
              {assessment.releaseDate && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due {format(new Date(assessment.endDate ?? assessment.releaseDate), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter + Table card */}
      <div className="w-full rounded-lg border border-border bg-card">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 flex-wrap border-b border-border px-4 py-3">
          {([
            { key: "all", label: "All", icon: Users },
            { key: "submitted", label: "Submitted", icon: CheckCircle2 },
            { key: "exempted", label: "Exempted", icon: Ban },
            { key: "missed", label: "Missed", icon: XCircle },
            { key: "not_assigned", label: "Not Assigned", icon: UserPlus },
            { key: "not_started", label: "Not Started", icon: Clock },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                filter === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />Loading submissions...
          </div>
        ) : !filteredSubmissions?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No submissions match this filter.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3">Student</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Score</TableHead>
                <TableHead className="px-4 py-3">Published</TableHead>
                <TableHead className="px-4 py-3">Essay</TableHead>
                <TableHead className="px-4 py-3" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {filteredSubmissions.map((sub, idx) => (
                <TableRow key={sub.id} className={cn(idx % 2 === 0 ? "bg-white" : "bg-muted/20", "hover:bg-muted/40")}>
                  <TableCell className="px-4 py-3">
                    <p className="font-medium">{sub.studentName}</p>
                    <p className="text-xs text-muted-foreground">{sub.studentCode}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", STATUS_STYLES[sub.status] ?? STATUS_STYLES.custom)}>
                      {getStatusLabel(sub)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {(() => {
                      if (sub.isExempted) return <span className="text-muted-foreground">&mdash;</span>;
                      const earned = sub.manualScore ?? sub.manualSectionScore ?? sub.score;
                      if (earned !== null) return `${earned} / ${sub.totalPoints}`;
                      return <span className="text-muted-foreground">&mdash;</span>;
                    })()}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={cn("text-xs font-medium", sub.isPublished ? "text-green-600" : "text-muted-foreground")}>
                      {sub.isPublished ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
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
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {(hasEssayQuestions || hasManualQuestions) && sub.status === "submitted" && (
                        <Link href={`/educator/classes/${classId}/assessments/${assessmentId}/submissions/${sub.id}/review`}>
                          <Button variant="ghost" size="sm">
                            {hasManualQuestions && sub.manualSectionScore == null ? "Grade" : "Review"}
                          </Button>
                        </Link>
                      )}
                      {sub.status === "not_started" && (
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (lockInfo?.is_locked) { setLockDialogOpen(true); return; }
                          setStatusTarget(sub);
                        }}>Set Status</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)}>
        {statusTarget && (
          <SetStatusDialog submission={statusTarget} assessmentId={assessmentId} classId={classId} onClose={() => setStatusTarget(null)} />
        )}
      </Dialog>

      {/* Lock notice dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Grades Locked
            </DialogTitle>
            <DialogDescription>
              Grades are currently locked. You cannot change submission statuses
              until grades are unlocked. Unlock grades from the Grades page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setLockDialogOpen(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}