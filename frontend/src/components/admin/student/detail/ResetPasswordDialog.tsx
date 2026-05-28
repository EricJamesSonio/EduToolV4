"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Check, KeyRound } from "lucide-react";
import type { AxiosError } from "axios";
import { studentApi } from "@/api/admin/student.api";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export function ResetPasswordDialog({
  open,
  studentId,
  studentName,
  onClose,
}: Props): React.JSX.Element {
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => studentApi.resetPassword(studentId),
    onSuccess: (data) => {
      setNewPassword(data.plainPassword);
      toast.success("Password reset successfully.");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to reset password.");
    },
  });

  async function handleCopy() {
    if (!newPassword) return;
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setNewPassword(null);
    setCopied(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Reset Password" size="sm">

        {!newPassword ? (
          <>
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                Generate a new password for{" "}
                <span className="font-medium text-foreground">{studentName}</span>.
                Their old password will be invalidated immediately.
              </p>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                <KeyRound className="mr-1.5 h-4 w-4" />
                {mutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                New password generated. Copy it now — it won't be shown again.
              </p>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={newPassword}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <ModalFooter>
              <Button onClick={handleClose}>Done</Button>
            </ModalFooter>
          </>
        )}
    </Modal>
  );
}