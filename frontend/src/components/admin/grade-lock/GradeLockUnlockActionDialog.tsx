// ===== File: frontend\src\components\admin\grade-lock\GradeLockUnlockActionDialog.tsx =====
"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useGrantUnlock, useDenyUnlock } from "@/hooks/admin/useGradeLocks";
import type { UnlockRequest } from "@/types/admin/grade-lock.types";

type ActionMode = "grant" | "deny";

interface GradeLockUnlockActionDialogProps {
  target: UnlockRequest | null;
  mode: ActionMode | null;
  onClose: () => void;
}

export function GradeLockUnlockActionDialog({
  target,
  mode,
  onClose,
}: GradeLockUnlockActionDialogProps): React.ReactElement | null {
  const { mutate: grantUnlock, isPending: isGranting } = useGrantUnlock();
  const { mutate: denyUnlock, isPending: isDenying } = useDenyUnlock();
  const [reason, setReason] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  if (!target || !mode) return null;

  const handleClose = () => {
    setReason("");
    setNewDeadline("");
    onClose();
  };

  const handleGrant = () => {
    grantUnlock(
      {
        classId: target.class_id,
        reason: reason.trim(),
        newDeadline: newDeadline ? new Date(newDeadline).toISOString() : undefined,
      },
      { onSuccess: handleClose },
    );
  };

  const handleDeny = () => {
    denyUnlock(
      { classId: target.class_id, reason: reason.trim() },
      { onSuccess: handleClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-background p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {mode === "grant" ? (
            <>
              <CheckCircle className="h-5 w-5 text-success" /> Grant Unlock
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-destructive" /> Deny Unlock
            </>
          )}
        </h2>

        <p className="text-sm text-muted-foreground">
          {mode === "grant"
            ? `Grant unlock for ${target.className} (${target.educatorName})`
            : `Deny unlock for ${target.className} (${target.educatorName})`}
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="action-reason">Reason</Label>
            <Textarea
              id="action-reason"
              placeholder="Provide a reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {mode === "grant" && (
            <div className="space-y-1.5">
              <Label htmlFor="action-deadline">
                New Deadline <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="action-deadline"
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {mode === "grant" ? (
            <Button disabled={isGranting || !reason.trim()} onClick={handleGrant}>
              {isGranting ? "Granting..." : "Grant Unlock"}
            </Button>
          ) : (
            <Button variant="destructive" disabled={isDenying || !reason.trim()} onClick={handleDeny}>
              {isDenying ? "Denying..." : "Deny Unlock"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}