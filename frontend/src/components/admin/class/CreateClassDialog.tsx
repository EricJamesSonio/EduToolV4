"use client";

import { useForm, FormProvider } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { classApi } from "@/api/admin/class.api";
import type { CreateClassRequest, ScheduleSlot } from "@/api/admin/class.api";
import { subjectApi } from "@/api/admin/subject.api";
import { educatorApi } from "@/api/admin/educator.api";
import { sectionApi } from "@/api/admin/section.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { semesterApi } from "@/api/admin/semester.api";
import type { Subject } from "@/types/admin/subject.types";

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

import { ScheduleSlotFields } from "./ScheduleSlotFields";
import { toArray } from "@/utils/classes.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleSlotForm {
  weekday: string;
  startTime: string;
  endTime: string;
}

export interface CreateClassForm {
  subjectId: string;
  educatorId: string;
  sectionId: string;
  schoolYearId: string;
  semesterId: string;
  capacity: string;
  schedules: ScheduleSlotForm[];
}

interface CreateClassDialogProps {
  open: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateClassDialog({
  open,
  onClose,
  defaultSubjectId,
}: CreateClassDialogProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const methods = useForm<CreateClassForm>({
    defaultValues: {
      subjectId: defaultSubjectId ?? "",
      educatorId: "",
      sectionId: "",
      schoolYearId: "",
      semesterId: "",
      capacity: "30",
      schedules: [{ weekday: "1", startTime: "08:00", endTime: "09:00" }],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const selectedSubjectId = watch("subjectId");
  const selectedEducatorId = watch("educatorId");
  const selectedSectionId = watch("sectionId");
  const selectedSchoolYearId = watch("schoolYearId");
  const selectedSemesterId = watch("semesterId");

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const { data: subjectsRaw } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: () => subjectApi.getAll(),
  });
  const subjects = toArray<Subject>(subjectsRaw);

  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
  });
  const educators = toArray<{ id: string; fullName: string }>(educatorsRaw);

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections"],
    queryFn: () => sectionApi.getAll(),
  });
  const sections = toArray<{ id: string; name: string }>(sectionsRaw);

  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });
  const schoolYears = toArray<{ id: string; name: string }>(schoolYearsRaw);

  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters", selectedSchoolYearId],
    queryFn: () => semesterApi.getAll(),
    enabled: !!selectedSchoolYearId,
  });
  const semesters = toArray<{ id: string; name: string }>(semestersRaw);

  // ─── Mutation ───────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: (values: CreateClassForm) => {
      const payload: CreateClassRequest = {
        subjectId: values.subjectId,
        educatorId: values.educatorId,
        sectionId: values.sectionId || undefined,
        schoolYearId: values.schoolYearId,
        semesterId: values.semesterId,
        capacity: Number(values.capacity),
        schedules: values.schedules.map((s) => ({
          weekday: Number(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })) as ScheduleSlot[],
      };
      return classApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Class created.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
      reset();
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to create class.");
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  const isSubmitDisabled =
    mutation.isPending ||
    !selectedSubjectId ||
    !selectedEducatorId ||
    !selectedSchoolYearId ||
    !selectedSemesterId;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Class</DialogTitle>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 mt-1"
          >
            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={(v) => setValue("subjectId", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Section (optional) */}
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

            {/* School Year */}
            <div className="space-y-1.5">
              <Label>School Year</Label>
              <Select
                value={selectedSchoolYearId}
                onValueChange={(v) => {
                  setValue("schoolYearId", v ?? "");
                  setValue("semesterId", ""); // reset dependent
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={sy.id}>
                      {sy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester */}
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select
                value={selectedSemesterId}
                onValueChange={(v) => setValue("semesterId", v ?? "")}
                disabled={!selectedSchoolYearId || semesters.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem) => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name}
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
                placeholder="e.g. 30"
                {...register("capacity", {
                  required: "Capacity is required",
                  min: { value: 1, message: "At least 1" },
                })}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            {/* Schedule slots — extracted to its own component */}
            <ScheduleSlotFields />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitDisabled}>
                {mutation.isPending ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}