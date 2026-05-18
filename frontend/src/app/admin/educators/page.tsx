"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Users, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEducators, useResetEducatorPassword } from "@/hooks/admin/useEducators";
import { useOrganization } from "@/hooks/admin/useOrganization";
import type { Educator } from "@/types/admin/educator.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EducatorTable } from "@/components/admin/educator/EducatorTable";
import { CreateEducatorDialog } from "@/components/admin/educator/CreateEducatorDialog";
import { EducatorCredentialsCard } from "@/components/admin/educator/EducatorCredentialsCard";
import type { AxiosError } from "axios";

export default function EducatorsPage(): React.JSX.Element {
  const router = useRouter();
  const [search, setSearch]                   = useState("");
  const [createOpen, setCreateOpen]           = useState(false);
  const [resetTarget, setResetTarget]         = useState<Educator | null>(null);
  const [newCredentials, setNewCredentials]   = useState<{
    fullName: string; email: string; educatorCode: string; password: string;
  } | null>(null);

  const { data: educators = [], isLoading } = useEducators(search || undefined);
  const { data: org, isLoading: orgLoading } = useOrganization();
  const hasEmailExtension = !!org?.emailExtension;
  const resetMutation = useResetEducatorPassword();

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
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_educators" />
            {hasEmailExtension ? (
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                New Educator
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

      {/* Alert when no email extension */}
      {!hasEmailExtension && !orgLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to set up an email extension before creating educators. Go to{" "}
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
        onChange={setSearch}
        placeholder="Search by name or Educator ID..."
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : educators.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No educators found"
          description={
            search
              ? "Try a different search term."
              : hasEmailExtension
              ? "Create your first educator to get started."
              : "Setup email extension first to create educators."
          }
          action={
            !search && hasEmailExtension
              ? { label: "New Educator", onClick: () => setCreateOpen(true) }
              : !search
              ? { label: "Setup Email Extension", onClick: handleSetupEmail }
              : undefined
          }
        />
      ) : (
        <EducatorTable
          data={educators}
          onResetPassword={setResetTarget}
        />
      )}

      {createOpen && hasEmailExtension && (
        <CreateEducatorDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
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