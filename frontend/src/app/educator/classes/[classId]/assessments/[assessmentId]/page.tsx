"use client";

// filepath: frontend/src/app/educator/classes/[classId]/assessments/[assessmentId]/page.tsx

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAssessment, useDeleteAssessment } from "@/hooks/educator/useAssessments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Users, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
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

        <div className="flex items-center gap-2 shrink-0">
          {isBeforeRelease && (
            <Link href={`/educator/classes/${classId}/assessments/new?edit=${assessmentId}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />Edit Questions
              </Button>
            </Link>
          )}
          <Link href={`/educator/classes/${classId}/assessments/${assessmentId}/submissions`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />View Submissions
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="h-3.5 w-3.5" />Delete
              </Button>
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
              <div key={q.id} className="rounded-lg border px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{`Item ${i + 1} — ${q.type.replace(/_/g, " ")}`}</span>
                </div>
                <p className="text-sm">{q.text}</p>
                {q.correctAnswer && (
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