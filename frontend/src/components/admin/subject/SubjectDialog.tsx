// SubjectDialog.tsx — full updated file
"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import type { CreateSubjectRequest, UpdateSubjectRequest } from "@/api/admin/subject.api";
import type { Subject, SubjectType } from "@/types/admin/subject.types";
import type { Level } from "@/types/admin/level.types";
import { programApi } from "@/api/admin/program.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AxiosError } from "axios";

interface SubjectFormValues {
  name:        string;
  programId:   string;
  levelId:     string;
  educatorId:  string;
  subjectType: SubjectType;
}

interface SubjectDialogProps {
  subject?:           Subject;
  levels:             Level[];
  educators:          { id: string; fullName: string }[];
  schoolYearId?:      string;
  defaultSubjectType?: SubjectType;
  open:               boolean;
  onClose:            () => void;
  onSaved:            () => void;
}

export function SubjectDialog({
  subject,
  levels,
  educators,
  schoolYearId,
  defaultSubjectType = "major",
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
      name:        subject?.title        ?? "",
      programId:   subject?.realProgramId ?? "",
      levelId:     subject?.programId    ?? "",
      educatorId:  subject?.educatorId   ?? "",
      subjectType: (subject?.subjectType ?? defaultSubjectType) as SubjectType,
    },
  });

  const selectedProgramId  = watch("programId");
  const selectedLevelId    = watch("levelId");
  const selectedEducatorId = watch("educatorId");
  const subjectType        = watch("subjectType");
  const isMinor            = subjectType === "minor";

  // Always fetch programs when schoolYearId is available
  const { data: programs = [] } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId!),
    enabled:  !!schoolYearId && !isEdit,
  });

  // Filter levels to selected program
  const filteredLevels = selectedProgramId
    ? levels.filter((l) => l.program_id === selectedProgramId)
    : [];

  const mutation = useMutation({
    mutationFn: (values: SubjectFormValues) => {
      const payload: CreateSubjectRequest | UpdateSubjectRequest = {
        name:       values.name,
        levelId:    values.levelId    || undefined,
        educatorId: values.educatorId || undefined,
        ...(isEdit ? {} : {
          subjectType: values.subjectType,
          programId:   values.subjectType === "minor"
            ? values.programId || undefined
            : undefined,
        }),
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

  const isSubmitDisabled =
    mutation.isPending ||
    (!isEdit && !selectedProgramId) ||
    (!isEdit && !isMinor && !selectedLevelId); // major requires a level

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Subject" : "New Subject"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 mt-1">

          {/* Subject Type — create only */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Subject Type</Label>
              <Tabs
                value={subjectType}
                onValueChange={(v) => {
                  setValue("subjectType", v as SubjectType);
                  setValue("programId", "");
                  setValue("levelId", "");
                }}
              >
                <TabsList className="w-full h-9">
                  <TabsTrigger value="major" className="flex-1 text-sm">Major</TabsTrigger>
                  <TabsTrigger value="minor" className="flex-1 text-sm">Minor</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Program — create only, always shown */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select
                value={selectedProgramId}
                onValueChange={(v) => {
                  setValue("programId", v ?? "");
                  setValue("levelId", ""); // reset level on program change
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a program">
                    {programs.find((p) => p.id === selectedProgramId)?.name ?? "Select a program"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isMinor && (
                <p className="text-xs text-muted-foreground">
                  Minor subjects can only be shared within this program.
                </p>
              )}
            </div>
          )}

          {/* Level — filtered to selected program */}
          <div className="space-y-1.5">
            <Label>
              Level{" "}
              {isMinor && (
                <span className="text-muted-foreground font-normal">(optional for minor)</span>
              )}
            </Label>
            <Select
              value={selectedLevelId}
              onValueChange={(v) => setValue("levelId", v ?? "")}
              disabled={!isEdit && !selectedProgramId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !isEdit && !selectedProgramId
                      ? "Select a program first"
                      : "Select a level"
                  }
                >
                  {!isEdit
                    ? filteredLevels.find((l) => l.id === selectedLevelId)?.name
                        ?? (!selectedProgramId ? "Select a program first" : "Select a level")
                    : levels.find((l) => l.id === selectedLevelId)?.name
                        ?? "Select a level"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {isMinor && <SelectItem value="">— None —</SelectItem>}
                {(!isEdit ? filteredLevels : levels).map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
                {!isEdit && selectedProgramId && filteredLevels.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No levels for this program
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.levelId && (
              <p className="text-xs text-destructive">{errors.levelId.message}</p>
            )}
          </div>

          {/* Subject Name */}
          <div className="space-y-1.5">
            <Label>Subject Name</Label>
            <Input
              placeholder="e.g. Mathematics, English, Science"
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

          {/* Educator */}
          <div className="space-y-1.5">
            <Label>
              Assigned Educator{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select
              value={selectedEducatorId}
              onValueChange={(v) => setValue("educatorId", v ?? "")}
            >
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
            <Button type="submit" disabled={isSubmitDisabled}>
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Subject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}