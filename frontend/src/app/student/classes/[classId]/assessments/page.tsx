// src/app/student/classes/[classId]/assessments/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClipboardList, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { formatDateTime } from "@/utils/date.util";
import { useStudentAssessments } from "@/hooks/student/useStudentAssessments";
import { useClassWeeks } from "@/hooks/educator/useClassWeeks";
import type { StudentAssessmentItem } from "@/api/student/assessment.api";

// ── Status helpers ──────────────────────────────────────────────────────────

function deriveStatus(a: StudentAssessmentItem): string {
  const now = new Date();
  if (a.submissionStatus === "submitted") return "submitted";
  if (a.submissionStatus === "graded")    return "graded";
  if (a.submissionStatus === "exempted")  return "exempted";
  if (a.releaseDate && new Date(a.releaseDate) > now) return "not_yet_open";
  if (a.endDate && new Date(a.endDate) < now)         return "missed";
  return "open";
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open:         { label: "Open",         className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  submitted:    { label: "Submitted",    className: "bg-blue-50   text-blue-700   border-blue-200"    },
  graded:       { label: "Graded",       className: "bg-violet-50 text-violet-700 border-violet-200"  },
  not_yet_open: { label: "Not Yet Open", className: "bg-slate-100 text-slate-500  border-slate-200"   },
  missed:       { label: "Missed",       className: "bg-red-50    text-red-600    border-red-200"     },
  draft:        { label: "Draft",        className: "bg-amber-50  text-amber-700  border-amber-200"   },
  exempted:     { label: "Exempted",     className: "bg-slate-100 text-slate-500  border-slate-200"   },
  not_started:  { label: "Not Started",  className: "bg-slate-100 text-slate-500  border-slate-200"   },
};

const STATUS_FILTER_LABELS: Record<string, string> = {
  all: "All Statuses",
  pending: "Pending",
  submitted: "Submitted",
  ended: "Ended",
};

function matchesStatus(a: StudentAssessmentItem, filter: string): boolean {
  if (filter === "all") return true;
  const derived = deriveStatus(a);
  if (filter === "pending") return derived === "open" || derived === "not_yet_open" || a.submissionStatus === "draft" || a.submissionStatus === "not_started";
  if (filter === "submitted") return derived === "submitted" || derived === "graded" || derived === "exempted";
  if (filter === "ended") return derived === "missed";
  return true;
}

const TYPE_LABELS: Record<string, string> = {
  written_work: "Written Work", performance_task: "Performance Task",
  quarterly_assessment: "Quarterly Assessment", exam: "Exam", quiz: "Quiz",
  assignment: "Assignment", project: "Project", recitation: "Recitation",
  participation: "Participation", behavior: "Behavior",
  attendance: "Attendance", activity: "Activity", custom: "Custom", other: "Other",
};

function getAction(
  status: string,
  a: StudentAssessmentItem,
  classId: string,
  router: ReturnType<typeof useRouter>
): React.ReactNode {
  if (status === "open") {
    return (
      <Button
        size="sm"
        onClick={() =>
          router.push(`/student/classes/${classId}/assessments/${a.id}`)
        }
      >
        Take Assessment
      </Button>
    );
  }
  if (status === "submitted" && a.isPublished) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          router.push(`/student/classes/${classId}/assessments/${a.id}/result`)
        }
      >
        View Result
      </Button>
    );
  }
  if (status === "graded") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          router.push(`/student/classes/${classId}/assessments/${a.id}/result`)
        }
      >
        View Result
      </Button>
    );
  }
  return null;
}

// ── Row ─────────────────────────────────────────────────────────────────────

function AssessmentRow({
  item,
  classId,
  index,
}: {
  item: StudentAssessmentItem;
  classId: string;
  index: number;
}) {
  const router = useRouter();
  const status = deriveStatus(item);
  const meta = STATUS_META[status] ?? STATUS_META["not_started"];

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3">
      {/* Icon */}
      <div className="shrink-0 h-9 w-9 rounded-md bg-muted flex items-center justify-center">
        <ClipboardList className="h-4 w-4 text-muted-foreground/60" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{item.title ?? item.type.replace(/_/g, " ")}</span>
          <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold capitalize", WEEK_COLORS[index % WEEK_COLORS.length])}>
            {item.type.replace(/_/g, " ")}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[11px] font-medium shrink-0", meta.className)}
          >
            {meta.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {item.releaseDate && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Opens {formatDateTime(item.releaseDate)}
              </span>
            )}
            {item.endDate && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                Due {formatDateTime(item.endDate)}
            </span>
          )}
          {item.weekNumber && (
            <span className="text-[11px] text-muted-foreground">
              Week {item.weekNumber}
            </span>
          )}
          {item.isPublished && (
            <span className="text-[11px] text-muted-foreground">
              {item.totalItems} items
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {getAction(status, item, classId, router)}
      </div>
    </div>
  );
}

function AssessmentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 px-4 py-3">
      <Skeleton className="h-9 w-9 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md shrink-0" />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function StudentAssessmentsPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();

  // ── Filters state ────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");

  // ── Data ─────────────────────────────────────────────────────────────
  const { data: raw, isLoading, isError } = useStudentAssessments(classId);
  const assessments = raw ?? [];

  const { data: weeks = [] } = useClassWeeks(classId);

  // Unique types from assessments for type filter
  const uniqueTypes = useMemo(() => [...new Set(assessments.map(a => a.type))], [assessments]);

  // Build cascading filter groups from weeks data
  const { semesterOptions, filteredTermOptions, filteredWeekOptions } = useMemo(() => {
    const semesters = new Map<string, { label: string; index: number }>();
    const terms = new Map<string, { label: string; semesterIndex: number }>();
    const weeksMap = new Map<string, { label: string; value: number; termId: string }>();

    for (const w of weeks) {
      const semKey = `${w.semesterIndex}`;
      if (!semesters.has(semKey)) {
        semesters.set(semKey, { label: w.semesterName, index: w.semesterIndex });
      }
      if (!terms.has(w.termId)) {
        terms.set(w.termId, { label: w.termName, semesterIndex: w.semesterIndex });
      }
      const weekKey = `${w.value}`;
      if (!weeksMap.has(weekKey)) {
        weeksMap.set(weekKey, { label: w.label, value: w.value, termId: w.termId });
      }
    }

    const semesterOpts = Array.from(semesters.entries())
      .map(([key, v]) => ({ value: key, label: v.label, index: v.index }))
      .sort((a, b) => a.index - b.index);

    const termOpts = Array.from(terms.entries())
      .map(([key, v]) => ({ value: key, label: v.label, semesterIndex: v.semesterIndex }))
      .sort((a, b) => a.semesterIndex - b.semesterIndex);

    const weekOpts = Array.from(weeksMap.entries())
      .map(([key, v]) => ({ value: key, label: v.label, weekValue: v.value, termId: v.termId }))
      .sort((a, b) => a.weekValue - b.weekValue);

    // Filter term/week options based on higher-level selections
    const filteredTerms = semesterFilter === "all"
      ? termOpts
      : termOpts.filter(t => {
          const sem = semesterOpts.find(s => s.value === semesterFilter);
          return sem && t.semesterIndex === sem.index;
        });

    const filteredWeeks = termFilter === "all"
      ? weekOpts
      : weekOpts.filter(w => w.termId === termFilter);

    return { semesterOptions: semesterOpts, filteredTermOptions: filteredTerms, filteredWeekOptions: filteredWeeks };
  }, [weeks, semesterFilter, termFilter]);

  // Apply filters
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (!matchesStatus(a, statusFilter)) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (semesterFilter !== "all") {
        const sem = semesterOptions.find(s => s.value === semesterFilter);
        if (!sem) return false;
        const matchedTerm = filteredTermOptions.find(t => t.value === a.termId && t.semesterIndex === sem.index);
        if (!matchedTerm) return false;
      }
      if (termFilter !== "all" && a.termId !== termFilter) return false;
      if (weekFilter !== "all" && a.weekNumber !== parseInt(weekFilter, 10)) return false;
      return true;
    });
  }, [assessments, statusFilter, typeFilter, semesterFilter, termFilter, weekFilter, semesterOptions, filteredTermOptions]);

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status">{statusFilter === "all" ? "All Statuses" : STATUS_FILTER_LABELS[statusFilter]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type">{typeFilter === "all" ? "All Types" : TYPE_LABELS[typeFilter] ?? typeFilter.replace(/_/g, " ")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABELS[t] ?? t.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={semesterFilter} onValueChange={(v) => { setSemesterFilter(v); setTermFilter("all"); setWeekFilter("all"); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semester">{semesterFilter === "all" ? "All Semesters" : semesterOptions.find(s => s.value === semesterFilter)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesterOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {semesterFilter !== "all" && (
          <Select value={termFilter} onValueChange={(v) => { setTermFilter(v); setWeekFilter("all"); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Term">{termFilter === "all" ? "All Terms" : filteredTermOptions.find(t => t.value === termFilter)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {filteredTermOptions.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {termFilter !== "all" && (
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
        )}
      </div>

      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-destructive">Could not load assessments.</p>
        </div>
      )}

      {!isError && isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <AssessmentRowSkeleton key={i} />
          ))}
        </div>
      )}

      {!isError && !isLoading && filteredAssessments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No assessments match your filters</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {assessments.length > 0
              ? "Try adjusting your filter criteria"
              : "Assessments will appear here once your educator publishes them"}
          </p>
        </div>
      )}

      {!isError && !isLoading && filteredAssessments.length > 0 && (
        <div className="space-y-2">
          {filteredAssessments.map((a, i) => (
            <AssessmentRow key={a.id} item={a} classId={classId} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
