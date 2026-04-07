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

// ✅ Added imports
import { useOrganization } from "@/hooks/admin/useOrganization";
import { EmailInput } from "@/components/shared/EmailInput";

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

  // ✅ Get organization email extension
  const { data: org } = useOrganization();
  const emailExtension = org?.emailExtension ?? null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    createMutation.mutate(
      { fullName, email },
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
            <div className="space-y-1.5">
              <Label htmlFor="edu-fullname">Full Name</Label>
              <Input
                id="edu-fullname"
                placeholder="Juan dela Cruz"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>

            {/* ✅ Replaced Input with EmailInput */}
            <div className="space-y-1.5">
              <Label htmlFor="edu-email">Email</Label>
              <EmailInput
                value={email}
                onChange={setEmail}
                extension={emailExtension}
                placeholder="educator"
                disabled={createMutation.isPending}
              />
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
                disabled={createMutation.isPending}
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