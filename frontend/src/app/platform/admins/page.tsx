"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { AdminTable } from "@/components/platform/AdminTable";
import { CreateAdminDialog } from "@/components/platform/CreateAdminDialog";
import { AdminCredentialsCard } from "@/components/platform/AdminCredentialsCard";
import { platformApi } from "@/api/platform.api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { AdminAccount } from "@/types/platform.types";

export default function PlatformAdminsPage() {
  const queryClient = useQueryClient();

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    type: "reset" | "block" | "unblock";
    admin: AdminAccount;
  } | null>(null);

  // Credentials to show after reset
  const [resetCredentials, setResetCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
  } | null>(null);

  // Fetch admins
  const { data, isLoading } = useQuery({
    queryKey: ["platform", "admins", { search, page, limit }],
    queryFn: () => platformApi.getAdmins({ search: search || undefined, page, limit }),
  });

  const admins = data?.data ?? [];
  const total = data?.total ?? 0;

  // Mutations
  const resetMutation = useMutation({
    mutationFn: (id: string) => platformApi.resetAdminPassword(id),
    onSuccess: (result) => {
      toast.success("Password reset. New credentials ready.");
      setResetCredentials({
        fullName: confirmState?.admin.fullName ?? "",
        email: result.email,
        password: result.password,
      });
      setConfirmState(null);
    },
    onError: () => toast.error("Failed to reset password."),
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => platformApi.blockAdmin(id),
    onSuccess: () => {
      toast.success("Admin blocked.");
      queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });
      setConfirmState(null);
    },
    onError: () => toast.error("Failed to block admin."),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => platformApi.unblockAdmin(id),
    onSuccess: () => {
      toast.success("Admin unblocked.");
      queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });
      setConfirmState(null);
    },
    onError: () => toast.error("Failed to unblock admin."),
  });

  const handleConfirm = () => {
    if (!confirmState) return;
    const { type, admin } = confirmState;
    if (type === "reset") resetMutation.mutate(admin.id);
    if (type === "block") blockMutation.mutate(admin.id);
    if (type === "unblock") unblockMutation.mutate(admin.id);
  };

  const isMutating =
    resetMutation.isPending ||
    blockMutation.isPending ||
    unblockMutation.isPending;

  // Confirm dialog copy
  const confirmCopy = confirmState
    ? {
        reset: {
          title: "Reset password?",
          message: `Reset password for ${confirmState.admin.fullName ?? confirmState.admin.email}? A new password will be generated.`,
          confirmLabel: "Reset Password",
          destructive: false,
        },
        block: {
          title: "Block admin?",
          message: `Block ${confirmState.admin.fullName ?? confirmState.admin.email}? They will no longer be able to log in.`,
          confirmLabel: "Block",
          destructive: true,
        },
        unblock: {
          title: "Unblock admin?",
          message: `Unblock ${confirmState.admin.fullName ?? confirmState.admin.email}? They will regain login access.`,
          confirmLabel: "Unblock",
          destructive: false,
        },
      }[confirmState.type]
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Accounts"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Admin
          </Button>
        }
      />

      {/* Search */}
      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by name or email..."
        className="max-w-sm"
      />

      {/* Table */}
      <AdminTable
        data={admins}
        isLoading={isLoading}
        onResetPassword={(admin) => setConfirmState({ type: "reset", admin })}
        onBlock={(admin) => setConfirmState({ type: "block", admin })}
        onUnblock={(admin) => setConfirmState({ type: "unblock", admin })}
      />

      {/* Pagination */}
      {total > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      )}

      {/* Create Admin dialog */}
      <CreateAdminDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: ["platform", "admins"] })
        }
      />

      {/* Confirm dialog */}
      {confirmState && confirmCopy && (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          message={confirmCopy.message}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          isLoading={isMutating}
          onConfirm={handleConfirm}
          onOpenChange={(open) => {
  if (!open) setConfirmState(null);
}}
        />
      )}

      {/* Reset password credentials card */}
      {resetCredentials && (
        <AdminCredentialsCard
          open
          credentials={resetCredentials}
          title="Password reset successfully"
          onClose={() => {
            setResetCredentials(null);
            queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });
          }}
        />
      )}
    </div>
  );
}