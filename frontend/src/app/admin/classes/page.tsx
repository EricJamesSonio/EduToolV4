"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { classApi } from "@/api/admin/class.api";
import type { CreateClassRequest, ScheduleSlot } from "@/api/admin/class.api";
import { subjectApi } from "@/api/admin/subject.api";
import { educatorApi } from "@/api/admin/educator.api";
import { sectionApi } from "@/api/admin/section.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { semesterApi } from "@/api/admin/semester.api";
import type { Class } from "@/types/admin/class.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Eye, Archive, GraduationCap, Trash2 } from "lucide-react";
import type { AxiosError } from "axios";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ScheduleSlotForm {
  weekday: string;
  startTime: string;
  endTime: string;
}

interface CreateClassForm {
  subjectId: string;
  educatorId: string;
  sectionId: string;
  schoolYearId: string;
  semesterId: string;
  capacity: string;
  schedules: ScheduleSlotForm[];
}

// Helper: guarantee we always have an array regardless of what the API/cache returns
function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function CreateClassDialog({
  open,
  onClose,
  defaultSubjectId,
}: {
  open: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}): React.JSX.Element {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<CreateClassForm>({
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const selectedSubjectId = watch("subjectId");
  const selectedEducatorId = watch("educatorId");
  const selectedSectionId = watch("sectionId");
  const selectedSchoolYearId = watch("schoolYearId");
  const selectedSemesterId = watch("semesterId");

  // ✅ Use select: toArray to guard against non-array cache hits
  const { data: subjectsRaw } = useQuery({
    queryKey: ["admin", "subjects"],
    queryFn: () => subjectApi.getAll(),
  });
  const subjects = toArray(subjectsRaw);

  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
  });
  const educators = toArray(educatorsRaw);

  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections"],
    queryFn: () => sectionApi.getAll(),
  });
  const sections = toArray(sectionsRaw);

  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });
  const schoolYears = toArray(schoolYearsRaw);

  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters", selectedSchoolYearId],
    queryFn: () => semesterApi.getAll(selectedSchoolYearId),
    enabled: !!selectedSchoolYearId,
  });
  const semesters = toArray(semestersRaw);

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

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Class</DialogTitle>
        </DialogHeader>
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
                  // ✅ Subject uses .title (not .name)
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

          {/* Section */}
          <div className="space-y-1.5">
            <Label>
              Section{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
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
                setValue("semesterId", "");
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
                {semesters.map((sem: { id: string; name: string }) => (
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
              <p className="text-xs text-destructive">
                {errors.capacity.message}
              </p>
            )}
          </div>

          {/* Schedules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Schedule</Label>
              <button
                type="button"
                onClick={() =>
                  append({
                    weekday: "1",
                    startTime: "08:00",
                    endTime: "09:00",
                  })
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
                    setValue(`schedules.${index}.weekday`, v)
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
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                mutation.isPending ||
                !selectedSubjectId ||
                !selectedEducatorId ||
                !selectedSchoolYearId ||
                !selectedSemesterId
              }
            >
              {mutation.isPending ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassesPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const defaultSubjectId = searchParams.get("subjectId") ?? undefined;

  const [filterSchoolYearId, setFilterSchoolYearId] = useState<string>("all");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("all");
  const [filterEducatorId, setFilterEducatorId] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(
    defaultSubjectId !== undefined ? true : false
  );
  const [archiveTarget, setArchiveTarget] = useState<Class | null>(null);

  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });
  // ✅ toArray guards every list against a stale non-array cache entry
  const schoolYears = toArray(schoolYearsRaw);

  const { data: educatorsRaw } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
  });
  const educators = toArray(educatorsRaw);

  const { data: semestersRaw } = useQuery({
    queryKey: ["admin", "semesters", filterSchoolYearId],
    queryFn: () => semesterApi.getAll(),
    enabled: filterSchoolYearId !== "all",
  });
  const semesters = toArray(semestersRaw);

  const query = useMemo(
    () => ({
      schoolYearId:
        filterSchoolYearId !== "all" ? filterSchoolYearId : undefined,
      semesterId: filterSemesterId !== "all" ? filterSemesterId : undefined,
      educatorId: filterEducatorId !== "all" ? filterEducatorId : undefined,
    }),
    [filterSchoolYearId, filterSemesterId, filterEducatorId]
  );

  const { data: classesRaw, isLoading } = useQuery({
    queryKey: ["admin", "classes", query],
    queryFn: () => classApi.getAll(query),
  });
  const classes = toArray(classesRaw);

  const archiveMutation = useMutation({
    mutationFn: (id: string) => classApi.archive(id),
    onSuccess: () => {
      toast.success("Class archived.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
      setArchiveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to archive class.");
      setArchiveTarget(null);
    },
  });

  const formatSchedule = (schedules: Class["schedules"]): string => {
    if (!schedules?.length) return "—";
    return schedules
      .map((s) => `${WEEKDAY_LABELS[s.weekday]} ${s.startTime}`)
      .join(", ");
  };

  const columns = [
    {
      header: "Title",
      accessor: (row: Class) => (
        <span className="font-medium">{row.title ?? "Unnamed"}</span>
      ),
    },
    {
      header: "Section",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground">
          {row.sectionName ?? "—"}
        </span>
      ),
    },
    {
      header: "Semester",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground">
          {row.semesterName ?? "—"}
        </span>
      ),
    },
    {
      header: "Educator",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground">
          {row.educatorName ?? "—"}
        </span>
      ),
    },
    {
      header: "Schedule",
      accessor: (row: Class) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatSchedule(row.schedules)}
        </span>
      ),
    },
    {
      header: "Enrolled",
      accessor: (row: Class) => (
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums">
            {row.enrolledCount ?? 0} / {row.capacity}
          </span>
          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min(
                  (((row.enrolledCount ?? 0) / row.capacity) * 100),
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Class) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => router.push(`/admin/classes/${row.id}`)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
          {!row.isArchived && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setArchiveTarget(row)}
            >
              <Archive className="mr-1 h-3.5 w-3.5" />
              Archive
            </Button>
          )}
          {row.isArchived && (
            <Badge variant="secondary" className="text-xs font-normal">
              Archived
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Class
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filterSchoolYearId}
          onValueChange={(v) => {
            setFilterSchoolYearId(v ?? "all");
            setFilterSemesterId("all");
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All School Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All School Years</SelectItem>
            {schoolYears.map((sy) => (
              <SelectItem key={sy.id} value={sy.id}>
                {sy.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterSemesterId}
          onValueChange={(v) => setFilterSemesterId(v ?? "all")}
          disabled={filterSchoolYearId === "all"}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((sem: { id: string; name: string }) => (
              <SelectItem key={sem.id} value={sem.id}>
                {sem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterEducatorId}
          onValueChange={(v) => setFilterEducatorId(v ?? "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Educators" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Educators</SelectItem>
            {educators.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes found"
          description="Create your first class to get started."
          // ✅ EmptyState.action expects { label, onClick }, not a ReactElement
          action={{ label: "New Class", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <DataTable columns={columns} data={classes} />
      )}

      {/* Create dialog */}
      {createOpen && (
        <CreateClassDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          defaultSubjectId={defaultSubjectId}
        />
      )}

      {/* Archive confirm */}
      {archiveTarget && (
        <ConfirmDialog
          open
          title="Archive this class?"
          message={`Archive "${archiveTarget.subjectName ?? "this class"}"? It will become read-only and hidden from active views.`}
          confirmLabel="Archive Class"
          destructive
          isLoading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          onOpenChange={(o) => {
            if (!o) setArchiveTarget(null);
          }}
        />
      )}
    </div>
  );
}