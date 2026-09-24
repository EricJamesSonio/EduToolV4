// ===== File: frontend/src/components/admin/educator/CreateEducatorDialog.tsx =====

"use client";

import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCreateEducator } from "@/hooks/admin/useEducators";
import { EducatorCredentialsCard } from "./EducatorCredentialsCard";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { buildFullEmail } from "@/lib/email/buildFullEmail";
import {
  sanitizeUsernameInput,
  validateUsername,
} from "@/utils/validation.util";

interface CreateEducatorDialogProps {
  open: boolean;
  onClose: () => void;
}

interface CreatedCredentials {
  fullName: string;
  email: string;
  educatorCode: string;
  password: string;
}

export function CreateEducatorDialog({
  open,
  onClose,
}: CreateEducatorDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] =
    useState<CreatedCredentials | null>(null);

  const createMutation = useCreateEducator();

  const { data: org } = useOrganization();
  const emailExtension = org?.emailExtension ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usernameMsg = validateUsername(email);
    setUsernameError(usernameMsg);
    if (usernameMsg) return;

    createMutation.mutate(
      {
        fullName,
        emailName: email,
      },
      {
        onSuccess: (result) => {
          setCredentials({
            fullName: result.fullName,
            email: result.email,
            educatorCode:
              result.educatorId ?? result.educatorCode ?? "",
            password: result.plainPassword,
          });

          setFullName("");
          setEmail("");
        },
        onError: () => {
          setError(
            "Failed to create educator. Email may already be in use."
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
        title="Create Educator Account"
        size="md"
      >

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edu-fullname">Full Name</Label>
              <Input
                id="edu-fullname"
                placeholder="Juan dela Cruz"
                required
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                disabled={createMutation.isPending}
              />
            </div>

            {/* Username only (NO @ input anymore) */}
            <div className="space-y-1.5">
              <Label htmlFor="edu-email">Email Username</Label>
              <Input
                id="edu-email"
                placeholder="juandelacruz"
                required
                maxLength={30}
                value={email}
                onChange={(e) => {
                  const next = sanitizeUsernameInput(e.target.value);
                  setEmail(next);
                  setUsernameError(null);
                }}
                disabled={createMutation.isPending}
              />

              {email.trim() && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Final Email:</span>{" "}
                  <span className="font-medium">
                    {buildFullEmail(email, emailExtension, "educator")}
                  </span>
                </div>
              )}

              {usernameError && (
                <p className="text-xs text-destructive" role="alert">
                  {usernameError}
                </p>
              )}
            </div>

            {error && (
              <p
                className="text-sm text-destructive"
                role="alert"
              >
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
                  !email.trim()
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
        <EducatorCredentialsCard
          open
          onClose={handleCredentialsDone}
          credentials={credentials}
        />
      )}
    </>
  );
}

