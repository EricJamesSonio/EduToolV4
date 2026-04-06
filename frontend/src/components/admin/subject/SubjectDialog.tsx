// app/admin/subjects/_components/SubjectDialog.tsx
"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import type { CreateSubjectRequest, UpdateSubjectRequest } from "@/api/admin/subject.api";
import type { Subject } from "@/types/admin/subject.types";
import type { Level } from "@/types/admin/level.types";
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
import type { AxiosError } from "axios";

interface SubjectFormValues {
  name: string;
  levelId: string;
  educatorId: string;
}

interface SubjectDialogProps {
  subject?: Subject;
  levels: Level[];
  educators: { id: string; fullName: string }[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SubjectDialog({
  subject,
  levels,
  educators,
  open,
  onClose,
  onSaved,
}: SubjectDialogProps): React.JSX.Element {
  const isEdit = !!subject;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    defaultValues: {
      name: subject?.title ?? "",
      levelId: subject?.programId ?? "",
      educatorId: subject?.educatorId ?? "",
    },
  });

  const selectedLevelId = watch("levelId");
  const selectedEducatorId = watch("educatorId");

  const mutation = useMutation({
    mutationFn: (values: SubjectFormValues) => {
      const payload = {
        name: values.name,
        levelId: values.levelId,
        educatorId: values.educatorId || undefined,
      };
      return isEdit
        ? subjectApi.update(subject!.id, payload as UpdateSubjectRequest)
        : subjectApi.create(payload as CreateSubjectRequest);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Subject updated." : "Subject created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save subject.");
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Subject" : "New Subject"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Subject Name</Label>
            <Input
              placeholder="e.g. Mathematics, English, Science"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select value={selectedLevelId} onValueChange={(v) => setValue("levelId", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
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
              Assigned Educator{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select value={selectedEducatorId} onValueChange={(v) => setValue("educatorId", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {educators.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !selectedLevelId}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}