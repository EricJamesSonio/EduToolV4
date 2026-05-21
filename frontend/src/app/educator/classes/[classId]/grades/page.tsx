"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Lock, Loader2, RefreshCw, ChevronDown, ChevronUp,
  LayoutGrid, List, Save, X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClassGrades, useComputeGrades, useSetManualScore } from "@/hooks/educator/useGrades";
import type { TermGrades, StudentGrade, CategoryBreakdown } from "@/types/educator/grade.types";
import { cn } from "@/lib/utils";
import apiClient from "@/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "default" | "clean";

interface PendingEdit {
  studentId: string;
  category: string;
  value: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-blue-600 dark:text-blue-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function fmt(n: number | null, decimals = 1): string {
  if (n === null) return "—";
  return n.toFixed(decimals);
}

// ─── ManualCell ───────────────────────────────────────────────────────────────

function ManualCell({
  value,
  studentId,
  category,
  isLocked,
  onCommit,
}: {
  value: number | null;
  studentId: string;
  category: string;
  isLocked: boolean;
  onCommit: (studentId: string, category: string, value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const num = parseFloat(draft);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onCommit(studentId, category, num);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value ?? ""));
    setEditing(false);
  };

  if (isLocked) {
    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        {value !== null ? fmt(value) : "—"}
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
            if (e.key === "Tab") { e.preventDefault(); commit(); }
          }}
          className="w-14 rounded border border-primary px-1.5 py-0.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary bg-background"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value ?? "")); setEditing(true); }}
      className="group relative min-w-[2.5rem] rounded px-2 py-0.5 text-xs tabular-nums hover:bg-primary/10 hover:text-primary transition-colors text-left"
    >
      {value !== null ? fmt(value) : <span className="text-muted-foreground/50">—</span>}
      <span className="absolute -top-0.5 -right-0.5 hidden group-hover:block w-1.5 h-1.5 rounded-full bg-primary" />
    </button>
  );
}

// ─── Status Cell ───────────────────────────────────────────────────────────────

const STATUS_ACTIONS = [
  { label: "Completed", status: "submitted" as const },
  { label: "Missed", status: "missed" as const },
  { label: "Exempted", status: "exempted" as const },
];

