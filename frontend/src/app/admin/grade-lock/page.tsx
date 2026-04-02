"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Lock, Unlock, Settings, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  useGradeLocks,
  useGradeLockSetting,
  useCreateGradeLockSetting,
  useUpdateGradeLockSetting,
  useUnlockOverride,
} from "@/hooks/admin/useGradeLocks";
import type { GradeLock, GradeLockStatus } from "@/types/admin/grade-lock.types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function lockStatusVariant(
  status: GradeLockStatus
): "default" | "success" | "destructive" | "secondary" | "warning" {
  switch (status) {
    case "locked":
      return "destructive";
    case "auto_locked":
      return "warning";
    default:
      return "secondary";
  }
}

function lockStatusLabel(status: GradeLockStatus): string {
  switch (status) {
    case "locked":
      return "Locked";
    case "auto_locked":
      return "Auto-Locked";
    default:
      return "Unlocked";
  }
}

// ─── GradeLockSettingModal ─────────────────────────────────────────────────────

interface GradeLockSettingModalProps {
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
  existingDeadline?: string | null;
}

function GradeLockSettingModal({
  open,
  onClose,
  schoolYearId,
  existingDeadline,
}: GradeLockSettingModalProps) {
  const isEdit = !!existingDeadline;
  const [deadline, setDeadline] = useState(
    existingDeadline
      ? new Date(existingDeadline).toISOString().slice(0, 16)
      : ""
  );

  const createMutation = useCreateGradeLockSetting();
  const updateMutation = useUpdateGradeLockSetting();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async () => {
    if (!deadline) return;
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ schoolYearId, lockDeadline: new Date(deadline).toISOString() });
      } else {
        await createMutation.mutateAsync({ schoolYearId, lockDeadline: new Date(deadline).toISOString() });
      }
      toast.success(isEdit ? "Lock window updated." : "Lock window opened. Educators have been notified.");
      onClose();
    } catch {
      toast.error("Failed to save grade lock setting.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {isEdit ? "Update Lock Window" : "Open Lock Window"}
          </DialogTitle>
          <DialogDescription>
            Set the deadline by which educators must lock their class grades.
            After this date, grades will be auto-locked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="lock-deadline">Lock Deadline</Label>
            <Input
              id="lock-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Educators will be notified and must lock grades by this date.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!deadline || isPending}>
            {isPending ? "Saving…" : isEdit ? "Update Window" : "Open Window"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── GradeLockOverrideDialog ───────────────────────────────────────────────────

interface GradeLockOverrideDialogProps {
  open: boolean;
  onClose: () => void;
  gradeLock: GradeLock | null;
}

function GradeLockOverrideDialog({
  open,
  onClose,
  gradeLock,
}: GradeLockOverrideDialogProps) {
  const [reason, setReason] = useState("");
  const unlockMutation = useUnlockOverride();

  const handleConfirm = async () => {
    if (!gradeLock || !reason.trim()) return;
    try {
      await unlockMutation.mutateAsync({ classId: gradeLock.classId, reason });
      toast.success(`Grades unlocked for ${gradeLock.className}. Action logged.`);
      setReason("");
      onClose();
    } catch {
      toast.error("Failed to override grade lock.");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Override Grade Lock
          </DialogTitle>
          <DialogDescription>
            Unlock grades for{" "}
            <span className="font-medium text-foreground">
              {gradeLock?.className}
            </span>
            ? This action will be permanently logged in the Audit Log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Unlocking is irreversible without initiating another grade lock.
            The educator will be able to modify grades again.
          </div>

          <div className="space-y-2">
            <Label htmlFor="override-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="override-reason"
              placeholder="Provide a reason for this override (required for audit log)…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={unlockMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || unlockMutation.isPending}
          >
            {unlockMutation.isPending ? "Processing…" : "Confirm Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

// NOTE: Replace with actual active school year from context/store
const ACTIVE_SCHOOL_YEAR_ID = "active-school-year-id";
const ACTIVE_SCHOOL_YEAR_LABEL = "S.Y. 2024–2025";

export default function GradeLockPage() {
  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<GradeLock | null>(null);

  const { data: gradeLocks, isLoading } = useGradeLocks();
  const { data: setting } = useGradeLockSetting(ACTIVE_SCHOOL_YEAR_ID);

  // ── table columns ──────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<GradeLock>[]>(
    () => [
      {
        accessorKey: "className",
        header: "Class",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.className}</span>
        ),
      },
      {
        accessorKey: "educatorName",
        header: "Educator",
      },
      {
        accessorKey: "semesterName",
        header: "Semester",
      },
      {
        accessorKey: "termName",
        header: "Term",
      },
      {
        accessorKey: "lockStatus",
        header: "Lock Status",
        cell: ({ row }) => {
          const status = row.original.lockStatus;
          return (
            <Badge variant={lockStatusVariant(status)}>
              {lockStatusLabel(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "deadline",
        header: "Deadline",
        cell: ({ row }) => {
          const deadline = row.original.deadline;
          if (!deadline) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="tabular-nums text-sm">
              {format(new Date(deadline), "MMM d, yyyy h:mm a")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const lock = row.original;
          const isLocked =
            lock.lockStatus === "locked" || lock.lockStatus === "auto_locked";

          return (
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOverrideTarget(lock);
                  }}
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Override Lock
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  // ── summary counts ─────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const all = Array.isArray(gradeLocks) ? gradeLocks : [];
    return {
      total: all.length,
      locked: all.filter((l) => l.lockStatus === "locked").length,
      autoLocked: all.filter((l) => l.lockStatus === "auto_locked").length,
      unlocked: all.filter((l) => l.lockStatus === "unlocked").length,
    };
  }, [gradeLocks]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader
        title="Grade Lock"
        description="Manage grade submission deadlines and lock status per class."
        actions={
          <Button
            onClick={() => setSettingModalOpen(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            {setting ? "Update Lock Window" : "Open Lock Window"}
          </Button>
        }
      />

      {/* Active school year + lock window info */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Active School Year</span>
          <span className="font-medium">{ACTIVE_SCHOOL_YEAR_LABEL}</span>
        </div>
        {setting?.deadline && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Lock deadline:</span>
            <span className="font-medium">
              {format(new Date(setting.deadline), "MMM d, yyyy h:mm a")}
            </span>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Classes", value: counts.total, colorClass: "" },
          { label: "Unlocked", value: counts.unlocked, colorClass: "text-muted-foreground" },
          { label: "Locked", value: counts.locked, colorClass: "text-destructive" },
          { label: "Auto-Locked", value: counts.autoLocked, colorClass: "text-amber-600 dark:text-amber-400" },
        ].map(({ label, value, colorClass }) => (
          <div
            key={label}
            className="rounded-md bg-muted/40 p-4"
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-medium ${colorClass}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Class lock table */}
      <DataTable
        columns={columns}
        data={Array.isArray(gradeLocks) ? gradeLocks : []}
        isLoading={isLoading}
        emptyTitle="No classes found"
        emptyDescription="No grade lock records exist yet. Open a lock window to get started."
      />

      {/* Modals */}
      <GradeLockSettingModal
        open={settingModalOpen}
        onClose={() => setSettingModalOpen(false)}
        schoolYearId={ACTIVE_SCHOOL_YEAR_ID}
        existingDeadline={setting?.deadline}
      />

      <GradeLockOverrideDialog
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        gradeLock={overrideTarget}
      />
    </div>
  );
}