"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import type { AxiosError } from "axios";
import { studentApi } from "@/api/admin/student.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { StudentCredentialsCard } from "@/components/admin/student/StudentCredentialsCard";
import type { Student } from "@/types/admin/student.types";

interface Props {
  open: boolean;
  student: Student;
  onClose: () => void;
}

interface CredentialsPreview {
  fullName:  string;
  email:     string;
  studentId: string;
  password:  string;
}

export function ResetPasswordDialog({
  open,
  student,
  onClose,
}: Props): React.JSX.Element {
  const [newCredentials, setNewCredentials] =
    useState<CredentialsPreview | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => studentApi.resetPassword(student.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.students.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.students.detail(student.id) });
      setNewCredentials({
        fullName:  student.fullName,
        email:     student.email,
        studentId: student.studentId,
        password:  data.plainPassword,
      });
      toast.success("Password reset successfully.");
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to reset password.");
    },
  });

  function handleClose() {
    setNewCredentials(null);
    onClose();
  }

  return (
    <>
      <Modal
        open={open && !newCredentials}
        onClose={handleClose}
        title="Reset Password"
        size="sm"
      >
        <div className="py-2">
          <p className="text-sm text-muted-foreground">
            Generate a new password for{" "}
            <span className="font-medium text-foreground">{student.fullName}</span>.
            Their old password will be invalidated immediately.
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <KeyRound className="mr-1.5 h-4 w-4" />
            {mutation.isPending ? "Resetting..." : "Reset Password"}
          </Button>
        </ModalFooter>
      </Modal>

      {newCredentials && (
        <StudentCredentialsCard
          open
          onClose={handleClose}
          credentials={newCredentials}
          title="Password reset successfully"
        />
      )}
    </>
  );
}