function StatusCell({
  score,
  classId,
  assessmentId,
  submissionId,
  isMissed,
  isExempted,
  status,
  totalItems,
  onStatusChange,
}: {
  score: number | null;
  classId: string;
  assessmentId: string;
  submissionId?: string;
  isMissed?: boolean;
  isExempted?: boolean;
  status: string;
  totalItems: number;
  onStatusChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (newStatus: string) => {
    if (!submissionId) return;
    setPending(true);
    try {
      await apiClient.patch(
        `/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/status`,
        { status: newStatus },
      );
      onStatusChange();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setPending(false);
      setOpen(false);
    }
  };

  if (status === 'not_started' || (!submissionId && !score && score !== 0)) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors w-6 h-6 rounded"
        >
          —
        </button>
        {open && (
          <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 w-28 rounded-md border bg-popover shadow-md py-1">
            {STATUS_ACTIONS.slice(0, 2).map((action) => (
              <button
                key={action.status}
                onClick={() => handleAction(action.status)}
                disabled={pending}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const isMissedOrExempted = isMissed || isExempted;
  const badgeLabel = isMissed ? "M" : isExempted ? "E" : null;
  const badgeClass = isMissed
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    : isExempted
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs tabular-nums text-muted-foreground hover:text-foreground transition-colors"
      >
        {isMissedOrExempted ? (
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${badgeClass}`}>
            {badgeLabel}
          </span>
        ) : score !== null ? (
          `${fmt(score, 0)}/${totalItems}`
        ) : (
          "—"
        )}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 w-28 rounded-md border bg-popover shadow-md py-1">
          {STATUS_ACTIONS.filter(
            (a) => a.status !== (isExempted ? "exempted" : isMissed ? "missed" : null),
          ).map((action) => (
            <button
              key={action.status}
              onClick={() => handleAction(action.status)}
              disabled={pending}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Default View Table ───────────────────────────────────────────────────────

function DefaultGradeTable({
  classId,
  termData,
  onManualCommit,
  saving,
  refreshKey,
  onRefresh,
}: {
  classId: string;
  termData: TermGrades;
  onManualCommit: (studentId: string, category: string, value: number) => void;
  saving: Set<string>;
  refreshKey: number;
  onRefresh: () => void;
}) {
  const { students } = termData;
  if (students.length === 0) return <EmptyState />;

  // Collect unique assessments sorted by created_at
  const allAssessments = Array.from(
    new Map(
      students.flatMap((s) =>
        s.assessmentScores.map((a) => [
          a.assessmentId,
          { id: a.assessmentId, type: a.type, created_at: a.created_at ?? null },
        ])
      )
    ).values()
  ).sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0;
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  // Find actual manual categories from breakdown
  const manualCats = Array.from(
    new Set(
      students.flatMap((s) =>
        s.categoryBreakdown
          .filter((c) => c.manualScore !== null || c.category.toLowerCase().match(/attendance|behavior|recitation|participation/))
          .map((c) => c.category)
      )
    )
  );

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="sticky left-0 bg-muted/50 text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-[200px]">
                Student
              </th>
              {allAssessments.map((a) => (
                <th key={a.id} className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  <span className="capitalize">{a.type}</span>
                </th>
              ))}
              {manualCats.map((cat) => (
                <th key={cat} className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  {cat}
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                Term Grade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student, idx) => {
              const isLocked = student.grade?.is_locked ?? false;
              const isSaving = saving.has(student.studentId);
              return (
                <tr
                  key={student.studentId}
                  className={cn(
                    "transition-colors",
                    idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                    "hover:bg-muted/40"
                  )}
                >
                  {/* Student */}
                  <td className="sticky left-0 bg-inherit px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {student.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{student.studentName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{student.studentCode}</p>
                      </div>
                      {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />}
                      {isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                  </td>

                  {/* Assessment scores with status badges */}
                  {allAssessments.map((a) => {
                    const score = student.assessmentScores.find((s) => s.assessmentId === a.id);
                    return (
                      <td key={a.id} className="text-center px-3 py-3">
                        <div className="flex items-center justify-center">
                          <StatusCell
                            score={score?.manualScore ?? score?.score ?? null}
                            classId={classId}
                            assessmentId={a.id}
                            submissionId={score?.submissionId}
                            isMissed={score?.isMissed}
                            isExempted={score?.isExempted}
                            status={score?.status ?? 'not_started'}
                            totalItems={score?.totalItems ?? 0}
                            onStatusChange={onRefresh}
                          />
                        </div>
                      </td>
                    );
                  })}

                  {/* Manual score cells */}
                  {manualCats.map((cat) => {
                    const breakdown = student.categoryBreakdown.find(
                      (c) => c.category.toLowerCase() === cat.toLowerCase()
                    );
                    return (
                      <td key={cat} className="text-center px-3 py-3">
                        <ManualCell
                          value={breakdown?.manualScore ?? null}
                          studentId={student.studentId}
                          category={cat}
                          isLocked={isLocked}
                          onCommit={onManualCommit}
                        />
                      </td>
                    );
                  })}

                  {/* Term grade */}
                  <td className="text-center px-4 py-3">
                    {student.grade ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={cn("text-sm font-bold tabular-nums", gradeColor(student.grade.final_score))}>
                          {fmt(student.grade.final_score)}%
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {student.grade.final_grade}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Per-Student Category Drill-Down Modal ────────────────────────────────────

function StudentCategoryDrillDown({
  student,
  category,
  onClose,
}: {
  student: StudentGrade | null;
  category: string | null;
  onClose: () => void;
}) {
  if (!student || !category) return null;

  const bd = student.categoryBreakdown.find(
    (c) => c.category.toLowerCase() === category.toLowerCase()
  );
  const categoryType = bd?.type;

  const assessments = student.assessmentScores
    .filter((a) => categoryType ? a.type.toLowerCase() === categoryType.toLowerCase() : a.type.toLowerCase() === category.toLowerCase())
    .sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0;
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-background shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-lg capitalize">
            {student.studentName} &mdash; {category}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments in this category.</p>
          ) : (
            <div className="space-y-3">
              {assessments.map((a) => {
                const earned = a.manualScore ?? a.score;
                return (
                  <div key={a.assessmentId} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <span className="text-sm font-medium capitalize">{a.type}</span>
                    <span className="text-sm tabular-nums">
                      {earned !== null ? (
                        <>{fmt(earned, 0)}/{a.totalItems}</>
                      ) : a.isMissed ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold">M</span>
                      ) : a.isExempted ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold">E</span>
                      ) : (
                        <span className="text-muted-foreground/50">&mdash;</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="text-sm font-semibold">Average</span>
            <span className="text-sm font-bold tabular-nums">
              {bd ? `${fmt(bd.rawAverage)}%` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Clean View Table ─────────────────────────────────────────────────────────

function CleanGradeTable({
  termData,
  onManualCommit,
}: {
  termData: TermGrades;
  onManualCommit: (studentId: string, category: string, value: number) => void;
}) {
  const { students } = termData;
  const [drillDown, setDrillDown] = useState<{ student: StudentGrade; category: string } | null>(null);
  if (students.length === 0) return <EmptyState />;

  // Collect all category names from breakdowns
  const allCategories = Array.from(
    new Set(students.flatMap((s) => s.categoryBreakdown.map((c) => c.category)))
  );

  return (
    <>
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="sticky left-0 bg-muted/50 text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-[200px]">
                  Student
                </th>
                {allCategories.map((cat) => (
                  <th key={cat} className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    {cat}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  Term Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student, idx) => {
                const isLocked = student.grade?.is_locked ?? false;
                return (
                  <tr
                    key={student.studentId}
                    className={cn(
                      "transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                      "hover:bg-muted/40"
                    )}
                  >
                    <td className="sticky left-0 bg-inherit px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {student.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{student.studentName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{student.studentCode}</p>
                        </div>
                        {isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                      </div>
                    </td>

                    {allCategories.map((cat) => {
                      const bd = student.categoryBreakdown.find(
                        (c) => c.category.toLowerCase() === cat.toLowerCase()
                      );
                      const isManual = bd?.manualScore !== undefined && bd?.manualScore !== null;
                      return (
                        <td key={cat} className="text-center px-4 py-3">
                          {isManual ? (
                            <ManualCell
                              value={bd?.manualScore ?? null}
                              studentId={student.studentId}
                              category={cat}
                              isLocked={isLocked}
                              onCommit={onManualCommit}
                            />
                          ) : (
                            <button
                              onClick={() => setDrillDown({ student, category: cat })}
                              className="text-xs tabular-nums text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 decoration-dotted decoration-muted-foreground/40"
                            >
                              {bd ? `${fmt(bd.rawAverage)}%` : "—"}
                            </button>
                          )}
                        </td>
                      );
                    })}

                    <td className="text-center px-4 py-3">
                      {student.grade ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={cn("text-sm font-bold tabular-nums", gradeColor(student.grade.final_score))}>
                            {fmt(student.grade.final_score)}%
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {student.grade.final_grade}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <StudentCategoryDrillDown
        student={drillDown?.student ?? null}
        category={drillDown?.category ?? null}
        onClose={() => setDrillDown(null)}
      />
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-xl">
      <LayoutGrid className="h-8 w-8 opacity-30" />
      <p className="text-sm">No students found for this term.</p>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ students }: { students: StudentGrade[] }) {
  const graded = students.filter((s) => s.grade !== null).length;
  const locked = students.filter((s) => s.grade?.is_locked).length;
  const avg =
    graded > 0
      ? students
          .filter((s) => s.grade !== null)
          .reduce((sum, s) => sum + (s.grade!.final_score ?? 0), 0) / graded
      : null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Students", value: students.length },
        { label: "Graded", value: `${graded}/${students.length}` },
        { label: "Class Average", value: avg !== null ? `${fmt(avg)}%` : "—" },
      ].map((stat) => (
        <div key={stat.label} className="rounded-lg border px-4 py-3">
          <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GradesPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const { data: allTerms, isLoading } = useClassGrades(classId);

  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Derive unique semesters from term data
  const semesters = allTerms
    ? Array.from(
        new Map(
          allTerms.map((t) => [
            t.semesterId ?? "default",
            { id: t.semesterId ?? "default", name: t.semesterName ?? "Default" },
          ]),
        ).values(),
      )
    : [];

  const semesterTerms = allTerms?.filter(
    (t) => (t.semesterId ?? "default") === (activeSemesterId ?? ""),
  ) ?? [];

  // Set initial active semester and term once data loads
  useEffect(() => {
    if (semesters.length > 0 && !activeSemesterId) {
      setActiveSemesterId(semesters[0].id);
    }
  }, [semesters, activeSemesterId]);

  useEffect(() => {
    if (semesterTerms.length > 0 && !activeTermId) {
      setActiveTermId(semesterTerms[0].termId);
    }
  }, [semesterTerms, activeTermId]);

  const activeTerm = semesterTerms.find((t) => t.termId === activeTermId) ?? null;

  const computeMutation = useComputeGrades(classId, activeTermId ?? "");

  const handleManualCommit = useCallback(
    async (studentId: string, category: string, value: number) => {
      if (!activeTermId) return;
      const key = `${studentId}-${category}`;
      setSaving((prev) => new Set(prev).add(key));
      try {
        await apiClient.patch(
          `/classes/${classId}/grades/${activeTermId}/students/${studentId}/manual`,
          { category, score: value }
        );
        toast.success(`${category} score updated.`);
      } catch {
        toast.error("Failed to save score. Please try again.");
      } finally {
        setSaving((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [classId, activeTermId]
  );

  const handleLockGrades = async () => {
    setLocking(true);
    try {
      await apiClient.post(`/grade-lock/${classId}/lock`);
      toast.success("Grades locked successfully.");
      setLockDialogOpen(false);
    } catch {
      toast.error("Failed to lock grades.");
    } finally {
      setLocking(false);
    }
  };

  const handleCompute = async () => {
    try {
      const res = await computeMutation.mutateAsync();
      toast.success(res.message);
    } catch {
      toast.error("Failed to compute grades.");
    }
  };

  const isClassLocked = activeTerm?.students.every((s) => s.grade?.is_locked) ?? false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading grades...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades"
        breadcrumbs={[
          { label: "Classes", href: "/educator/classes" },
          { label: "Class", href: `/educator/classes/${classId}` },
          { label: "Grades" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompute}
              disabled={computeMutation.isPending || !activeTermId}
              className="gap-1.5"
            >
              {computeMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />
              }
              Compute
            </Button>
            {!isClassLocked && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setLockDialogOpen(true)}
                className="gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                Lock Grades
              </Button>
            )}
            {isClassLocked && (
              <Badge variant="secondary" className="gap-1.5">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </div>
        }
      />

      {/* Semester tabs */}
      {semesters.length > 1 && (
        <div className="flex items-center gap-1">
          {semesters.map((sem) => (
            <button
              key={sem.id}
              onClick={() => { setActiveSemesterId(sem.id); setActiveTermId(null); }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activeSemesterId === sem.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {sem.name}
            </button>
          ))}
        </div>
      )}

      {/* Term tabs */}
      {semesterTerms.length > 0 && (
        <div className="flex items-center gap-1 border-b">
          {semesterTerms.map((term) => (
            <button
              key={term.termId}
              onClick={() => setActiveTermId(term.termId)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                activeTermId === term.termId
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
              )}
            >
              {term.termName}
            </button>
          ))}
        </div>
      )}

      {activeTerm && (
        <>
          {/* Stats + view toggle row */}
          <div className="flex items-start justify-between gap-4">
            <StatsBar students={activeTerm.students} />
            <div className="flex items-center gap-1 rounded-lg border p-1 shrink-0">
              <button
                onClick={() => setViewMode("default")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === "default"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Default
              </button>
              <button
                onClick={() => setViewMode("clean")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === "clean"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
                Clean
              </button>
            </div>
          </div>

          {/* Table */}
          {viewMode === "default" ? (
            <DefaultGradeTable
              classId={classId}
              termData={activeTerm}
              onManualCommit={handleManualCommit}
              saving={saving}
              refreshKey={refreshKey}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          ) : (
            <CleanGradeTable
              termData={activeTerm}
              onManualCommit={handleManualCommit}
            />
          )}
        </>
      )}

      {(!allTerms || allTerms.length === 0) && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-xl">
          <LayoutGrid className="h-8 w-8 opacity-30" />
          <p className="text-sm">No terms found for this class.</p>
        </div>
      )}

      {/* Lock confirm dialog */}
      <ConfirmDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        title="Lock Grades"
        destructive
        message={
          <span>
            Locking grades will publish final scores to all students and prevent
            further edits. This action requires admin override to undo.
            <br /><br />
            Are you sure you want to lock grades for this class?
          </span>
        }
        confirmLabel={locking ? "Locking..." : "Lock Grades"}
        onConfirm={handleLockGrades}
        isLoading={locking}
      />
    </div>
  );
}