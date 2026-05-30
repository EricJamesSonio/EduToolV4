"use client";

// filepath: frontend/src/app/educator/classes/[classId]/assessments/page.tsx

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  useAssessments,
  useDeleteAssessment,
} from "@/hooks/educator/useAssessments";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Loader2, Eye, Users, Trash2 } from "lucide-react";
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

export default function AssessmentsPage(): React.JSX.Element {
  const params = useParams();
  const classId = params.classId as string;

  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: assessments, isLoading } = useAssessments(classId, {
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  const { mutateAsync: deleteAssessment, isPending: isDeleting } =
    useDeleteAssessment(classId);

  async function handleDelete(assessmentId: string): Promise<void> {
    await deleteAssessment(assessmentId);
    toast.success("Assessment deleted. Submitted scores have been removed.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        actions={
          <Link href={`/educator/classes/${classId}/assessments/new`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Assessment
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value ?? "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {
        isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading assessments...
          </div>
        ) : !assessments || assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <p className="text-sm">No assessments yet.</p>
            <Link href={`/educator/classes/${classId}/assessments/new`}>
              <Button variant="outline" size="sm">
                Create your first assessment
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4 py-3">Title</TableHead>
                <TableHead className="px-4 py-3">Type</TableHead>
                <TableHead className="px-4 py-3">Release Date</TableHead>
                <TableHead className="px-4 py-3">End Date</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3">Submitted</TableHead>
                <TableHead className="px-4 py-3">Essays</TableHead>
                <TableHead className="px-4 py-3" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {assessments?.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/20">
                  <TableCell className="px-4 py-3 font-medium">{a.title}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline">{TYPE_LABELS[a.type]}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {a.releaseDate
                      ? format(new Date(a.releaseDate), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {a.endDate
                      ? format(new Date(a.endDate), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[a.status]}`}
                    >
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {a.submittedCount}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {a.pendingEssayCount > 0 ? (
                      <span className="text-amber-600 font-medium">
                        {a.pendingEssayCount} pending
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/educator/classes/${classId}/assessments/${a.id}`}
                      >
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                      <Link
                        href={`/educator/classes/${classId}/assessments/${a.id}/submissions`}
                      >
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Submissions
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this assessment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all submitted scores.
                              Final grades will recompute. This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(a.id)}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Delete Assessment
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      }
    </div>
  );
}