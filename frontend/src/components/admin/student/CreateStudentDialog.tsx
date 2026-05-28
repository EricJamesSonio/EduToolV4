// ===== File: frontend/src/components/admin/student/CreateStudentDialog.tsx =====

"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import type { AxiosError } from "axios";

import { studentApi } from "@/api/admin/student.api";
import type { CreateStudentRequest } from "@/api/admin/student.api";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildFullEmail } from "@/lib/email/buildFullEmail";

interface CredentialsPreview {
  fullName: string;
  email: string;
  studentId: string;
  password: string;
}

interface CreateStudentForm {
  fullName: string;
  email: string;
  studentId: string;
}

interface CreateStudentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateStudentDialog({
  open,
  onClose,
  onCreated,
}: CreateStudentDialogProps): React.JSX.Element {
  const [credentials, setCredentials] =
    useState<CredentialsPreview | null>(null);

  const { data: org } = useOrganization();
  const emailExtension = org?.emailExtension ?? null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateStudentForm>({
    defaultValues: {
      fullName: "",
      email: "",
      studentId: "",
    },
  });

  const emailUsername = watch("email");

  // ✅ Preview email automatically
  const previewEmail = buildFullEmail(
    emailUsername,
    emailExtension,
    "student"
  );

  const mutation = useMutation({
    mutationFn: (values: CreateStudentForm) => {
      const fullEmail = buildFullEmail(
        values.email,
        emailExtension,
        "student"
      );

      const payload: CreateStudentRequest = {
        fullName: values.fullName,
        email: fullEmail,
        studentId: values.studentId,
      };

      return studentApi.create(payload).then((res) => ({
        res,
        values,
      }));
    },

    onSuccess: ({ res, values }) => {
      const fullEmail = buildFullEmail(
        values.email,
        emailExtension,
        "student"
      );

      setCredentials({
        fullName: values.fullName,
        email: fullEmail,
        studentId: values.studentId,
        password: res.plainPassword,
      });

      onCreated();
    },

    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ??
          "Failed to create student."
      );
    },
  });

  function handleClose() {
    reset();
    setCredentials(null);
    onClose();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Credentials Preview
  // ───────────────────────────────────────────────────────────────────────────

  if (credentials) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        title="Student Created"
        size="sm"
      >

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Save these credentials — the password won&apos;t
              be shown again.
            </p>

            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm font-mono">
              <div>
                <span className="text-muted-foreground">
                  Name:
                </span>{" "}
                {credentials.fullName}
              </div>

              <div>
                <span className="text-muted-foreground">
                  Email:
                </span>{" "}
                {credentials.email}
              </div>

              <div>
                <span className="text-muted-foreground">
                  ID:
                </span>{" "}
                {credentials.studentId}
              </div>

              <div>
                <span className="text-muted-foreground">
                  Password:
                </span>{" "}
                {credentials.password}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
      </Modal>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Create Form
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Student"
      size="md"
    >

        <form
          onSubmit={handleSubmit((v) =>
            mutation.mutate(v)
          )}
          className="space-y-4"
        >
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label>Full Name</Label>

            <Input
              placeholder="e.g. Juan Dela Cruz"
              {...register("fullName", {
                required: "Full name is required",
              })}
              disabled={mutation.isPending}
            />

            {errors.fullName && (
              <p className="text-xs text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email Username */}
          <div className="space-y-1.5">
            <Label>Email Username</Label>

            <Input
              placeholder="e.g. juandelacruz"
              autoComplete="off"
              {...register("email", {
                required: "Email username is required",
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message:
                  "Only letters, numbers, underscores, and hyphens are allowed.",
              },
              })}
              disabled={mutation.isPending}
            />

            {/* ✅ Auto-generated email preview */}
            {emailUsername.trim() && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  Final Email:
                </span>{" "}
                <span className="font-medium">
                  {previewEmail}
                </span>
              </div>
            )}

            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Student ID */}
          <div className="space-y-1.5">
            <Label>Student ID</Label>

            <Input
              placeholder="e.g. STU-2024-001"
              {...register("studentId", {
                required: "Student ID is required",
              })}
              disabled={mutation.isPending}
            />

            {errors.studentId && (
              <p className="text-xs text-destructive">
                {errors.studentId.message}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Program, level, and section can be assigned via
            enrollment after creation.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !emailUsername.trim()
              }
            >
              {mutation.isPending
                ? "Creating..."
                : "Create Student"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}

