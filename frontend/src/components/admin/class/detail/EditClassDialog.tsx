"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Trash2 } from "lucide-react";

import { classApi } from "@/api/admin/class.api";
import type { UpdateClassRequest, ScheduleSlot } from "@/api/admin/class.api";
import { educatorApi } from "@/api/admin/educator.api";
import { sectionApi } from "@/api/admin/section.api";
import type { Class } from "@/types/admin/class.types";

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

import { WEEKDAY_LABELS, toArray } from "../utils/classDetail.utils";

interface EditClassForm {
  educatorId: string;
  sectionId: string;
  capacity: string;
  schedules: { weekday: string; startTime: string; endTime: string }[];
}

interface EditClassDialogProps {
  cls: Class;
  open: boolean;
  onClose: () => void;
  schoolYearId: string; // ✅ ADD THIS
}

export function EditClassDialog({ cls, open, onClose, schoolYearId }: EditClassDialogProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
  });
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections", schoolYearId],
    queryFn: () => sectionApi.getAll(schoolYearId),
    enabled: !!schoolYearId,
  });
  const sections = toArray<{ id: string; name: string }>(sectionsRaw);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EditClassForm>({
    defaultValues: {
      educatorId: cls.educatorId ?? "",
      sectionId: cls.sectionId ?? "",
      capacity: String(cls.capacity),
      schedules:
        cls.schedules?.map((s) => ({
          weekday: String(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })) ?? [{ weekday: "1", startTime: "08:00", endTime: "09:00" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "schedules" });

  const selectedEducatorId = watch("educatorId");
  const selectedSectionId = watch("sectionId");

  const mutation = useMutation({
    mutationFn: (values: EditClassForm) => {
      const payload: UpdateClassRequest = {
        educatorId: values.educatorId || undefined,
        sectionId: values.sectionId || undefined,
        capacity: Number(values.capacity),
        schedules: values.schedules.map((s) => ({
          weekday: Number(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })) as ScheduleSlot[],
      };
      return classApi.update(cls.id, payload);
    },
    onSuccess: () => {
      toast.success("Class updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes", cls.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to update class.");
    },
  });

  const handleClose = (): void => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
          {/* Subject — read-only, cannot change after creation */}
          {cls.subjectName && (
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <div className="flex h-9 w-full items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                {cls.subjectName}
              </div>
              <p className="text-xs text-muted-foreground">
                Subject cannot be changed after the class is created.
              </p>
            </div>
          )}

          {/* Educator */}
          <div className="space-y-1.5">
            <Label>Educator</Label>
            <Select
              value={selectedEducatorId}
              onValueChange={(v) => setValue("educatorId", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an educator" />
              </SelectTrigger>
              <SelectContent>
                {educators.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section — filtered by the class's levelId */}
          <div className="space-y-1.5">
            <Label>
              Section{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select
              value={selectedSectionId}
              onValueChange={(v) => setValue("sectionId", v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="No section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No section</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              {...register("capacity", {
                required: "Capacity is required",
                min: { value: 1, message: "At least 1" },
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          {/* Schedules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Schedule</Label>
              <button
                type="button"
                onClick={() =>
                  append({ weekday: "1", startTime: "08:00", endTime: "09:00" })
                }
                className="text-xs text-primary hover:underline"
              >
                + Add slot
              </button>
            </div>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
              >
                <Select
                  value={watch(`schedules.${index}.weekday`)}
                  onValueChange={(v) =>
                    setValue(`schedules.${index}.weekday`, v ?? "")
                  }
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  className="h-8 text-xs w-28"
                  {...register(`schedules.${index}.startTime`)}
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="time"
                  className="h-8 text-xs w-28"
                  {...register(`schedules.${index}.endTime`)}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}