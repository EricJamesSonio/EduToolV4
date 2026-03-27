"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { platformApi } from "@/api/platform.api";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminCredentialsCard } from "@/components/platform/AdminCredentialsCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/date.util";
import { KeyRound, ShieldOff, ShieldCheck, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [confirmType, setConfirmType] = useState<"reset" | "block" | "unblock" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [resetCredentials, setResetCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
  } | null>(null);

  const { data: admin, isLoading } = useQuery({
    queryKey: ["platform", "admins", id],
    queryFn: () => platformApi.getAdmin(id),
    enabled: !!id,
  });

  const resetMutation = useMutation({
    mutationFn: () => platformApi.resetAdminPassword(id),
    onSuccess: (result) => {
      toast.success("Password reset successfully.");
      setResetCredentials({
        fullName: admin?.fullName ?? "",
        email: result.email,
        password: result.password,
      });
      setConfirmType(null);
    },
    onError: () => toast.error("Failed to reset password."),
  });

  const blockMutation = useMutation({
    mutationFn: () => platformApi.blockAdmin(id),
    onSuccess: () => {
      toast.success("Admin blocked.");
      queryClient.invalidateQueries({ queryKey: ["platform", "admins", id] });
      setConfirmType(null);
    },
    onError: () => toast.error("Failed to block admin."),
  });

  const unblockMutation = useMutation({
    mutationFn: () => platformApi.unblockAdmin(id),
    onSuccess: () => {
      toast.success("Admin unblocked.");
      queryClient.invalidateQueries({ queryKey: ["platform", "admins", id] });
      setConfirmType(null);
    },
    onError: () => toast.error("Failed to unblock admin."),
  });

  const handleConfirm = () => {
    if (confirmType === "reset") resetMutation.mutate();
    if (confirmType === "block") blockMutation.mutate();
    if (confirmType === "unblock") unblockMutation.mutate();
  };

  const isMutating =
    resetMutation.isPending || blockMutation.isPending || unblockMutation.isPending;

  const handleCopyPassword = async () => {
    const pwd = (admin as any)?.password;
    if (!pwd) return;
    await navigator.clipboard.writeText(pwd);
    setPasswordCopied(true);
    toast.success("Password copied.");
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Admin not found.
      </div>
    );
  }

  const isBlocked = admin.status === "blocked";

  const confirmCopy =
    confirmType === "reset"
      ? {
          title: "Reset password?",
          message: `Reset password for ${admin.fullName ?? admin.email}? A new password will be generated.`,
          confirmLabel: "Reset Password",
          destructive: false,
        }
      : confirmType === "block"
      ? {
          title: "Block admin?",
          message: `Block ${admin.fullName ?? admin.email}? They will no longer be able to log in.`,
          confirmLabel: "Block",
          destructive: true,
        }
      : confirmType === "unblock"
      ? {
          title: "Unblock admin?",
          message: `Unblock ${admin.fullName ?? admin.email}? They will regain login access.`,
          confirmLabel: "Unblock",
          destructive: false,
        }
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Admins", href: "/platform/admins" },
          { label: admin.fullName ?? admin.email },
        ]}
        title={admin.fullName ?? admin.email}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmType("reset")}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Reset Password
            </Button>
            {isBlocked ? (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => setConfirmType("unblock")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Unblock
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setConfirmType("block")}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Block
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 max-w-2xl">
        {/* Info Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <InfoRow label="Full Name" value={admin.fullName ?? "—"} />
            <Separator />
            <InfoRow label="Email" value={admin.email} />
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={admin.status} />
            </div>
            <Separator />
            <InfoRow label="Created Date" value={formatDate(admin.createdAt)} />
          </CardContent>
        </Card>

        {/* Password section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Current Password</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <><EyeOff className="mr-1.5 h-4 w-4" /> Hide</>
                ) : (
                  <><Eye className="mr-1.5 h-4 w-4" /> Show Password</>
                )}
              </Button>
            </div>

            {showPassword && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                <span className="flex-1 font-mono text-sm select-all">
                  {(admin as any).password ?? "••••••••••••"}
                </span>
                <button
                  onClick={handleCopyPassword}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy password"
                >
                  {passwordCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}

            {!showPassword && (
              <p className="text-sm text-muted-foreground">
                Click "Show Password" to reveal the stored plain-text password.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      {confirmType && confirmCopy && (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          isLoading={isMutating}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmType(null)}
        />
      )}

      {/* Credentials after reset */}
      {resetCredentials && (
        <AdminCredentialsCard
          open
          credentials={resetCredentials}
          title="Password reset successfully"
          onClose={() => setResetCredentials(null)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}