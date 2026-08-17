"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCreateRegistrar } from "@/hooks/admin/useRegistrars";
import { RegistrarCredentialsCard } from "./RegistrarCredentialsCard";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { nameSchema, validateUsername } from "@/utils/validation.util";

function previewRegistrarEmail(username: string, extension: string | null): string {
  if (!extension) return username;
  const base = extension.replace(/^@/, "").replace(/\.(student|educator|registrar)\./g, ".").trim();
  const dotIdx = base.indexOf(".");
  const domain = dotIdx >= 0
    ? `${base.slice(0, dotIdx)}.registrar${base.slice(dotIdx)}`
    : `registrar.${base}`;
  return `${username.trim().replace(/^@+/, "").toLowerCase()}@${domain}`;
}

interface CreateRegistrarDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CreatedCredentials {
  username: string;
  fullName?: string;
  email: string;
  password: string;
}

export function CreateRegistrarDialog({
  open,
  onClose,
}: CreateRegistrarDialogProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);

  const createMutation = useCreateRegistrar();
  const { data: org } = useOrganization();
  const emailExtension = org?.emailExtension ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameResult = nameSchema.safeParse(fullName.trim());
    setFullNameError(
      nameResult.success
        ? null
        : (nameResult.error.issues[0]?.message ?? "Full name is required")
    );

    const usernameMsg = validateUsername(username);
    setUsernameError(usernameMsg);
    if (!nameResult.success || usernameMsg) return;

    createMutation.mutate(
      { username, fullName: fullName.trim() },
      {
        onSuccess: (result) => {
          setCredentials({
            username: result.username,
            fullName: result.fullName ?? fullName.trim(),
            email: result.email,
            password: result.plainPassword,
          });
          setFullName("");
          setUsername("");
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ??
              "Failed to create registrar account. Username may already be in use."
          );
        },
      }
    );
  };

  const handleCredentialsDone = () => {
    setCredentials(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !credentials}
        onClose={onClose}
        title="Create Registrar Account"
        size="md"
      >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reg-fullname">Full Name</Label>
              <Input
                id="reg-fullname"
                placeholder="Ericjames Sonio"
                required
                maxLength={100}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setFullNameError(null);
                }}
                disabled={createMutation.isPending}
              />
              {fullNameError && (
                <p className="text-xs text-destructive" role="alert">
                  {fullNameError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg-username">Username</Label>
              <Input
                id="reg-username"
                placeholder="esonio"
                required
                maxLength={30}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(null);
                }}
                disabled={createMutation.isPending}
              />

              {username.trim() && emailExtension && (
                <p className="text-xs text-muted-foreground">
                  Preview:{" "}
                  <span className="font-medium">
                    {previewRegistrarEmail(username, emailExtension)}
                  </span>
                </p>
              )}

              {usernameError && (
                <p className="text-xs text-destructive" role="alert">
                  {usernameError}
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={
                  createMutation.isPending ||
                  !username.trim() ||
                  !fullName.trim()
                }
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </form>
      </Modal>

      {credentials && (
        <RegistrarCredentialsCard
          open
          onClose={handleCredentialsDone}
          credentials={credentials}
        />
      )}
    </>
  );
}