"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { classApi } from "@/api/admin/class.api";
import type { UpdateClassRequest, ScheduleSlot, EnrollmentResponse } from "@/api/admin/class.api";
import { studentApi } from "@/api/admin/student.api";
import { educatorApi } from "@/api/admin/educator.api";
import { sectionApi } from "@/api/admin/section.api";
import type { Class } from "@/types/admin/class.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  AlertTriangle,
  Archive,
  Search,
} from "lucide-react";
import type { AxiosError } from "axios";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ✅ Guard every list against a stale non-array React Query cache entry
function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

interface EditClassForm {
  educatorId: string;
  sectionId: string;
  capacity: string;
  schedules: { weekday: string; startTime: string; endTime: string }[];
}

function EditClassDialog({
  cls,
  open,
  onClose,
}: {
  cls: Class;
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();

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
      sectionId: cls.sectionId ?? "",  // sectionId is string | null; ?? "" coerces null → ""
      capacity: String(cls.capacity),
      schedules:
        cls.schedules?.map((s) => ({
          weekday: String(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
        })) ?? [{ weekday: "1", startTime: "08:00", endTime: "09:00" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

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
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4 mt-1"
        >
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
                    setValue(`schedules.${index}.weekday`, v ?? "1")
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EnrollStudentDialog({
  classId,
  open,
  onClose,
}: {
  classId: string;
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: studentsRaw, isLoading } = useQuery({
    queryKey: ["admin", "students", "search", search],
    queryFn: () => studentApi.getAll({ search: search || undefined }),
    enabled: search.length >= 2,
  });
  const students = toArray<{
    id: string;
    fullName: string;
    studentId?: string;
    status?: string;
  }>(studentsRaw);

  const enrollMutation = useMutation({
    mutationFn: (studentId: string) => classApi.enroll(classId, studentId),
    onSuccess: (result) => {
      if ("overflow" in result && result.overflow) {
        toast.warning(result.message);
      } else {
        toast.success("Student enrolled.");
      }
      queryClient.invalidateQueries({
        queryKey: ["admin", "classes", classId, "enrollments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "classes", classId],
      });
      onClose();
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to enroll student.");
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Search by name or Student ID to find and enroll a student.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or Student ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="rounded-md border min-h-[120px] max-h-64 overflow-y-auto">
            {search.length < 2 ? (
              <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                No students found
              </div>
            ) : (
              <div className="divide-y">
                {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => enrollMutation.mutate(student.id)}
                      disabled={
                        enrollMutation.isPending ||
                        student.status !== "active"
                      }
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {student.fullName}
                        </p>
                        {student.studentId && (
                          <p className="text-xs text-muted-foreground">
                            ID: {student.studentId}
                          </p>
                        )}
                      </div>
                      {student.status && student.status !== "active" && (
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0"
                        >
                          {student.status}
                        </Badge>
                      )}
                    </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    enrollmentId: string;
    studentName: string;
  } | null>(null);

  const { data: cls, isLoading: clsLoading } = useQuery({
    queryKey: ["admin", "classes", id],
    queryFn: () => classApi.getOne(id),
  });

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["admin", "classes", id, "enrollments"],
    queryFn: () => classApi.getEnrollments(id),
    enabled: !!id,
  });
  const enrollments = toArray<EnrollmentResponse>(enrollmentsRaw);

  const archiveMutation = useMutation({
    mutationFn: () => classApi.archive(id),
    onSuccess: () => {
      toast.success("Class archived.");
      queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
      setArchiveConfirm(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to archive class.");
      setArchiveConfirm(false);
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      classApi.removeEnrollment(id, enrollmentId),
    onSuccess: () => {
      toast.success("Student removed.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "classes", id, "enrollments"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "classes", id] });
      setRemoveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to remove student."
      );
      setRemoveTarget(null);
    },
  });

  const enrolledCount = cls?.enrolledCount ?? enrollments.length;
  const capacity = cls?.capacity ?? 0;
  const fillPercent =
    capacity > 0 ? Math.min((enrolledCount / capacity) * 100, 100) : 0;

  const formatSchedule = (
    schedules: Class["schedules"] | undefined
  ): string => {
    if (!schedules?.length) return "—";
    return schedules
      .map((s) => `${WEEKDAY_LABELS[s.weekday]} ${s.startTime}–${s.endTime}`)
      .join(", ");
  };

  if (clsLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!cls) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Class not found.
      </p>
    );
  }

  const isArchived = cls.status === "archived";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/classes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Classes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {cls.subjectName ?? "Unnamed Class"}
            </h1>
            {isArchived && (
              <Badge variant="secondary" className="font-normal">
                Archived
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[cls.semesterName, cls.sectionName].filter(Boolean).join(" · ")}
          </p>
        </div>

        {!isArchived && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setArchiveConfirm(true)}
            >
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              Archive
            </Button>
          </div>
        )}
      </div>

      {/* Archived banner */}
      {isArchived && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This class is archived and read-only.
        </div>
      )}

      {/* Info card */}
      <div className="rounded-lg border bg-card divide-y">
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Subject
          </span>
          <span className="text-sm font-medium">{cls.subjectName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Educator
          </span>
          <span className="text-sm">{cls.educatorName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Section
          </span>
          <span className="text-sm">{cls.sectionName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Semester
          </span>
          <span className="text-sm">{cls.semesterName ?? "—"}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Schedule
          </span>
          <span className="text-sm">{formatSchedule(cls.schedules)}</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-36 text-sm text-muted-foreground shrink-0">
            Capacity
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums">
              {enrolledCount} / {capacity} enrolled
            </span>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Enrolled Students{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({enrolledCount})
            </span>
          </h2>
          {!isArchived && (
            <Button size="sm" onClick={() => setEnrollOpen(true)}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Enroll Student
            </Button>
          )}
        </div>

        {enrollmentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-10 text-center">
            <Users className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No students enrolled yet.
            </p>
            {!isArchived && (
              <button
                onClick={() => setEnrollOpen(true)}
                className="mt-1 text-xs text-primary hover:underline"
              >
                Enroll the first student
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden divide-y">
            {enrollments.map((enrollment: EnrollmentResponse) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 group hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {enrollment.student_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      enrollment.status === "active" ? "default" : "secondary"
                    }
                    className="text-xs font-normal capitalize"
                  >
                    {enrollment.status}
                  </Badge>
                  {!isArchived && (
                    <button
                      onClick={() =>
                        setRemoveTarget({
                          enrollmentId: enrollment.id,
                          studentName: enrollment.student_id,
                        })
                      }
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove student"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      {editOpen && (
        <EditClassDialog
          cls={cls}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}

      {/* Enroll dialog */}
      {enrollOpen && (
        <EnrollStudentDialog
          classId={id}
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
        />
      )}

      {/* Archive confirm */}
      {archiveConfirm && (
        <ConfirmDialog
          open
          title="Archive this class?"
          message="Archive this class? It will become read-only and hidden from active views."
          confirmLabel="Archive Class"
          destructive
          isLoading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate()}
          onOpenChange={(o) => {
            if (!o) setArchiveConfirm(false);
          }}
        />
      )}

      {/* Remove enrollment confirm */}
      {removeTarget && (
        <ConfirmDialog
          open
          title="Remove this student?"
          message={`Remove "${removeTarget.studentName}" from this class? Their grades and submissions may be affected.`}
          confirmLabel="Remove Student"
          destructive
          isLoading={removeEnrollmentMutation.isPending}
          onConfirm={() =>
            removeEnrollmentMutation.mutate(removeTarget.enrollmentId)
          }
          onOpenChange={(o) => {
            if (!o) setRemoveTarget(null);
          }}
        />
      )}
    </div>
  );
}