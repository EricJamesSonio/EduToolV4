"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  student: Student;
  levels: { id: string; name: string }[];
  sections: { id: string; name: string; level_id: string }[];
  onClose: () => void;
}

interface FormValues {
  fullName: string;
  email: string;
  levelId: string;
  sectionId: string;
}

const NONE = "__none__";

export function EditStudentDialog({
  open,
  student,
  levels,
  sections,
  onClose,
}: Props): React.JSX.Element {
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        fullName: student.fullName,
        email: student.email,
        levelId: student.levelId ?? "",
        sectionId: student.sectionId ?? NONE,
      },
    });

  const selectedLevelId = watch("levelId");
  const filteredSections = sections.filter(
    (s) => s.level_id === selectedLevelId,
  );

  useEffect(() => {
    reset({
      fullName: student.fullName,
      email: student.email,
      levelId: student.levelId ?? "",
      sectionId: student.sectionId ?? NONE,
    });
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
    mutation.mutate({
      fullName: values.fullName,
      email: values.email,
      levelId: values.levelId || undefined,
      sectionId: values.sectionId === NONE ? undefined : values.sectionId,
    });
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

          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select
              value={selectedLevelId}
              onValueChange={(v) => {
                setValue("levelId", v);
                setValue("sectionId", NONE);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Section</Label>
            <Select
              value={watch("sectionId")}
              onValueChange={(v) => setValue("sectionId", v)}
              disabled={!selectedLevelId || filteredSections.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select section (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {filteredSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}