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
import { platformApi } from "@/api/platform.api";
import { toast } from "sonner";
import { AdminCredentialsCard } from "./AdminCredentialsCard";

interface CreateAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAdminDialog({
  open,
  onClose,
  onCreated,
}: CreateAdminDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credentials to show after creation
  const [credentials, setCredentials] = useState<{
    fullName: string;
    email: string;
    password: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await platformApi.createAdmin({ email });
      setCredentials({
        fullName: result.fullName ?? fullName,
        email: result.email,
        password: result.password,
      });
      // Reset form
      setFullName("");
      setEmail("");
    } catch {
      setError("Failed to create admin. Email may already be in use.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsDone = () => {
    setCredentials(null);
    onClose();
    onCreated();
  };

  return (
    <>
      <Dialog open={open && !credentials} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Admin Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-fullname">Full Name</Label>
              <Input
                id="create-fullname"
                placeholder="Juan dela Cruz"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="admin@school.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
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
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
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

      {/* Credentials card shown after successful creation */}
      {credentials && (
        <AdminCredentialsCard
          open
          onClose={handleCredentialsDone}
          credentials={credentials}
          title="Admin account created"
        />
      )}
    </>
  );
}