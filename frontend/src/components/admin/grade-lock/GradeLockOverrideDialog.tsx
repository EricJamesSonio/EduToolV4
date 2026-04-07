"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUnlockOverride } from "@/hooks/admin/useGradeLocks";
import type { GradeLock } from "@/types/admin/grade-lock.types";

interface GradeLockOverrideDialogProps {
  open: boolean;
  onClose: () => void;
  gradeLock: GradeLock | null;
}

export function GradeLockOverrideDialog({
  open,
  onClose,
  gradeLock,
}: GradeLockOverrideDialogProps): React.ReactElement {
  const [reason, setReason] = useState("");
  const unlockMutation = useUnlockOverride();

  const handleConfirm = async (): Promise<void> => {
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

  const handleClose = (): void => {
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
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={unlockMutation.isPending}
          >
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