"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, ShieldOff, ShieldCheck, Mail, Calendar, Shield } from "lucide-react";
import { platformApi } from "@/api/platform.api";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminCredentialsCard } from "@/components/platform/AdminCredentialsCard";
import { formatDate } from "@/utils/date.util";
import { useState } from "react";
import type { AdminAccount } from "@/types/platform.types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminDetailPage({ params }: PageProps): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmType, setConfirmType] = useState<"reset" | "block" | "unblock" | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
  } | null>(null);

  const { data: admin, isLoading } = useQuery({
    queryKey: ["platform", "admins", id],
    queryFn: () => platformApi.getAdmin(id),
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
      queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });
      setConfirmType(null);
    },
    onError: () => toast.error("Failed to block admin."),
  });

  const unblockMutation = useMutation({
    mutationFn: () => platformApi.unblockAdmin(id),
    onSuccess: () => {
      toast.success("Admin unblocked.");
      queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });
      setConfirmType(null);
    },
    onError: () => toast.error("Failed to unblock admin."),
  });

  const isMutating = resetMutation.isPending || blockMutation.isPending || unblockMutation.isPending;
  const isBlocked = admin?.status === "suspended";

  const handleConfirm = () => {
    if (confirmType === "reset") resetMutation.mutate();
    if (confirmType === "block") blockMutation.mutate();
    if (confirmType === "unblock") unblockMutation.mutate();
  };

  const confirmCopy = confirmType
    ? {
        reset: {
          title: "Reset password?",
          message: `A new password will be generated for ${admin?.fullName ?? admin?.email}.`,
          confirmLabel: "Reset Password",
          destructive: false,
        },
        block: {
          title: "Block admin?",
          message: `${admin?.fullName ?? admin?.email} will no longer be able to log in.`,
          confirmLabel: "Block",
          destructive: true,
        },
        unblock: {
          title: "Unblock admin?",
          message: `${admin?.fullName ?? admin?.email} will regain login access.`,
          confirmLabel: "Unblock",
          destructive: false,
        },
      }[confirmType]
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Admin not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admins
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            {admin.fullName ?? "Unnamed Admin"}
          </h1>
          <p className="text-sm text-muted-foreground">{admin.email}</p>
        </div>
        <StatusBadge status={admin.status} />
      </div>

      {/* Details card */}
      <div className="rounded-lg border bg-card divide-y">
        <DetailRow icon={Mail} label="Email" value={admin.email} />
        <DetailRow
          icon={Calendar}
          label="Created"
          value={formatDate(admin.createdAt)}
        />
        <DetailRow
          icon={Shield}
          label="Role"
          value="Admin"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmType("reset")}
          disabled={isMutating}
        >
          <KeyRound className="mr-1.5 h-4 w-4" />
          Reset Password
        </Button>

        {isBlocked ? (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
            onClick={() => setConfirmType("unblock")}
            disabled={isMutating}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" />
            Unblock Admin
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => setConfirmType("block")}
            disabled={isMutating}
          >
            <ShieldOff className="mr-1.5 h-4 w-4" />
            Block Admin
          </Button>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmType && confirmCopy && (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          isLoading={isMutating}
          onConfirm={handleConfirm}
          onOpenChange={(open) => { if (!open) setConfirmType(null); }}
        />
      )}

      {/* Credentials card after reset */}
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

// ─── Detail Row ───────────────────────────────────────────────────────────────

interface DetailRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="w-28 text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}