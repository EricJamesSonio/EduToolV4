// frontend/src/components/admin/section/SectionDialog.tsx
"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sectionApi } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";
import type { Program } from "@/types/admin/program.types";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";
import { buildLevelLabel } from "@/components/admin/section/utils/section.utils";
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
  programId: string;
  levelId:   string;
  name:      string;
  capacity:  number;
}

interface SectionDialogProps {
  section?:     Section;
  levels:       EnrichedLevel[];
  programs:     Program[];
  schoolYearId: string;           // ← add
  open:         boolean;
  onClose:      () => void;
  onSaved:      () => void;
}

// destructure it
export function SectionDialog({
  section,
  levels,
  programs,
  schoolYearId,                   // ← add
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
      programId: "",
      levelId:   section?.level_id  ?? "",
      name:      section?.name      ?? "",
      capacity:  section?.capacity  ?? 30,
    },
  });

  const selectedProgramId = watch("programId");
  const selectedLevelId   = watch("levelId");

  // Levels filtered to selected program
  const filteredLevels = useMemo(
    () => selectedProgramId
      ? levels.filter((l) => l.program_id === selectedProgramId)
      : [],
    [levels, selectedProgramId]
  );

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const selectedLevel   = filteredLevels.find((l) => l.id === selectedLevelId);

  const mutation = useMutation({
    mutationFn: (values: SectionFormValues) =>
      isEdit
        ? sectionApi.update(section!.id, {
            name:     values.name,
            capacity: values.capacity,
          })
        : sectionApi.create({
            levelId:  values.levelId,
            name:     values.name,
            capacity: values.capacity,
            schoolYearId,
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
          {/* ── Program (create only) ── */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select
                value={selectedProgramId}
                onValueChange={(v) => {
                  setValue("programId", v ?? "");
                  setValue("levelId", ""); // reset level when program changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program">
                    {selectedProgram?.name ?? "Select a program"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Level (create only, gated on program) ── */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={selectedLevelId}
                onValueChange={(v) => setValue("levelId", v ?? "")}
                disabled={!selectedProgramId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedProgramId ? "Select a level" : "Select a program first"}>
                    {selectedLevel
                      ? buildLevelLabel(selectedLevel)
                      : selectedProgramId
                        ? "Select a level"
                        : "Select a program first"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredLevels.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No levels for this program
                    </div>
                  ) : (
                    filteredLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ── Name ── */}
          <div className="space-y-1.5">
            <Label>Section Name</Label>
            <Input
              placeholder="e.g. Section A, Rizal, Mabini"
              {...register("name", {
                required:  "Name is required",
                minLength: { value: 1,   message: "At least 1 character" },
                maxLength: { value: 100, message: "Max 100 characters" },
              })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* ── Capacity ── */}
          <div className="space-y-1.5">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 40"
              {...register("capacity", {
                required: "Capacity is required",
                min:      { value: 1, message: "At least 1 student" },
                valueAsNumber: true,
              })}
            />
            {errors.capacity && (
              <p className="text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || (!isEdit && (!selectedProgramId || !selectedLevelId))}
            >
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Section"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}