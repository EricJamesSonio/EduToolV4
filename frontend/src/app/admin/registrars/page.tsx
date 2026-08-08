"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserCog, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useResetRegistrarPassword, useUpdateRegistrarStatus } from "@/hooks/admin/useRegistrars";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { registrarApi, DEFAULT_PAGE_SIZE } from "@/api/admin/registrar.api";
import { useOrganization } from "@/hooks/admin/useOrganization";
import type { Registrar } from "@/types/admin/registrar.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RegistrarTable } from "@/components/admin/registrar/RegistrarTable";
import { CreateRegistrarDialog } from "@/components/admin/registrar/CreateRegistrarDialog";
import { RegistrarCredentialsCard } from "@/components/admin/registrar/RegistrarCredentialsCard";
import type { AxiosError } from "axios";

export default function RegistrarsPage(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(DEFAULT_PAGE_SIZE);
  const [createOpen, setCreateOpen]     = useState(false);
  const [resetTarget, setResetTarget]   = useState<Registrar | null>(null);
  const [statusTarget, setStatusTarget] = useState<Registrar | null>(null);
  const [newCredentials, setNewCredentials] = useState<{
    username: string; email: string; password: string;
  } | null>(null);

  const {
    data: registrarsResp,
    isLoading,
    isError,
  } = useAsyncQuery(
    [...queryKeys.admin.registrars.list({ search }), page, limit],
    () => registrarApi.getPage({ search: search || undefined, page, limit }),
  );

  const registrars = registrarsResp?.data ?? [];
  const totalRegistrars = registrarsResp?.meta?.total ?? 0;
  const totalRegistrarPages = registrarsResp?.meta?.totalPages ?? 1;
  const { data: org, isLoading: orgLoading } = useOrganization();
  const hasEmailExtension = !!org?.emailExtension;

  const resetMutation = useResetRegistrarPassword();
  const statusMutation = useUpdateRegistrarStatus();

  useEffect(() => {
    if (page > totalRegistrarPages) setPage(Math.max(1, totalRegistrarPages));
  }, [page, totalRegistrarPages]);

  const handleResetConfirm = () => {
    if (!resetTarget) return;
    resetMutation.mutate(resetTarget.id, {
      onSuccess: (result) => {
        setResetTarget(null);
        setNewCredentials({
          username: resetTarget.username,
          email: resetTarget.email,
          password: result.plainPassword,
        });
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message ?? "Failed to reset password.");
        setResetTarget(null);
      },
    });
  };

  const handleStatusConfirm = () => {
    if (!statusTarget) return;
    const next = statusTarget.status === "active" ? "suspended" : "active";
    statusMutation.mutate(
      { id: statusTarget.id, status: next },
      { onSettled: () => setStatusTarget(null) },
    );
  };

  const handleSetupEmail = () => {
    router.push("/admin/organization");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrars"
        actions={
          <div className="flex items-center gap-2">
            {hasEmailExtension ? (
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                New Registrar
              </Button>
            ) : (
              <Button
                onClick={handleSetupEmail}
                size="sm"
                variant="destructive"
                disabled={orgLoading}
              >
                <AlertCircle className="mr-1.5 h-4 w-4" />
                Setup Email Extension
              </Button>
            )}
          </div>
        }
      />

      {!hasEmailExtension && !orgLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="not-interactive">You need to set up an email extension before creating registrars. Go to{" "}</span>
            <button
              onClick={handleSetupEmail}
              className="underline font-semibold hover:opacity-80"
            >
              Organization Settings
            </button>
            {" "}to configure it.
          </AlertDescription>
        </Alert>
      )}

      <SearchInput
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by username or email..."
        className="max-w-sm"
      />

      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={registrars.length === 0}
        empty={{
          icon: UserCog,
          title: "No registrars found",
          description:
            search
              ? "Try a different search term."
              : hasEmailExtension
              ? "Create your first registrar to get started."
              : "Setup email extension first to create registrars.",
          action:
            !search && hasEmailExtension
              ? { label: "New Registrar", onClick: () => setCreateOpen(true) }
              : !search
              ? { label: "Setup Email Extension", onClick: handleSetupEmail }
              : undefined,
        }}
        loading={
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <>
          <RegistrarTable
            data={registrars}
            onResetPassword={setResetTarget}
            onToggleStatus={setStatusTarget}
          />
          <Pagination
            page={page}
            limit={limit}
            total={totalRegistrars}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            pageSizeOptions={[20, 50, 100]}
          />
        </>
      </AsyncListState>

      {createOpen && hasEmailExtension && (
        <CreateRegistrarDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Reset password confirm */}
      <ConfirmDialog
        open={resetTarget !== null}
        onOpenChange={(o) => { if (!o) setResetTarget(null); }}
        title="Reset password?"
        message={`This will generate a new password for ${resetTarget?.username}. The old password will stop working immediately.`}
        confirmLabel="Reset Password"
        destructive
        isLoading={resetMutation.isPending}
        onConfirm={handleResetConfirm}
      />

      {/* Suspend / activate confirm */}
      <ConfirmDialog
        open={statusTarget !== null}
        onOpenChange={(o) => { if (!o) setStatusTarget(null); }}
        title={statusTarget?.status === "active" ? "Suspend registrar?" : "Activate registrar?"}
        message={
          statusTarget?.status === "active"
            ? `${statusTarget?.username} will no longer be able to log in. You can reactivate them anytime.`
            : `${statusTarget?.username} will regain access to their account.`
        }
        confirmLabel={statusTarget?.status === "active" ? "Suspend" : "Activate"}
        destructive={statusTarget?.status === "active"}
        isLoading={statusMutation.isPending}
        onConfirm={handleStatusConfirm}
      />

      {/* New credentials after reset */}
      {newCredentials && (
        <RegistrarCredentialsCard
          open
          onClose={() => setNewCredentials(null)}
          credentials={newCredentials}
          title="Password reset successfully"
        />
      )}
    </div>
  );
}