"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAssessment, useDeleteAssessment, usePublishAssessment, useUnpublishAssessment } from "@/hooks/educator/useAssessments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { assessmentApi } from "@/api/educator/assessment.api";
import { educatorClassApi } from "@/api/educator/class.api";
import { Loader2, Trash2, Users, Pencil, UserPlus, RotateCcw, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { AssessmentType } from "@/types/educator/assessment.types";

const STATUS_COLORS = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
} as const;

const TYPE_LABELS: Record<AssessmentType, string> = {
  quiz: "Quiz", activity: "Activity", exam: "Exam", custom: "Custom",
};

export default function AssessmentDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;

  const { data: assessment, isLoading } = useAssessment(classId, assessmentId);
  const { mutateAsync: deleteAssessment, isPending: isDeleting } = useDeleteAssessment(classId);
  const { mutateAsync: publish, isPending: isPublishing } = usePublishAssessment(classId);
  const { mutateAsync: unpublish, isPending: isUnpublishing } = useUnpublishAssessment(classId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => educatorClassApi.getStudents(classId),
    enabled: assignOpen || reopenOpen,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [reopenUntil, setReopenUntil] = useState("");

  const handleAssignOpen = useCallback(() => {
    setSelectedIds([]);
    setAssignOpen(true);
  }, []);

  async function handleAssign() {
    if (!selectedIds.length) return;
    setAssigning(true);
    try {
      await assessmentApi.assignStudents(classId, assessmentId, selectedIds);
      toast.success(`Assigned to ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}.`);
      setAssignOpen(false);
    } catch {
      toast.error("Failed to assign students.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleReopen() {
    if (!selectedIds.length || !reopenUntil) return;
    setReopening(true);
    try {
      const res = await assessmentApi.reopen(classId, assessmentId, selectedIds, reopenUntil);
      toast.success(`Reopened for ${res.reopened} student${res.reopened !== 1 ? "s" : ""}.`);
      setReopenOpen(false);
      setReopenUntil("");
    } catch {
      toast.error("Failed to reopen assessment.");
    } finally {
      setReopening(false);
    }
  }

  async function handleDelete(): Promise<void> {
    await deleteAssessment(assessmentId);
    toast.success("Assessment deleted.");
    router.push(`/educator/classes/${classId}/assessments`);
  }

  if (isLoading || !assessment) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />Loading assessment...
      </div>
    );
  }

  const isBeforeRelease = !assessment.releaseDate || new Date() < new Date(assessment.releaseDate);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1"
        onClick={() => router.push(`/educator/classes/${classId}/assessments`)}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Assessments
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/educator/classes/${classId}/assessments`} className="hover:text-foreground transition-colors">Assessments</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{assessment.title}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <Badge variant="outline">{TYPE_LABELS[assessment.type]}</Badge>
            {assessment.termName && <Badge variant="outline">{assessment.termName}</Badge>}
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", STATUS_COLORS[assessment.status])}>
              {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
            </span>
            {assessment.isPublished && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200">Published</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Assign Students Dialog */}
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <UserPlus className="h-3.5 w-3.5" />Assign Students
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign to Students</DialogTitle>
                <DialogDescription>Select students to give access to this assessment.</DialogDescription>
              </DialogHeader>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {students?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No enrolled students.</p>}
                {students?.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer hover:bg-muted/30">
                    <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, s.id] : selectedIds.filter((id) => id !== s.id))} className="rounded" />
                    <span>{s.fullName}</span>
                    {s.email && <span className="text-xs text-muted-foreground ml-auto">{s.email}</span>}
                  </label>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setAssignOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAssign} disabled={!selectedIds.length || assigning}>
                  {assigning && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Assign ({selectedIds.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reopen Dialog */}
          <Dialog open={reopenOpen} onOpenChange={(open) => { setReopenOpen(open); if (!open) { setSelectedIds([]); setReopenUntil(""); } }}>
            <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <RotateCcw className="h-3.5 w-3.5" />Reopen
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reopen for Students</DialogTitle>
                <DialogDescription>Select students and set a deadline for them to retake this assessment.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {students?.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No enrolled students.</p>}
                  {students?.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer hover:bg-muted/30">
                      <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, s.id] : selectedIds.filter((id) => id !== s.id))} className="rounded" />
                      <span>{s.fullName}</span>
                      {s.email && <span className="text-xs text-muted-foreground ml-auto">{s.email}</span>}
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reopen until (deadline)</Label>
                  <Input type="datetime-local" value={reopenUntil} onChange={(e) => setReopenUntil(e.target.value)} className="text-sm" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setReopenOpen(false); setSelectedIds([]); setReopenUntil(""); }}>Cancel</Button>
                <Button size="sm" onClick={handleReopen} disabled={!selectedIds.length || !reopenUntil || reopening}>
                  {reopening && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Reopen ({selectedIds.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Publish/Unpublish Alert Dialog */}
          {assessment.isPublished ? (
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed" disabled={isUnpublishing}>
                {isUnpublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <XCircle className="h-3.5 w-3.5" />Unpublish Scores
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unpublish scores?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Students will no longer see their scores or the question review. This can be reverted by publishing again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => unpublish(assessmentId)}>
                    Unpublish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed" disabled={isPublishing}>
                {isPublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Publish Scores
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish scores?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All students will immediately see their scores and the full question review. This cannot be undone, but you can unpublish later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => publish(assessmentId)}>
                    Publish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* View Submissions Button */}
          <Link href={`/educator/classes/${classId}/assessments/${assessmentId}/submissions`} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
            <Users className="h-3.5 w-3.5" />View Submissions
          </Link>

          {/* Delete Alert Dialog */}
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-background px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/5">
              <Trash2 className="h-3.5 w-3.5" />Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this assessment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all submitted scores. Final grades will recompute. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete Assessment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Release Date", value: assessment.releaseDate ? format(new Date(assessment.releaseDate), "MMM d, yyyy h:mm a") : "Immediate" },
          { label: "End Date", value: assessment.endDate ? format(new Date(assessment.endDate), "MMM d, yyyy h:mm a") : "No end date" },
          { label: "Total Items", value: String(assessment.totalItems) },
          { label: "Submitted", value: String(assessment.submittedCount) },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">
          Questions
          {!isBeforeRelease && <span className="ml-2 text-xs font-normal text-muted-foreground">(locked after release)</span>}
        </h2>
        {assessment.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Questions are being generated...</p>
        ) : (
          <div className="space-y-2">
            {assessment.questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{`Item ${i + 1} — ${q.type.replace(/_/g, " ")}`}</span>
                </div>
                <p className="text-sm">{q.text}</p>
                {q.choices && q.choices.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {q.choices.map((c) => (
                      <div key={c.label} className={cn("flex items-center gap-2 px-3 py-1.5 rounded text-sm border", q.correctAnswer === c.text ? "border-green-300 bg-green-50" : "border-border")}>
                        <span className="font-mono text-xs font-bold w-5">{c.label}.</span>
                        <span>{c.text}</span>
                        {q.correctAnswer === c.text && <span className="text-xs text-green-600 ml-auto font-medium">Correct</span>}
                      </div>
                    ))}
                  </div>
                )}
                {q.correctAnswer && q.type !== "multiple_choice" && (
                  <p className="text-xs text-muted-foreground">Answer: <span className="text-foreground">{q.correctAnswer}</span></p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}