"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import { type RegistrationRequest } from "@/api/platform/registration.api";

const statusBadge: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/20 dark:bg-warning/20 dark:text-warning",
  approved: "bg-success/15 text-success border-success/20 dark:bg-success/20 dark:text-success",
  rejected: "bg-destructive/10 text-destructive",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

// ── View Dialog ───────────────────────────────────────

interface ViewDialogProps {
  request: RegistrationRequest | null;
  onClose: () => void;
  onApprove: (req: RegistrationRequest) => void;
  onReject: (req: RegistrationRequest) => void;
}

export function RequestViewDialog({ request, onClose, onApprove, onReject }: ViewDialogProps) {
  return (
    <Dialog open={!!request} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registration Request</DialogTitle>
          <DialogDescription>
            Submitted on{" "}
            {request ? new Date(request.created_at).toLocaleDateString() : ""}
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-5 py-1">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusBadge[request.status] ?? ""
              }`}
            >
              {request.status}
            </span>

            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
              <DetailRow label="Full Name" value={request.full_name} />
              <DetailRow label="Email" value={request.email} />
              <DetailRow label="Institution" value={request.institution_name ?? ""} />
              <DetailRow label="Role" value={request.role ?? ""} />
              <DetailRow label="Student Count" value={request.student_count ?? ""} />
              <DetailRow label="Departments" value={request.programs_departments ?? ""} />
              <DetailRow label="Plan" value={request.plan ?? ""} />
            </div>

            {request.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={() => onApprove(request)}>
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => onReject(request)}
                >
                  Reject
                </Button>
              </div>
            )}

            {request.status === "approved" && (
              <p className="text-sm text-muted-foreground text-center">
                Credentials were sent by email at the time of approval. The password cannot be resent as it is not stored in plaintext.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Approve Dialog ────────────────────────────────────

interface ApproveDialogProps {
  request: RegistrationRequest | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (id: string, email: string) => void;
}

export function RequestApproveDialog({ request, isLoading, onClose, onConfirm }: ApproveDialogProps) {
  const [adminEmail, setAdminEmail] = useState(request?.email ?? "");

  // Sync email when request changes
  if (request && adminEmail !== request.email && adminEmail === "") {
    setAdminEmail(request.email);
  }

  return (
    <Dialog open={!!request} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Registration</DialogTitle>
          <DialogDescription>
            Confirm the admin email for <strong>{request?.full_name ?? ""}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input
              id="admin-email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@school.edu"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => request && onConfirm(request.id, adminEmail)}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Admin Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Credentials Dialog ────────────────────────────────

interface CredentialsDialogProps {
  credentials: { email: string; fullName: string; password: string } | null;
  onClose: () => void;
}

export function CredentialsDialog({ credentials, onClose }: CredentialsDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(credentials.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Dialog open={!!credentials} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Created</DialogTitle>
          <DialogDescription>
            Save these credentials. They will not be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Email</p>
            <p className="text-sm font-mono text-foreground">{credentials?.email ?? ""}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Password</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-foreground flex-1">
                {credentials?.password ?? ""}
              </p>
              <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Credentials have been sent to the admins email automatically.
        </p>
        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}