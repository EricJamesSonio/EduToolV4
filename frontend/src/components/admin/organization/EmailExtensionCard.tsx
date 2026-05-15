// ===== File: frontend/src/components/admin/organization/EmailExtensionCard.tsx =====
"use client";

import { useState } from "react";
import { useOrganization, useUpdateOrganization } from "@/hooks/admin/useOrganization";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import { AtSign, Loader2, AlertTriangle } from "lucide-react";
import { organizationApi } from "@/api/admin/organization.api";
import { useQuery } from "@tanstack/react-query";

export function EmailExtensionCard(): React.JSX.Element {
  const { data: org, isLoading } = useOrganization();
  const updateMutation = useUpdateOrganization();

  const [extension, setExtension] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingExtension, setPendingExtension] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [isValidating, setIsValidating] = useState(false);

  // ✅ NEW: Check if organization has accounts
  const { data: accountsCheck } = useQuery({
    queryKey: ["org", "accounts-check"],
    queryFn: () => organizationApi.checkHasAccounts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const currentExtension = org?.emailExtension ?? null;
  const hasAccounts = accountsCheck?.hasAccounts ?? false;

  function handleEdit() {
    if (hasAccounts) {
      toast.error("Cannot change email extension. Accounts already exist in this organization.");
      return;
    }
    setExtension(currentExtension?.replace("@", "") ?? "");
    setEditing(true);
    setValidationError("");
  }

  async function handleSaveClick() {
    const cleaned = extension.trim().replace(/^@/, "");

    if (!cleaned) {
      setValidationError("Email extension cannot be empty.");
      return;
    }

    if (!/^[a-zA-Z0-9.-]+$/.test(cleaned)) {
      setValidationError(
        "Extension contains invalid characters. Use only letters, numbers, dots, and hyphens."
      );
      return;
    }

    // ✅ NEW: Validate uniqueness before showing confirmation
    setIsValidating(true);
    try {
      const result = await organizationApi.validateEmailExtension(`@${cleaned}`);

      if (!result.isUnique) {
        setValidationError(result.message || "This email extension is already in use.");
        setIsValidating(false);
        return;
      }

      setValidationError("");
      setPendingExtension(`@${cleaned}`);
      setConfirmOpen(true);
    } catch (err) {
      setValidationError("Failed to validate email extension. Please try again.");
    } finally {
      setIsValidating(false);
    }
  }

  function handleConfirmSave() {
    updateMutation.mutate(
      { emailExtension: pendingExtension },
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

  function handleRemove() {
    if (hasAccounts) {
      toast.error("Cannot remove email extension. Accounts already exist in this organization.");
      return;
    }

    updateMutation.mutate(
      { emailExtension: null },
      {
        onSuccess: () => {
          toast.success("Email extension removed.");
          setEditing(false);
        },
        onError: () => toast.error("Failed to remove extension."),
      }
    );
  }

  if (isLoading) return <></>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AtSign className="h-4 w-4" />
            Email Extension
          </CardTitle>
          <CardDescription>
            Set a default email domain for your organization. When creating educators or
            students, they can type their username and the extension is applied automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ NEW: Warning if accounts exist */}
          {hasAccounts && currentExtension && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Email extension cannot be changed. Your organization has existing accounts
                ({accountsCheck?.count} total). Changing would invalidate existing email addresses.
              </AlertDescription>
            </Alert>
          )}

          {!editing ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-sm font-mono">
                {currentExtension ?? (
                  <span className="text-muted-foreground italic">No extension set</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={hasAccounts}
              >
                {currentExtension ? "Edit" : "Set Extension"}
              </Button>
              {currentExtension && !hasAccounts && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemove}
                  disabled={updateMutation.isPending}
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
                  <span className="text-muted-foreground text-sm font-mono">@</span>
                  <Input
                    className="font-mono"
                    placeholder="example.com"
                    value={extension}
                    onChange={(e) => {
                      setExtension(e.target.value.replace(/^@/, ""));
                      setValidationError("");
                    }}
                    autoFocus
                    disabled={isValidating}
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
                  <p className="text-xs text-destructive">{validationError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={isValidating || updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveClick}
                  disabled={
                    isValidating ||
                    updateMutation.isPending ||
                    !extension.trim() ||
                    !!validationError
                  }
                >
                  {isValidating ? (
                    <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Validating...</>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ NEW: Confirmation dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Set Email Extension?"
        message={`This will set the email extension to @${pendingExtension?.replace("@", "")} for all new accounts in your organization.`}
        description={`Students will get @${pendingExtension?.replace("@", "")}.student.com and educators will get @${pendingExtension?.replace("@", "")}.educator.com`}
        confirmLabel="Set Extension"
        isLoading={updateMutation.isPending}
        onConfirm={handleConfirmSave}
        onOpenChange={(o) => {
          if (!o) setConfirmOpen(false);
        }}
      />
    </>
  );
}