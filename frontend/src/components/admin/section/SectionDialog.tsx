// filepath: app/admin/sections/_components/SectionDialog.tsx

"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sectionApi } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";
import { groupLevelsByProgram, buildLevelLabel } from "@/components/admin/section/utils/section.utils";
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

interface SectionFormValues {
  levelId: string;
  name: string;
  capacity: number;
}

interface SectionDialogProps {
  section?: Section;
  levels: EnrichedLevel[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SectionDialog({
  section,
  levels,
  open,
  onClose,
  onSaved,
}: SectionDialogProps): React.JSX.Element {
  const isEdit = !!section;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SectionFormValues>({
    defaultValues: {
      levelId: section?.level_id ?? "",
      name: section?.name ?? "",
      capacity: section?.capacity ?? 30,
    },
  });

  const selectedLevelId = watch("levelId");
  const selectedLevel = levels.find((l) => l.id === selectedLevelId);
  const grouped = useMemo(() => groupLevelsByProgram(levels), [levels]);

  const mutation = useMutation({
    mutationFn: (values: SectionFormValues) =>
      isEdit
        ? sectionApi.update(section!.id, {
            name: values.name,
            capacity: values.capacity,
          })
        : sectionApi.create({
            levelId: values.levelId,
            name: values.name,
            capacity: values.capacity,
          }),
    onSuccess: () => {
      toast.success(isEdit ? "Section updated." : "Section created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "sections"] });
      onSaved();
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to save section.");
    },
  });

  function handleClose(): void {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Section" : "New Section"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={(v) => setValue("levelId", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a level">
                    {selectedLevel ? buildLevelLabel(selectedLevel) : "Select a level"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {grouped.map(({ programName, levels: groupLevels }) => (
                    <div key={programName}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b mb-1">
                        {programName}
                      </div>
                      {groupLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {selectedLevel?.programName && (
                <p className="text-xs text-muted-foreground">
                  Program:{" "}
                  <span className="font-medium text-foreground">
                    {selectedLevel.programName}
                  </span>
                </p>
              )}
              {!selectedLevelId && (
                <p className="text-xs text-muted-foreground">
                  Select a level for this section.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Section Name</Label>
            <Input
              placeholder="e.g. Section A, Rizal, Mabini"
              {...register("name", {
                required: "Name is required",
                minLength: { value: 1, message: "At least 1 character" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 40"
              {...register("capacity", {
                required: "Capacity is required",
                min: { value: 1, message: "At least 1 student" },
                valueAsNumber: true,
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
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
              disabled={mutation.isPending || (!isEdit && !selectedLevelId)}
            >
              {mutation.isPending
                ? "Saving..."
                : isEdit
                ? "Save Changes"
                : "Create Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}