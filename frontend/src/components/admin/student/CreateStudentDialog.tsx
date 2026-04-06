"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import type { AxiosError } from "axios";

import { studentApi } from "@/api/admin/student.api";
import type { CreateStudentRequest } from "@/api/admin/student.api";
import type { Section } from "@/types/admin/section.types";

import { useOrganization } from "@/hooks/admin/useOrganization";
import { EmailInput } from "@/components/shared/EmailInput";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  levelId: string;
  sectionId: string;
}

interface CreateStudentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  levels: { id: string; name: string }[];
  sections: Section[];
}

export function CreateStudentDialog({
  open,
  onClose,
  onCreated,
  levels,
  sections,
}: CreateStudentDialogProps): React.JSX.Element {
  const [credentials, setCredentials] = useState<CredentialsPreview | null>(null);

  const { data: org } = useOrganization();
  const emailExtension = org?.emailExtension ?? null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateStudentForm>({
    defaultValues: {
      fullName: "",
      email: "",
      studentId: "",
      levelId: "",
      sectionId: "",
    },
  });

  const selectedLevelId = watch("levelId");
  const selectedSectionId = watch("sectionId");

  const filteredSections = useMemo(() => {
    if (!selectedLevelId) return [];
    return sections.filter((s) => s.level_id === selectedLevelId);
  }, [sections, selectedLevelId]);

  const mutation = useMutation({
    mutationFn: (values: CreateStudentForm) => {
      const payload: CreateStudentRequest = {
        fullName: values.fullName,
        email: values.email,
        studentId: values.studentId,
        levelId: values.levelId,
        sectionId: values.sectionId || undefined,
      };
      return studentApi.create(payload).then((res) => ({ res, values }));
    },
    onSuccess: ({ res, values }) => {
      setCredentials({
        fullName: values.fullName,
        email: values.email,
        studentId: values.studentId,
        password: res.plainPassword,
      });
      onCreated();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to create student.");
    },
  });

  function handleClose() {
    reset();
    setCredentials(null);
    onClose();
  }

  if (credentials) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Student Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <p className="text-sm text-muted-foreground">
              Save these credentials — the password won&apos;t be shown again.
            </p>
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm font-mono">
              <div><span className="text-muted-foreground">Name: </span>{credentials.fullName}</div>
              <div><span className="text-muted-foreground">Email: </span>{credentials.email}</div>
              <div><span className="text-muted-foreground">ID: </span>{credentials.studentId}</div>
              <div><span className="text-muted-foreground">Password: </span>{credentials.password}</div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Student</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              placeholder="e.g. Juan Dela Cruz"
              {...register("fullName", { required: "Full name is required" })}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* ✅ UPDATED EMAIL INPUT */}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <EmailInput
              value={watch("email")}
              onChange={(v) => setValue("email", v)}
              extension={emailExtension}
              placeholder="student"
              disabled={mutation.isPending}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Student ID</Label>
            <Input
              placeholder="e.g. STU-2024-001"
              {...register("studentId", { required: "Student ID is required" })}
            />
            {errors.studentId && (
              <p className="text-xs text-destructive">{errors.studentId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select
              value={selectedLevelId}
              onValueChange={(v) => {
                setValue("levelId", v ?? "");
                setValue("sectionId", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.levelId && (
              <p className="text-xs text-destructive">{errors.levelId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Section{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select
              value={selectedSectionId}
              onValueChange={(v) => setValue("sectionId", v ?? "")}
              disabled={!selectedLevelId || filteredSections.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="No section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No section</SelectItem>
                {filteredSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Students without a section start as <strong>Pending</strong>.
            </p>
          </div>

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
              disabled={mutation.isPending || !selectedLevelId}
            >
              {mutation.isPending ? "Creating..." : "Create Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}