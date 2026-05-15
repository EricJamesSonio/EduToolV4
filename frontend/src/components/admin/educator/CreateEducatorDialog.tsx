// ===== File: frontend/src/components/admin/educator/CreateEducatorDialog.tsx =====

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useCreateEducator } from "@/hooks/admin/useEducators";
import { EducatorCredentialsCard } from "./EducatorCredentialsCard";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { EmailInput } from "@/components/shared/EmailInput";
import { buildFullEmail } from "@/lib/email/buildFullEmail";

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
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] =
    useState<CreatedCredentials | null>(null);

  const createMutation = useCreateEducator();

  const { data: org } = useOrganization();
  const emailExtension = org?.emailExtension ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullEmail = buildFullEmail(
      email,
      emailExtension,
      "educator"
    );

    createMutation.mutate(
      {
        fullName,
        email: fullEmail,
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
      <Dialog
        open={open && !credentials}
        onOpenChange={(v) => !v && onClose()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Educator Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
                placeholder="juan.delacruz"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={createMutation.isPending}
              />

              {email.trim() && emailExtension && (
                <p className="text-xs text-muted-foreground">
                  Preview:{" "}
                  <span className="font-medium">
                    {buildFullEmail(
                      email,
                      emailExtension,
                      "educator"
                    )}
                  </span>
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
        </DialogContent>
      </Dialog>

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

