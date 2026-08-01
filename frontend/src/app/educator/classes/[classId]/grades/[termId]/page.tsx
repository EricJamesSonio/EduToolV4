"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, RefreshCw, LayoutGrid, List, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useState, useCallback } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTermGrades, useComputeGrades } from "@/hooks/educator/useGrades";
import { cn } from "@/lib/utils";
import apiClient from "@/api/client";

// Re-use the same sub-components from the parent page.
// In a real codebase these would live in a shared grades/ components folder.
// For now, inline them here so this file is self-contained.

type ViewMode = "default" | "clean";

function fmt(n: number | null, decimals = 1): string {
  if (n === null) return "—";
  return n.toFixed(decimals);
}

function gradeColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 75) return "text-blue-600 dark:text-blue-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function ManualCell({
  value, studentId, category, isLocked, onCommit,
}: {
  value: number | null; studentId: string; category: string;
  isLocked: boolean; onCommit: (s: string, c: string, v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));
  const inputRef = { current: null as HTMLInputElement | null };

  const commit = () => {
    const num = parseFloat(draft);
    if (!isNaN(num) && num >= 0 && num <= 100) onCommit(studentId, category, num);
    setEditing(false);
  };

  if (isLocked) return <span className="text-xs text-muted-foreground tabular-nums">{value !== null ? fmt(value) : "—"}</span>;

  if (editing) {
    return (
      <input
        autoFocus
        type="number" min={0} max={100}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); commit(); } if (e.key === "Escape") setEditing(false); }}
        className="w-14 rounded border border-primary px-1.5 py-0.5 text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary bg-background"
      />
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

export default function TermGradesPage() {
  const { classId, termId } = useParams<{ classId: string; termId: string }>();
  const router = useRouter();

  const { data: termData, isLoading } = useTermGrades(classId, termId);
  const computeMutation = useComputeGrades(classId, termId);

  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const handleManualCommit = useCallback(async (studentId: string, category: string, value: number) => {
    const key = `${studentId}-${category}`;
    setSaving((prev) => new Set(prev).add(key));
    try {
      await apiClient.patch(
        `/classes/${classId}/grades/${termId}/students/${studentId}/manual`,
        { category, score: value }
      );
      toast.success(`${category} score updated.`);
    } catch {
      toast.error("Failed to save score.");
    } finally {
      setSaving((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [classId, termId]);

  const handleCompute = async () => {
    try {
      const res = await computeMutation.mutateAsync();
      toast.success(res.message);
    } catch {
      toast.error("Failed to compute grades.");
    }
  };

  const handleLock = async () => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading grades...
      </div>
    );
  }

  if (!termData) {
    return <p className="text-sm text-muted-foreground py-12 text-center">Term not found.</p>;
  }

  const { students, termName } = termData;
  const isClassLocked = students.every((s) => s.grade?.is_locked);
  const graded = students.filter((s) => s.grade !== null).length;
  const avg = graded > 0
    ? students.filter((s) => s.grade !== null).reduce((sum, s) => sum + (s.grade!.final_score ?? 0), 0) / graded
    : null;

  const allAssessmentIds = Array.from(
    new Map(students.flatMap((s) => s.assessmentScores.map((a) => [a.assessmentId, { id: a.assessmentId, type: a.type }]))).values()
  );
  const allCategories = Array.from(new Set(students.flatMap((s) => s.categoryBreakdown.map((c) => c.category))))
    .filter((cat) => students.some((s) => {
      const bd = s.categoryBreakdown.find((c) => c.category === cat);
      return bd?.type !== 'manual' || bd?.manualScore != null;
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={termName}
        description="View grades for this grading term."
        breadcrumbs={[
          { label: "Classes", href: "/educator/classes" },
          { label: "Class", href: `/educator/classes/${classId}` },
          { label: "Grades", href: `/educator/classes/${classId}/grades` },
          { label: termName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCompute} disabled={computeMutation.isPending} className="gap-1.5">
              {computeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Compute
            </Button>
            {!isClassLocked ? (
              <Button size="sm" variant="destructive" onClick={() => setLockDialogOpen(true)} className="gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Lock Grades
              </Button>
            ) : (
              <Badge variant="secondary" className="gap-1.5">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Students", value: students.length },
          { label: "Graded", value: `${graded}/${students.length}` },
          { label: "Class Average", value: avg !== null ? `${fmt(avg)}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border px-4 py-3">
            <p className="text-lg font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {(["default", "clean"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "default" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {mode === "default" ? "Default" : "Clean"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 border rounded-xl">
          <LayoutGrid className="h-8 w-8 opacity-30" />
          <p className="text-sm">No students found for this term.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="sticky left-0 bg-muted/50 text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground min-w-[200px]">
                    Student
                  </th>
                  {viewMode === "default"
                    ? allAssessmentIds.map((a) => (
                        <th key={a.id} className="text-center px-3 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap capitalize">
                          {a.type}
                        </th>
                      ))
                    : allCategories.map((cat) => (
                        <th key={cat} className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                          {cat}
                        </th>
                      ))
                  }
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
                    <tr key={student.studentId} className={cn("transition-colors hover:bg-muted/40", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
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

                      {viewMode === "default"
                        ? allAssessmentIds.map((a) => {
                            const score = student.assessmentScores.find((s) => s.assessmentId === a.id);
                            const earned = score?.manualScore ?? score?.score ?? null;
                            const total = score?.totalItems ?? null;
                            return (
                              <td key={a.id} className="text-center px-3 py-3">
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {earned !== null && total !== null ? `${fmt(earned, 0)}/${total}` : "—"}
                                </span>
                              </td>
                            );
                          })
                        : allCategories.map((cat) => {
                            const bd = student.categoryBreakdown.find((c) => c.category.toLowerCase() === cat.toLowerCase());
                            const isManual = bd?.manualScore !== null && bd?.manualScore !== undefined;
                            return (
                              <td key={cat} className="text-center px-4 py-3">
                                {isManual ? (
                                  <ManualCell value={bd?.manualScore ?? null} studentId={student.studentId} category={cat} isLocked={isLocked} onCommit={handleManualCommit} />
                                ) : (
                                  <span className="text-xs tabular-nums text-muted-foreground">{bd ? `${fmt(bd.rawAverage)}%` : "—"}</span>
                                )}
                              </td>
                            );
                          })
                      }

                      <td className="text-center px-4 py-3">
                        {student.grade ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn("text-sm font-bold tabular-nums", gradeColor(student.grade.final_score))}>
                              {fmt(student.grade.final_score)}%
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">{student.grade.final_grade}</span>
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
      )}

      <ConfirmDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        title="Lock Grades"
        destructive
        message="Locking grades will publish final scores to all students and prevent further edits. Admin override is required to undo."
        confirmLabel={locking ? "Locking..." : "Lock Grades"}
        onConfirm={handleLock}
        isLoading={locking}
      />
    </div>
  );
}