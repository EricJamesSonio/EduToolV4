// ===== File: frontend/src/components/admin/organization/EmailExtensionCard.tsx =====

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AtSign, Loader2, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import {
  useOrganization,
  useUpdateOrganization,
} from "@/hooks/admin/useOrganization";

import { organizationApi } from "@/api/admin/organization.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

export function EmailExtensionCard(): React.JSX.Element {
  // ======================================================
  // QUERIES
  // ======================================================

  const { data: organization, isLoading } = useOrganization();

  const { data: accountsCheck } = useQuery({
    queryKey: queryKeys.admin.organization.accountsCheck(),
    queryFn: () => organizationApi.checkHasAccounts(),
    staleTime: 0,
  });

  // ======================================================
  // MUTATIONS
  // ======================================================

  const updateOrganizationMutation = useUpdateOrganization();

  // ======================================================
  // LOCAL STATE
  // ======================================================

  const [extension, setExtension] = useState("");
  const [editing, setEditing] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [pendingExtension, setPendingExtension] = useState("");

  const [validationError, setValidationError] = useState("");

  const [isValidating, setIsValidating] = useState(false);

  // ======================================================
  // DERIVED STATE
  // ======================================================

  const currentExtension = organization?.emailExtension ?? null;

  const hasAccounts = accountsCheck?.hasAccounts ?? false;

  // ======================================================
  // HANDLERS
  // ======================================================

  function handleEdit(): void {
    if (hasAccounts) {
      toast.error(
        "Cannot change email extension. Accounts already exist in this organization."
      );

      return;
    }

    setExtension(currentExtension?.replace("@", "") ?? "");

    setValidationError("");

    setEditing(true);
  }

  async function handleSaveClick(): Promise<void> {
    const cleanedExtension = extension.trim().replace(/^@/, "");

    // ======================================================
    // VALIDATION
    // ======================================================

    if (!cleanedExtension) {
      setValidationError("Email extension cannot be empty.");
      return;
    }

    if (!/^[a-zA-Z0-9.-]+$/.test(cleanedExtension)) {
      setValidationError(
        "Extension contains invalid characters. Use only letters, numbers, dots, and hyphens."
      );

      return;
    }

    // ======================================================
    // SERVER VALIDATION
    // ======================================================

    setIsValidating(true);

    try {
      const result = await organizationApi.validateEmailExtension(
        `@${cleanedExtension}`
      );

      if (!result.isUnique) {
        setValidationError(
          result.message || "This email extension is already in use."
        );

        return;
      }

      setValidationError("");

      setPendingExtension(`@${cleanedExtension}`);

      setConfirmOpen(true);
    } catch {
      setValidationError(
        "Failed to validate email extension. Please try again."
      );
    } finally {
      setIsValidating(false);
    }
  }

  function handleConfirmSave(): void {
    updateOrganizationMutation.mutate(
      {
        emailExtension: pendingExtension,
      },
      {
        onSuccess: () => {
          toast.success("Email extension saved successfully.");

          setConfirmOpen(false);

          setEditing(false);

          setPendingExtension("");
        },

        onError: () => {
          toast.error("Failed to save email extension.");

          setConfirmOpen(false);
        },
      }
    );
  }

  function handleRemove(): void {
    if (hasAccounts) {
      toast.error(
        "Cannot remove email extension. Accounts already exist in this organization."
      );

      return;
    }

    updateOrganizationMutation.mutate(
      {
        emailExtension: null,
      },
      {
        onSuccess: () => {
          toast.success("Email extension removed.");

          setEditing(false);
        },

        onError: () => {
          toast.error("Failed to remove extension.");
        },
      }
    );
  }

  // ======================================================
  // LOADING
  // ======================================================

  if (isLoading) {
    return <></>;
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AtSign className="h-4 w-4" />

            Email Extension
          </CardTitle>

          <CardDescription>
            Set a default email domain for your organization.
            When creating educators or students, they can type
            their username and the extension is applied automatically.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {hasAccounts && currentExtension && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />

              <AlertDescription>
                Email extension cannot be changed.
                Your organization has existing accounts
                ({accountsCheck?.count} total).
                Changing would invalidate existing email addresses.
              </AlertDescription>
            </Alert>
          )}

          {!editing ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-sm font-mono">
                {currentExtension ?? (
                  <span className="italic text-muted-foreground">
                    No extension set
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={hasAccounts}
              >
                {currentExtension
                  ? "Edit"
                  : "Set Extension"}
              </Button>

              {currentExtension && !hasAccounts && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemove}
                  disabled={updateOrganizationMutation.isPending}
                >
                  Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Domain</Label>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm text-muted-foreground">
                    @
                  </span>

                  <Input
                    className="font-mono"
                    placeholder="example.com"
                    value={extension}
                    autoFocus
                    disabled={isValidating}
                    onChange={(event) => {
                      setExtension(
                        event.target.value.replace(/^@/, "")
                      );

                      setValidationError("");
                    }}
                  />
                </div>

                {extension && !validationError && (
                  <p className="text-xs text-muted-foreground">
                    Preview:{" "}
                    <span className="font-mono text-foreground">
                      username@{extension}
                    </span>
                  </p>
                )}

                {validationError && (
                  <p className="text-xs text-destructive">
                    {validationError}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={
                    isValidating ||
                    updateOrganizationMutation.isPending
                  }
                >
                  Cancel
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveClick}
                  disabled={
                    isValidating ||
                    updateOrganizationMutation.isPending ||
                    !extension.trim() ||
                    !!validationError
                  }
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />

                      Validating...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Set Email Extension?"
        message={`This will set the email extension to ${pendingExtension} for all new accounts in your organization.`}
        description={`Students will get ${pendingExtension}.student.com and educators will get ${pendingExtension}.educator.com`}
        confirmLabel="Set Extension"
        isLoading={updateOrganizationMutation.isPending}
        onConfirm={handleConfirmSave}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false);
          }
        }}
      />
    </>
  );
}