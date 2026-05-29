"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import type { UpdateSubjectRequest } from "@/api/admin/subject.api";
import type { Subject } from "@/types/admin/subject.types";
import type { Level } from "@/types/admin/level.types";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AxiosError } from "axios";

interface EditSubjectForm {
  name:       string;
  levelId:    string;
  educatorId: string;
}

interface EditSubjectDialogProps {
  subject:   Subject;
  levels:    Level[];
  educators: { id: string; fullName: string }[];
  open:      boolean;
  onClose:   () => void;
}

export function EditSubjectDialog({
  subject,
  levels,
  educators,
  open,
  onClose,
}: EditSubjectDialogProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<EditSubjectForm>({
    defaultValues: {
      name:       subject.title,
      levelId:    subject.levelId ?? "",
      educatorId: subject.educatorId ?? "",
    }
    });

  const selectedLevelId    = watch("levelId");
  const selectedEducatorId = watch("educatorId");

  const mutation = useMutation({
    mutationFn: (values: EditSubjectForm) =>
      subjectApi.update(subject.id, {
        name:       values.name,
        levelId:    values.levelId    || undefined,
        educatorId: values.educatorId || undefined,
      } as UpdateSubjectRequest),
    onSuccess: () => {
      toast.success("Subject updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects", subject.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update subject.");
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Edit Subject" size="md">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Subject Name</Label>
          <Input
            {...register("name", {
              required:  "Name is required",
              minLength: { value: 2,   message: "At least 2 characters" },
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
              <SelectValue placeholder="Select a level">
                {levels.find((l) => l.id === selectedLevelId)?.name ?? "Select a level"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— None —</SelectItem>
              {levels.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>
            Assigned Educator{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Select value={selectedEducatorId} onValueChange={(v) => setValue("educatorId", v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned">
                {educators.find((e) => e.id === selectedEducatorId)?.fullName ?? "Unassigned"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {educators.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
