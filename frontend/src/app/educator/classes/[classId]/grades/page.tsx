"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Lock, Loader2, RefreshCw,
  LayoutGrid, List, X, Search,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ExcelTable, ExcelColumn } from "@/components/shared/ExcelTable";
import { WEEK_COLORS } from "@/lib/palette";
import { useQueryClient } from "@tanstack/react-query";
import { useClassGrades, useComputeGrades } from "@/hooks/educator/useGrades";
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

interface ReadinessIssue {
  type: "missing_submission" | "missing_category_assessment"
  termId?: string
  termName?: string
  studentId?: string
  studentName?: string
  studentCode?: string
  assessmentId?: string
  assessmentTitle?: string
  category?: string
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
  compact,
}: {
  value: number | null;
  studentId: string;
  category: string;
  isLocked: boolean;
  onCommit: (studentId: string, category: string, value: number) => void;
  compact?: boolean;
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
      <span className="tabular-nums text-muted-foreground leading-none">
        {value !== null ? fmt(value) : "—"}
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center justify-center">
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
          className="w-12 rounded border border-primary px-1 py-0 text-[11px] tabular-nums focus:outline-none focus:ring-1 focus:ring-primary bg-background text-center"
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => { setDraft(String(value ?? "")); setEditing(true); }}
      className="cursor-pointer text-[11px] tabular-nums text-muted-foreground hover:text-foreground"
    >
      {value !== null ? fmt(value) : "—"}
    </span>
  );
}

// ─── Status Cell ───────────────────────────────────────────────────────────────

