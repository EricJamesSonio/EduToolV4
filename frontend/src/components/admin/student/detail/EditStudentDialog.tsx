"use client";

import { useEffect }   from "react";
import { useForm }     from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast }       from "sonner";
import type { AxiosError } from "axios";

import { studentApi, type UpdateStudentRequest } from "@/api/admin/student.api";
import type { Student } from "@/types/admin/student.types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

interface Props {
  open:    boolean;
  student: Student;
  onClose: () => void;
}

interface FormValues {
  fullName: string;
  email:    string;
}

export function EditStudentDialog({
  open,
  student,
  onClose,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: student.fullName,
      email:    student.email,
    },
  });

  useEffect(() => {
    reset({ fullName: student.fullName, email: student.email });
  }, [student, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateStudentRequest) =>
      studentApi.update(student.id, data),
    onSuccess: () => {
      toast.success("Student updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "students", student.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update student.");
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate({ fullName: values.fullName, email: values.email });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              {...register("fullName", { required: "Full name is required" })}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            To change program, level, or section — update the student&apos;s enrollment instead.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}