"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRejectApplication } from "@/hooks/admin/useEnrollmentApplications";

interface RejectApplicationDialogProps {
  open: boolean;
  application: { id: string } | null;
  onClose: () => void;
}

export function RejectApplicationDialog({
  open,
  application,
  onClose,
}: RejectApplicationDialogProps): React.JSX.Element {
  const mutation = useRejectApplication();
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Reject application</span>
          </DialogTitle>
          <DialogDescription>
            Rejecting is not permanent — the applicant can edit and resubmit after seeing the
            reason. A reason is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="reject-reason">Reason</Label>
          <Textarea
            id="reject-reason"
            rows={4}
            value={reason}
            placeholder="Why is this application being rejected?"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || mutation.isPending}
            onClick={() => {
              if (!application) return;
              mutation.mutate(
                { id: application.id, reason: reason.trim() },
                { onSuccess: handleClose },
              );
            }}
          >
            {mutation.isPending ? "Rejecting…" : "Reject Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}