const STATUS_ACTIONS = [
  { label: "Missed", status: "missed" as const, badge: "M", className: "bg-red-100 text-red-700 hover:bg-red-200" },
  { label: "Custom Score", status: "custom" as const, badge: "C", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
  { label: "Exempted", status: "exempted" as const, badge: "E", className: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
];

function StatusCell({
  score,
  classId,
  assessmentId,
  submissionId,
  studentId,
  isMissed,
  isExempted,
  status,
  totalItems,
  onStatusChange,
  compact,
}: {
  score: number | null;
  classId: string;
  assessmentId: string;
  submissionId?: string;
  studentId?: string;
  isMissed?: boolean;
  isExempted?: boolean;
  status: string;
  totalItems: number;
  onStatusChange: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [customScoreOpen, setCustomScoreOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleScroll() { setOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const toggleDropdown = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const up = spaceBelow < 140;
      setDropdownPos({
        top: up ? rect.top - 4 : rect.bottom + 4,
        left: rect.left + rect.width / 2,
        up,
      });
    }
    setOpen(!open);
  };

  const handleStatusAction = async (newStatus: string) => {
    const effectiveId = submissionId || (studentId ? `not_started_${studentId}` : null);
    if (!effectiveId) return;
    if (newStatus === "custom") {
      setCustomDraft(String(score ?? ""));
      setCustomScoreOpen(true);
      return;
    }
    await patchStatus(effectiveId, { status: newStatus });
  };

  const handleCustomConfirm = async () => {
    const val = parseInt(customDraft, 10);
    if (isNaN(val) || val < 0) { toast.error("Invalid score."); return; }
    if (val > totalItems) { toast.error(`Score cannot exceed ${totalItems}.`); return; }
    const effectiveId = submissionId || (studentId ? `not_started_${studentId}` : null);
    if (!effectiveId) return;
    await patchStatus(effectiveId, { status: "custom", manualScore: val });
    setCustomScoreOpen(false);
  };

  const patchStatus = async (effectiveId: string, body: any) => {
    setPending(true);
    try {
      await apiClient.patch(
        `/classes/${classId}/assessments/${assessmentId}/submissions/${effectiveId}/status`,
        body,
      );
      onStatusChange();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setPending(false);
      setOpen(false);
    }
  };

  const dropdown = dropdownPos ? (
    <div
      style={{ top: dropdownPos.top, left: dropdownPos.left }}
      className={`fixed z-50 -translate-x-1/2 w-32 rounded-lg border bg-popover shadow-lg py-1 ${dropdownPos.up ? "mb-1" : "mt-1"}`}>
      {STATUS_ACTIONS.map((action) => (
        <button
          key={action.status}
          onClick={() => { handleStatusAction(action.status); setOpen(false); }}
          disabled={pending}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 hover:bg-muted"
        >
          <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold shrink-0 ${action.className.split('hover')[0].trim()}`}>
            {action.badge}
          </span>
          {action.label}
        </button>
      ))}
    </div>
  ) : null;

  if (status === 'not_started' || (!submissionId && !score && score !== 0)) {
    return (
      <div className="relative flex justify-center" ref={ref}>
        <button
          ref={btnRef}
          onClick={toggleDropdown}
          className="text-muted-foreground/50 hover:text-foreground transition-colors leading-none"
        >
          —
        </button>
        {open && dropdown}
        {customScoreOpen && (
          <Dialog open onOpenChange={(open) => { if (!open) setCustomScoreOpen(false); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Custom Score</DialogTitle>
                <DialogDescription>Score out of {totalItems}</DialogDescription>
              </DialogHeader>
              <input
                type="number"
                min={0}
                max={totalItems}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCustomConfirm(); }}
                className="w-full rounded-md border bg-card px-3 py-2 text-sm"
                autoFocus
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomScoreOpen(false)}>Cancel</Button>
                <Button onClick={handleCustomConfirm} disabled={pending}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  const isCustom = status === 'custom' && !isMissed && !isExempted;
  const badgeLabel = isMissed ? "M" : isExempted ? "E" : isCustom ? "C" : null;
  const badgeClass = isMissed
    ? "bg-red-100 text-red-700"
    : isExempted
      ? "bg-amber-100 text-amber-700"
      : isCustom
        ? "bg-amber-100 text-amber-700"
        : "";

  return (
    <div className="relative flex justify-center" ref={ref}>
      <button
        ref={btnRef}
        onClick={toggleDropdown}
        className="tabular-nums text-muted-foreground hover:text-foreground transition-colors text-[11px] leading-none"
      >
        {isCustom ? (
          <span className="inline-flex items-center gap-0.5">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold bg-amber-100 text-amber-700">C</span>
            <span>{fmt(score, 0)}/{totalItems}</span>
          </span>
        ) : isMissed || isExempted ? (
          <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[8px] font-bold ${badgeClass}`}>
            {badgeLabel}
          </span>
        ) : score !== null ? (
          `${fmt(score, 0)}/${totalItems}`
        ) : (
          "—"
        )}
      </button>
      {open && dropdown}
      {customScoreOpen && (
        <Dialog open onOpenChange={(open) => { if (!open) setCustomScoreOpen(false); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Custom Score</DialogTitle>
              <DialogDescription>Score out of {totalItems}</DialogDescription>
            </DialogHeader>
            <input
              type="number"
              min={0}
              max={totalItems}
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCustomConfirm(); }}
              className="w-full rounded-md border bg-card px-3 py-2 text-sm"
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCustomScoreOpen(false)}>Cancel</Button>
              <Button onClick={handleCustomConfirm} disabled={pending}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Default View Table (Excel-like, per-assessment columns) ─────────────────

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

  const allAssessments = Array.from(
    new Map(
      students.flatMap((s) =>
        s.assessmentScores.map((a) => [
          a.assessmentId,
          { id: a.assessmentId, type: a.type, title: a.title, created_at: a.created_at ?? null },
        ])
      )
    ).values()
  ).sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0;
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const manualCats = Array.from(
    new Set(
      students.flatMap((s) =>
        s.categoryBreakdown
          .filter((c) => c.manualScore !== null)
          .map((c) => c.category)
      )
    )
  );

  const columns: ExcelColumn<StudentGrade>[] = [
    {
      key: "student",
      label: "Student",
      width: 200,
      sticky: true,
      render: (student) => {
        const isLocked = student.grade?.is_locked ?? false;
        const isSaving = saving.has(student.studentId);
        return (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
              {student.studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-medium truncate text-[11px]">{student.studentName}</p>
              <p className="text-[9px] text-muted-foreground font-mono leading-none">{student.studentCode}</p>
            </div>
            {isSaving && <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground shrink-0" />}
            {isLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
          </div>
        );
      },
    },
    ...allAssessments.map((a) => ({
      key: a.id,
      label: a.title ?? a.type,
      width: 80,
      render: (student: StudentGrade) => {
        const score = student.assessmentScores.find((s) => s.assessmentId === a.id);
        return (
          <div className="flex justify-center">
            <StatusCell
              score={score?.manualScore ?? score?.score ?? null}
              classId={classId}
              assessmentId={a.id}
              submissionId={score?.submissionId}
              studentId={student.studentId}
              isMissed={score?.isMissed}
              isExempted={score?.isExempted}
              status={score?.status ?? 'not_started'}
              totalItems={score?.totalItems ?? 0}
              onStatusChange={onRefresh}
              compact
            />
          </div>
        );
      },
    })),
    ...manualCats.map((cat) => ({
      key: `manual_${cat}`,
      label: cat,
      width: 75,
      render: (student: StudentGrade) => {
        const breakdown = student.categoryBreakdown.find(
          (c) => c.category.toLowerCase() === cat.toLowerCase()
        );
        return (
          <ManualCell
            value={breakdown?.manualScore ?? null}
            studentId={student.studentId}
            category={cat}
            isLocked={student.grade?.is_locked ?? false}
            onCommit={onManualCommit}
            compact
          />
        );
      },
    })),
    {
      key: "termGrade",
      label: "Grade",
      width: 70,
      render: (student) => (
        student.grade ? (
          <div className="flex items-center justify-center gap-1">
            <span className={cn("text-[11px] font-bold tabular-nums", gradeColor(student.grade.final_score))}>
              {fmt(student.grade.final_score)}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground leading-none">
              {student.grade.final_grade}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-[11px]">—</span>
        )
      ),
    },
  ];

  return <ExcelTable columns={columns} data={students} />;
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
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-xl overflow-hidden">
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
              {assessments.map((a, i) => {
                const earned = a.manualScore ?? a.score;
                return (
                  <div key={a.assessmentId} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", WEEK_COLORS[i % WEEK_COLORS.length].split(" ")[0])} />
                      <span className="text-sm font-medium capitalize">{a.type}</span>
                    </div>
                    <span className="text-sm tabular-nums">
                      {earned !== null ? (
                        <>{fmt(earned, 0)}/{a.totalItems}</>
                      ) : a.isMissed ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold">M</span>
                      ) : a.isExempted ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold">E</span>
                      ) : a.status === 'custom' ? (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold">C</span>
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

// ─── Clean View Table (Excel-like, per-category columns) ──────────────────────

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

  const allCategories = Array.from(
    new Set(students.flatMap((s) => s.categoryBreakdown.map((c) => c.category)))
  ).filter((cat) => {
    return students.some((s) => {
      const bd = s.categoryBreakdown.find((c) => c.category === cat);
      return bd?.type !== 'manual' || bd?.manualScore != null;
    });
  });

  const columns: ExcelColumn<StudentGrade>[] = [
    {
      key: "student",
      label: "Student",
      width: 200,
      sticky: true,
      render: (student) => {
        const isLocked = student.grade?.is_locked ?? false;
        return (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
              {student.studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-medium truncate text-[11px]">{student.studentName}</p>
              <p className="text-[9px] text-muted-foreground font-mono leading-none">{student.studentCode}</p>
            </div>
            {isLocked && <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
          </div>
        );
      },
    },
    ...allCategories.map((cat) => ({
      key: cat,
      label: cat,
      width: 85,
      render: (student: StudentGrade) => {
        const bd = student.categoryBreakdown.find(
          (c) => c.category.toLowerCase() === cat.toLowerCase()
        );
        const isManual = bd?.manualScore !== undefined && bd?.manualScore !== null;
        if (isManual) {
          return (
            <ManualCell
              value={bd?.manualScore ?? null}
              studentId={student.studentId}
              category={cat}
              isLocked={student.grade?.is_locked ?? false}
              onCommit={onManualCommit}
              compact
            />
          );
        }
        return (
          <span
            onClick={() => setDrillDown({ student, category: cat })}
            className="cursor-pointer underline underline-offset-2 decoration-dotted decoration-muted-foreground/40 text-[11px] tabular-nums text-foreground"
          >
            {bd ? `${fmt(bd.rawAverage)}` : "—"}
          </span>
        );
      },
    })),
    {
      key: "termGrade",
      label: "Grade",
      width: 70,
      render: (student) => (
        student.grade ? (
          <div className="flex items-center justify-center gap-1">
            <span className={cn("text-[11px] font-bold tabular-nums", gradeColor(student.grade.final_score))}>
              {fmt(student.grade.final_score)}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground leading-none">
              {student.grade.final_grade}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-[11px]">—</span>
        )
      ),
    },
  ];

  return (
    <>
      <ExcelTable columns={columns} data={students} />
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
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-xl bg-card">
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
        <div key={stat.label} className="rounded-lg border bg-card px-4 py-3">
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

  const { data: allTerms, isLoading } = useClassGrades(classId);

  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [readinessIssues, setReadinessIssues] = useState<ReadinessIssue[]>([]);
  const [readinessDialogOpen, setReadinessDialogOpen] = useState(false);
  const [publishedSearch, setPublishedSearch] = useState("");
  const qc = useQueryClient();

  // Set initial active term once data loads
  useEffect(() => {
    if (allTerms && allTerms.length > 0 && !activeTermId) {
      setActiveTermId(allTerms[0].termId);
    }
  }, [allTerms, activeTermId]);

  const activeTerm = allTerms?.find((t) => t.termId === activeTermId) ?? null;

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
      qc.invalidateQueries({ queryKey: ["grades", classId] });
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.issues) {
        setReadinessIssues(data.issues);
        setReadinessDialogOpen(true);
      } else {
        toast.error(data?.message ?? "Failed to lock grades.");
      }
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
              variant="default"
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

      {/* Term tabs */}
      {allTerms && allTerms.length > 0 && (
        <div className="flex items-center gap-2">
          {allTerms.map((term, i) => {
            const color = WEEK_COLORS[i % WEEK_COLORS.length];
            return (
              <button
                key={term.termId}
                onClick={() => setActiveTermId(term.termId)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTermId === term.termId
                    ? color + " shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {term.termName}
              </button>
            );
          })}
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
              onRefresh={() => { setRefreshKey((k) => k + 1); qc.invalidateQueries({ queryKey: ["grades", classId] }); }}
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
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-xl bg-card">
          <LayoutGrid className="h-8 w-8 opacity-30" />
          <p className="text-sm">No terms found for this class.</p>
        </div>
      )}

      {/* Published grades section */}
      {activeTerm && isClassLocked && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              Published Grades — {activeTerm.termName}
            </h3>
          </div>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                value={publishedSearch}
                onChange={(e) => setPublishedSearch(e.target.value)}
                className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground text-xs">
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium text-right">Score</th>
                    <th className="pb-2 font-medium text-right">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[...activeTerm.students]
                    .filter((s) =>
                      publishedSearch
                        ? s.studentName.toLowerCase().includes(publishedSearch.toLowerCase())
                        : true
                    )
                    .sort((a, b) => a.studentName.localeCompare(b.studentName))
                    .map((student) => (
                      <tr key={student.studentId} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {student.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <p className="font-medium truncate text-sm">{student.studentName}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{student.studentCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums font-bold">
                          {student.grade ? fmt(student.grade.final_score) : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          {student.grade ? (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {student.grade.final_grade}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
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

      {/* Readiness validation dialog */}
      <Dialog open={readinessDialogOpen} onOpenChange={setReadinessDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cannot Lock Grades
            </DialogTitle>
            <DialogDescription>
              The following issues must be resolved before grades can be locked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {readinessIssues.map((issue, i) => (
              <div key={i} className="rounded-lg border bg-card p-3 text-sm">
                {issue.type === "missing_submission" && (
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-5 h-5 rounded bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold shrink-0">M</div>
                    <div>
                      <p className="font-medium">
                        {issue.studentName}
                        <span className="font-normal text-muted-foreground"> — {issue.assessmentTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {issue.termName}
                        {issue.studentCode ? <> · {issue.studentCode}</> : null}
                      </p>
                    </div>
                  </div>
                )}
                {issue.type === "missing_category_assessment" && (
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 w-5 h-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
                    <div>
                      <p className="font-medium">
                        No assessment for category: <span className="font-bold capitalize">{issue.category}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add at least one assessment of this type to the grading scheme.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setReadinessDialogOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}