"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserPlus, Users, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useResetEducatorPassword } from "@/hooks/admin/useEducators";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorApi, DEFAULT_PAGE_SIZE } from "@/api/admin/educator.api";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { useOrganizationGuard } from "@/context/OrganizationGuardContext";
import type { Educator } from "@/types/admin/educator.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { SearchInput } from "@/components/shared/SearchInput";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EducatorTable } from "@/components/admin/educator/EducatorTable";
import { CreateEducatorDialog } from "@/components/admin/educator/CreateEducatorDialog";
import { BulkCreateEducatorDialog } from "@/components/admin/educator/BulkCreateEducatorDialog";
import { EducatorCredentialsCard } from "@/components/admin/educator/EducatorCredentialsCard";
import type { AxiosError } from "axios";

export default function EducatorsPage(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch]                   = useState("");
  const [page, setPage]                       = useState(1);
  const [limit, setLimit]                     = useState(DEFAULT_PAGE_SIZE);
  const [createOpen, setCreateOpen]           = useState(false);
  const [bulkOpen, setBulkOpen]               = useState(false);
  const [resetTarget, setResetTarget]         = useState<Educator | null>(null);
  const [newCredentials, setNewCredentials]   = useState<{
    fullName: string; email: string; educatorCode: string; password: string;
  } | null>(null);

  const {
    data: educatorsResp,
    isLoading,
    isError,
  } = useAsyncQuery(
    [...queryKeys.admin.educators.list({ search }), page, limit],
    () => educatorApi.getPage({ search: search || undefined, page, limit }),
  );

  const educators = educatorsResp?.data ?? [];
  const totalEducators = educatorsResp?.meta?.total ?? 0;
  const totalEducatorPages = educatorsResp?.meta?.totalPages ?? 1;
  const { data: org, isLoading: orgLoading } = useOrganization();
  const { ensureOrganization } = useOrganizationGuard();
  const hasEmailExtension = !!org?.emailExtension;
  const resetMutation = useResetEducatorPassword();

  useEffect(() => {
    if (page > totalEducatorPages) setPage(Math.max(1, totalEducatorPages));
  }, [page, totalEducatorPages]);

  const handleResetConfirm = () => {
    if (!resetTarget) return;
    resetMutation.mutate(resetTarget.id, {
      onSuccess: (result) => {
        setResetTarget(null);
        setNewCredentials({
          fullName:     resetTarget.fullName,
          email:        resetTarget.email,
          educatorCode: resetTarget.educatorId ?? resetTarget.educatorCode ?? "",
          password:     result.plainPassword,
        });
      },
      onError: (err: unknown) => {
        const axiosErr = err as AxiosError<{ message: string }>;
        toast.error(axiosErr?.response?.data?.message ?? "Failed to reset password.");
        setResetTarget(null);
      },
    });
  };

  const handleSetupEmail = () => {
    router.push("/admin/organization");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Educators"
        actions={<HelpGuide slug="admin_educators" />}
      />

      <div className="flex items-center justify-end gap-2">
        {hasEmailExtension ? (
          <>
            <Button variant="outline" size="sm" onClick={() => ensureOrganization(() => setBulkOpen(true))}>
              <Users className="mr-1.5 h-4 w-4" />
              Bulk Create
            </Button>
            <Button onClick={() => ensureOrganization(() => setCreateOpen(true))} size="sm">
              <UserPlus className="mr-1.5 h-4 w-4" />
              New Educator
            </Button>
          </>
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
   

      {/* Alert when no email extension */}
      {!hasEmailExtension && !orgLoading && (
        <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
            <span className="not-interactive">You need to set up an email extension before creating educators. Go to{" "}</span>
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
        placeholder="Search by name or Educator ID..."
        className="max-w-sm"
      />

      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={educators.length === 0}
        empty={{
          icon: Users,
          title: "No educators found",
          description:
            search
              ? "Try a different search term."
              : hasEmailExtension
              ? "Create your first educator to get started."
              : "Setup email extension first to create educators.",
          action:
            !search && hasEmailExtension
              ? { label: "New Educator", onClick: () => ensureOrganization(() => setCreateOpen(true)) }
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
          <EducatorTable
            data={educators}
            onResetPassword={setResetTarget}
          />
          <Pagination
            page={page}
            limit={limit}
            total={totalEducators}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            pageSizeOptions={[20, 50, 100]}
          />
        </>
      </AsyncListState>

      {createOpen && hasEmailExtension && (
        <CreateEducatorDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {bulkOpen && hasEmailExtension && (
        <BulkCreateEducatorDialog
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
        />
      )}

      {/* Reset password confirm */}
      <ConfirmDialog
        open={resetTarget !== null}
        onOpenChange={(o) => { if (!o) setResetTarget(null); }}
        title="Reset password?"
        message={`This will generate a new password for ${resetTarget?.fullName}. The old password will stop working immediately.`}
        confirmLabel="Reset Password"
        destructive
        isLoading={resetMutation.isPending}
        onConfirm={handleResetConfirm}
      />

      {/* New credentials after reset */}
      {newCredentials && (
        <EducatorCredentialsCard
          open
          onClose={() => setNewCredentials(null)}
          credentials={newCredentials}
          title="Password reset successfully"
        />
      )}
    </div>
  );
}