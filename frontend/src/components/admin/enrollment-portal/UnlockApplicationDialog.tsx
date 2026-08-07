"use client";

import { useState } from "react";
import { Unlock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUnlockApplication } from "@/hooks/admin/useEnrollmentApplications";

interface UnlockApplicationDialogProps {
  open: boolean;
  onClose: () => void;
}

export function UnlockApplicationDialog({ open, onClose }: UnlockApplicationDialogProps): React.JSX.Element {
  const mutation = useUnlockApplication();
  const [personalEmail, setPersonalEmail] = useState("");
  const [applicationCode, setApplicationCode] = useState("");

  const handleClose = () => {
    setPersonalEmail("");
    setApplicationCode("");
    onClose();
  };

  const canSubmit = personalEmail.trim() || applicationCode.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-4 w-4" /> Unlock an application
          </DialogTitle>
          <DialogDescription>
            An applicant contacted you to fix a locked application. Enter their email or
            application code to return it to editable status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="unlock-email">Applicant email</Label>
            <Input
              id="unlock-email"
              type="email"
              value={personalEmail}
              placeholder="you@example.com"
              onChange={(e) => setPersonalEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unlock-code">Application code</Label>
            <Input
              id="unlock-code"
              value={applicationCode}
              placeholder="e.g. AB12"
              onChange={(e) => setApplicationCode(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || mutation.isPending}
            onClick={() => {
              mutation.mutate(
                {
                  personal_email: personalEmail.trim() || undefined,
                  application_code: applicationCode.trim() || undefined,
                },
                { onSuccess: handleClose },
              );
            }}
          >
            {mutation.isPending ? "Unlocking…" : "Unlock Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}