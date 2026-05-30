"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import {
  useAssessment,
  useDeleteAssessment,
  usePublishAssessment,
  useUnpublishAssessment,
} from "@/hooks/educator/useAssessments";
import { assessmentApi } from "@/api/educator/assessment.api";
import { educatorClassApi } from "@/api/educator/class.api";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AssessmentQuestions } from "@/components/educator/assessment/AssessmentQuestions";
import { AssignStudentsDialog } from "@/components/educator/assessment/AssignStudentsDialog";
import { ReopenDialog } from "@/components/educator/assessment/ReopenDialog";

import {
  Loader2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AssessmentType } from "@/types/educator/assessment.types";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const TYPE_LABELS: Record<AssessmentType, string> = {
  written_work: "Written Work",
  performance_task: "Performance Task",
  quarterly_assessment: "Quarterly Assessment",
  exam: "Exam",
  quiz: "Quiz",
  project: "Project",
  recitation: "Recitation",
  attendance: "Attendance",
  activity: "Activity",
  custom: "Custom",
  other: "Other",
};

export default function AssessmentDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();

  const classId = params.classId as string;
  const assessmentId = params.assessmentId as string;

  const { data: assessment, isLoading } = useAssessment(classId, assessmentId);

  const { mutateAsync: deleteAssessment, isPending: isDeleting } =
    useDeleteAssessment(classId);

  const { mutateAsync: publish, isPending: isPublishing } =
    usePublishAssessment(classId);

  const { mutateAsync: unpublish, isPending: isUnpublishing } =
    useUnpublishAssessment(classId);

  const [assignOpen, setAssignOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [reopening, setReopening] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: () => educatorClassApi.getStudents(classId),
    enabled: assignOpen || reopenOpen,
  });

  async function handleAssign(selectedIds: string[]) {
    setAssigning(true);
    try {
      await assessmentApi.assignStudents(classId, assessmentId, selectedIds);
      toast.success(
        `Assigned to ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ""}.`
      );
      setAssignOpen(false);
    } catch {
      toast.error("Failed to assign students.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleReopen(selectedIds: string[], reopenUntil: string) {
    setReopening(true);
    try {
      const res = await assessmentApi.reopen(
        classId,
        assessmentId,
        selectedIds,
        reopenUntil
      );
      toast.success(
        `Reopened for ${res.reopened} student${res.reopened !== 1 ? "s" : ""}.`
      );
      setReopenOpen(false);
    } catch {
      toast.error("Failed to reopen assessment.");
    } finally {
      setReopening(false);
    }
  }

  async function handleDelete() {
    await deleteAssessment(assessmentId);
    toast.success("Assessment deleted.");
    router.push(`/educator/classes/${classId}/assessments`);
  }

  if (isLoading || !assessment) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading assessment...
      </div>
    );
  }

  const isBeforeRelease =
    !assessment.releaseDate ||
    new Date() < new Date(assessment.releaseDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title={assessment.title}
        breadcrumbs={[
          { label: "Assessments", href: `/educator/classes/${classId}/assessments` },
          { label: assessment.title },
        ]}
        description="Assessment details, instructions, and submissions overview."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AssignStudentsDialog
              open={assignOpen}
              onOpenChange={setAssignOpen}
              students={students}
              onAssign={handleAssign}
              assigning={assigning}
            />

            <ReopenDialog
              open={reopenOpen}
              onOpenChange={setReopenOpen}
              students={students}
              onReopen={handleReopen}
              reopening={reopening}
            />

            {assessment.isPublished ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={isUnpublishing}>
                      {isUnpublishing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      Unpublish Scores
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unpublish scores?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Students will no longer see scores or question reviews.
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
                <AlertDialogTrigger
                  render={
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={isPublishing}>
                      {isPublishing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      Publish Scores
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Publish scores?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Students will immediately see their scores and reviews.
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

            <Link href={`/educator/classes/${classId}/assessments/${assessmentId}/submissions`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Users className="h-4 w-4" />
                View Submissions
              </Button>
            </Link>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button size="sm" variant="destructive" className="gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this assessment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all submitted scores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Assessment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{TYPE_LABELS[assessment.type]}</Badge>
        {assessment.termName && (
          <Badge variant="outline">{assessment.termName}</Badge>
        )}
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
            STATUS_COLORS[assessment.status]
          )}
        >
          {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
        </span>
        {assessment.isPublished && (
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
            Published
          </span>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-lg border bg-card divide-y divide-border">
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0">Release Date</span>
          <span className="text-sm">
            {assessment.releaseDate
              ? format(new Date(assessment.releaseDate), "MMM d, yyyy h:mm a")
              : "Immediate"}
          </span>
        </div>
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0">End Date</span>
          <span className="text-sm">
            {assessment.endDate
              ? format(new Date(assessment.endDate), "MMM d, yyyy h:mm a")
              : "No end date"}
          </span>
        </div>
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0">Total Items</span>
          <span className="text-sm">{String(assessment.totalItems)}</span>
        </div>
        <div className="flex items-center gap-6 px-6 py-4">
          <span className="w-28 text-sm text-muted-foreground shrink-0">Submitted</span>
          <span className="text-sm">{String(assessment.submittedCount)}</span>
        </div>
      </div>

      {/* Questions / Instructions */}
      <AssessmentQuestions
        questions={assessment.questions}
        gradingMode={assessment.gradingMode}
        isBeforeRelease={isBeforeRelease}
      />
    </div>
  );
}
