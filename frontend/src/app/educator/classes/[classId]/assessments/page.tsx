"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  useAssessments,
  useDeleteAssessment,
} from "@/hooks/educator/useAssessments";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import { educatorGradingSchemeApi } from "@/api/educator/grading-scheme.api";
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
import type { WeekSlot } from "@/types/educator/lesson.types";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const TYPE_LABELS: Record<string, string> = {
  written_work: "Written Work", performance_task: "Performance Task",
  quarterly_assessment: "Quarterly Assessment", exam: "Exam", quiz: "Quiz",
  assignment: "Assignment", project: "Project", recitation: "Recitation",
  participation: "Participation", behavior: "Behavior",
  attendance: "Attendance", activity: "Activity", custom: "Custom", other: "Other",
};

export default function AssessmentsPage(): React.JSX.Element {
  const params = useParams();
  const classId = params.classId as string;

  // ── Filters state ────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  // ── Data ─────────────────────────────────────────────────────────────
  const { data: weeks = [] } = useClassWeeks(classId);

  const { data: gradingScheme } = useAsyncQuery(
    queryKeys.educator.gradingSchemes.detail(classId),
    () => educatorGradingSchemeApi.getForClass(classId),
  );
  const schemeTypes = gradingScheme?.components?.map((c) => c.type) ?? [];

  // Build cascading filter groups from weeks data
  const { termOptions, weekOptions } = useMemo(() => {
    const terms = new Map<string, { label: string }>();
    const weeksMap = new Map<string, { label: string; value: number; termId: string }>();

    for (const w of weeks) {
      if (!terms.has(w.termId)) {
        terms.set(w.termId, { label: w.termName });
      }
      const weekKey = `${w.value}`;
      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, { label: w.label, value: w.value, termId: w.termId });
      }
    }

    const termOpts = Array.from(terms.entries())
      .map(([key, v]) => ({ value: key, label: v.label }));

    const weekOpts = Array.from(weeksMap.entries())
      .map(([key, v]) => ({ value: key, label: v.label, weekValue: v.value, termId: v.termId }))
      .sort((a, b) => a.weekValue - b.weekValue);

    return { termOptions: termOpts, weekOptions: weekOpts };
  }, [weeks]);

  // Filtered week options based on term selection
  const filteredWeekOptions = useMemo(() => {
    if (termFilter === "all") return weekOptions;
    return weekOptions.filter((w) => w.termId === termFilter);
  }, [weekOptions, termFilter]);

  // Determine selected termId and weekNumber for API call
  const selectedTermId = termFilter !== "all" ? termFilter : undefined;
  const selectedWeekNumber = weekFilter !== "all" ? parseInt(weekFilter, 10) : undefined;

  const { data: assessments, isLoading } = useAssessments(classId, {
    type: typeFilter === "all" ? undefined : typeFilter,
    termId: selectedTermId,
    weekNumber: selectedWeekNumber,
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
        description="Create and manage assessments for this class."
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
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type">{typeFilter === "all" ? "All Types" : TYPE_LABELS[typeFilter] ?? typeFilter.replace(/_/g, " ")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {schemeTypes.length > 0
              ? schemeTypes.map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t] ?? t.replace(/_/g, " ")}</SelectItem>
                ))
              : (["quiz","activity","exam","custom"] as const).map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
          </SelectContent>
        </Select>

        <Select value={termFilter} onValueChange={(v) => { setTermFilter(v); setWeekFilter("all"); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Term">{termFilter === "all" ? "All Terms" : termOptions.find(t => t.value === termFilter)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {termOptions.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={weekFilter} onValueChange={setWeekFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Week">{weekFilter === "all" ? "All Weeks" : filteredWeekOptions.find(w => w.value === weekFilter)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weeks</SelectItem>
            {filteredWeekOptions.map((w) => (
              <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
            ))}
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
                <TableHead className="px-4 py-3">Week</TableHead>
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
                    {a.weekNumber ? `Week ${a.weekNumber}` : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {a.releaseDate
                      ? format(new Date(a.releaseDate), "MMM d, yyyy h:mm a")
                      : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    {a.endDate
                      ? format(new Date(a.endDate), "MMM d, yyyy h:mm a")
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