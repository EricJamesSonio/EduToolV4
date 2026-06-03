"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Lock, Loader2, RefreshCw,
  LayoutGrid, List, Clock, Unlock, Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WEEK_COLORS } from "@/lib/palette";
import { useQueryClient } from "@tanstack/react-query";
import { useClassGrades, useComputeGrades } from "@/hooks/educator/useGrades";
import { cn } from "@/lib/utils";
import apiClient from "@/api/client";
import { useClassGradeLock, useRequestUnlock } from "@/hooks/educator/useGradeLock";

import type { ViewMode, ReadinessIssue } from "@/components/educator/grades";
import { DefaultGradeTable, CleanGradeTable, StatsBar, ReadinessDialog, RequestUnlockDialog } from "@/components/educator/grades";

export default function GradesPage() {
  const { classId } = useParams<{ classId: string }>();

  const { data: allTerms, isLoading } = useClassGrades(classId);

  const [activeTermId, setActiveTermId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("default");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [readinessIssues, setReadinessIssues] = useState<ReadinessIssue[]>([]);
  const [readinessDialogOpen, setReadinessDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const requestUnlockMutation = useRequestUnlock(classId);
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
      qc.invalidateQueries({ queryKey: ["grade-lock", classId] });
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

  const handleUnlockGrades = async () => {
    setUnlocking(true);
    try {
      await apiClient.post(`/grade-lock/${classId}/unlock`, { reason: "Educator unlocked grades" });
      toast.success("Grades unlocked successfully.");
      setUnlockConfirmOpen(false);
      qc.invalidateQueries({ queryKey: ["grades", classId] });
      qc.invalidateQueries({ queryKey: ["grade-lock", classId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to unlock grades.");
    } finally {
      setUnlocking(false);
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

  const { data: lockInfo, isLoading: lockInfoLoading } = useClassGradeLock(classId);
  const isClassLocked = lockInfo?.is_locked ?? false;

  const handleRequestUnlock = (reason: string) => {
    requestUnlockMutation.mutate(reason, {
      onSuccess: () => {
        setUnlockDialogOpen(false);
      },
    });
  };

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
            <Link href={`/educator/classes/${classId}/published-grades`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                View Grades
              </Button>
            </Link>
            {!isClassLocked && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setLockDialogOpen(true)}
                className="gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                Publish All
              </Button>
            )}
            {isClassLocked && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUnlockConfirmOpen(true)}
                  className="gap-1.5"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Unlock Grades
                </Button>
                {!lockInfo?.hasPendingRequest && (
                  <button
                    onClick={() => setUnlockDialogOpen(true)}
                    className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Request admin unlock
                  </button>
                )}
                {lockInfo?.hasPendingRequest && (
                  <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-300">
                    <Clock className="h-3 w-3" />
                    Unlock Pending
                  </Badge>
                )}
              </>
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

      {/* Grade lock info bar */}
      {!lockInfoLoading && lockInfo && lockInfo.is_locked && (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-2.5 text-sm">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">Grades Locked</span>
          {lockInfo.setting && (
            <span className="text-muted-foreground">
              · Template: {lockInfo.setting.name}
            </span>
          )}
          {lockInfo.deadline && (
            <span className="text-muted-foreground">
              · Deadline: {new Date(lockInfo.deadline).toLocaleDateString()}
            </span>
          )}
          {lockInfo.hasPendingRequest && (
            <Badge variant="outline" className="ml-auto gap-1.5 text-amber-600 border-amber-300">
              <Clock className="h-3 w-3" />
              Unlock Request Pending
            </Badge>
          )}
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
              isLocked={isClassLocked}
              onRefresh={() => { setRefreshKey((k) => k + 1); qc.invalidateQueries({ queryKey: ["grades", classId] }); }}
            />
          ) : (
            <CleanGradeTable
              termData={activeTerm}
              onManualCommit={handleManualCommit}
              isLocked={isClassLocked}
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

      {/* Lock confirm dialog */}
      <ConfirmDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        title="Publish All Grades"
        destructive
        message={
          <span>
            Publishing will make final scores visible to all students and prevent
            further edits. This action requires admin override to undo.
            <br /><br />
            Are you sure you want to publish all grades for this class?
          </span>
        }
        confirmLabel={locking ? "Publishing..." : "Publish All"}
        onConfirm={handleLockGrades}
        isLoading={locking}
      />

      {/* Unlock confirm dialog */}
      <ConfirmDialog
        open={unlockConfirmOpen}
        onOpenChange={setUnlockConfirmOpen}
        title="Unlock Grades"
        message={
          <span>
            Unlocking grades will allow editing of scores and statuses again.
            Are you sure you want to unlock grades for this class?
          </span>
        }
        confirmLabel={unlocking ? "Unlocking..." : "Unlock Grades"}
        onConfirm={handleUnlockGrades}
        isLoading={unlocking}
      />

      <RequestUnlockDialog
        open={unlockDialogOpen}
        onOpenChange={setUnlockDialogOpen}
        onSubmit={handleRequestUnlock}
        isLoading={requestUnlockMutation.isPending}
      />

      <ReadinessDialog
        open={readinessDialogOpen}
        onOpenChange={setReadinessDialogOpen}
        issues={readinessIssues}
      />
    </div>
  );
}