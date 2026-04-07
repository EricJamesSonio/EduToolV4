"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { schoolYearApi }      from "@/api/admin/school-year.api";
import { academicCalendarApi } from "@/api/admin/academic-calendar.api";
import type { CalendarEventType } from "@/types/admin/calendar.types";
import { PageHeader }    from "@/components/shared/PageHeader";
import { StatusBadge }   from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable }     from "@/components/shared/DataTable";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { Textarea }  from "@/components/ui/textarea";
import { Skeleton }  from "@/components/ui/skeleton";
import { Badge }     from "@/components/ui/badge";
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
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { cn }         from "@/lib/utils";
import { formatDate } from "@/utils/date.util";
import type { CalendarEvent } from "@/types/admin/calendar.types";
import type { SchoolYear }    from "@/types/admin/school-year.types";

// ─── student enrollment API (inline — no separate file exists yet) ───────────
import client from "@/api/client";

interface StudentSchoolYearEnrollment {
  id:         string;
  student_id: string;
  status:     string;
  enrolled_at: string;
  unenrolled_at: string | null;
  notes:      string | null;
  programEnrollments: {
    id:        string;
    program:   { id: string; name: string };
    level:     { id: string; name: string } | null;
    course:    { id: string; name: string; code: string | null } | null;
    strand:    { id: string; name: string } | null;
    section:   { id: string; name: string } | null;
    status:    string;
  }[];
  // profile joined server-side or fetched separately
  studentName?: string;
}

const studentEnrollmentApi = {
  getBySchoolYear: async (schoolYearId: string): Promise<StudentSchoolYearEnrollment[]> => {
    const res = await client.get<{ success: boolean; data: StudentSchoolYearEnrollment[] }>(
      `/school-years/${schoolYearId}/enrollments`,
    );
    return res.data.data;
  },
  unenroll: async (enrollmentId: string): Promise<void> => {
    await client.patch(`/student-enrollments/${enrollmentId}/unenroll`);
  },
};
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "overview" | "calendar" | "enrollments";

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  holiday:       "Holiday",
  no_class_day:  "No Class Day",
  exam_week:     "Exam Week",
  special_event: "Special Event",
};

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ schoolYear }: { schoolYear: SchoolYear }): React.JSX.Element {
  return (
    <div className="rounded-lg border bg-card divide-y">
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Title</span>
        <span className="text-sm font-medium">{schoolYear.name}</span>
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Status</span>
        <StatusBadge status={schoolYear.status} />
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">Start Date</span>
        <span className="text-sm">
          {schoolYear.start_date ? formatDate(schoolYear.start_date) : "—"}
        </span>
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-32 text-sm text-muted-foreground shrink-0">End Date</span>
        <span className="text-sm">
          {schoolYear.end_date ? formatDate(schoolYear.end_date) : "—"}
        </span>
      </div>
    </div>
  );
}

// ── Calendar ─────────────────────────────────────────────────────────────────
interface CalendarEventForm {
  title:       string;
  type:        CalendarEventType;
  startDate:   string;
  endDate:     string;
  description: string;
}

function EventFormDialog({
  mode,
  event,
  schoolYearId: _schoolYearId,
  isLoading,
  onClose,
  onSubmit,
}: {
  mode:         "create" | "edit";
  event?:       CalendarEvent;
  schoolYearId: string;
  isLoading:    boolean;
  onClose:      () => void;
  onSubmit:     (values: Omit<CalendarEventForm, "schoolYearId"> & { schoolYearId?: string }) => void;
}): React.JSX.Element {
  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<CalendarEventForm>({
      defaultValues: {
        title:       event?.title ?? "",
        type:        event?.type  ?? "holiday",
        startDate:   event?.start_date?.slice(0, 10) ?? "",
        endDate:     event?.end_date?.slice(0, 10)   ?? "",
        description: event?.description ?? "",
      },
    });

  const selectedType = watch("type");

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Event" : "Edit Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              placeholder="e.g. Christmas Holiday"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue("type", v as CalendarEventType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register("startDate", { required: "Required" })} />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register("endDate", { required: "Required" })} />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>
              Notes{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea rows={2} {...register("description")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : mode === "create" ? "Add Event" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CalendarTab({ schoolYearId }: { schoolYearId: string }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [eventDialog, setEventDialog] = useState<{
    mode: "create" | "edit";
    event?: CalendarEvent;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin", "calendar", schoolYearId],
    queryFn:  () => academicCalendarApi.getAll(schoolYearId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "calendar", schoolYearId] });

  const createMutation = useMutation({
    mutationFn: academicCalendarApi.create,
    onSuccess: (res) => {
      if (res.warning) toast.warning(res.warning);
      else toast.success("Event added.");
      invalidate();
      setEventDialog(null);
    },
    onError: () => toast.error("Failed to add event."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof academicCalendarApi.update>[1] }) =>
      academicCalendarApi.update(id, data),
    onSuccess: (res) => {
      if (res.warning) toast.warning(res.warning);
      else toast.success("Event updated.");
      invalidate();
      setEventDialog(null);
    },
    onError: () => toast.error("Failed to update event."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => academicCalendarApi.remove(id),
    onSuccess: () => {
      toast.success("Event deleted.");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete event."),
  });

  const columns: ColumnDef<CalendarEvent>[] = [
    {
      accessorKey: "start_date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.start_date)}
          {row.original.start_date !== row.original.end_date && (
            <span className="text-muted-foreground">
              {" "}– {formatDate(row.original.end_date)}
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {EVENT_TYPE_LABELS[row.original.type]}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => setEventDialog({ mode: "edit", event: row.original })}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={() => setEventDialog({ mode: "create" })}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Event
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={events ?? []}
        isLoading={isLoading}
        emptyTitle="No events yet"
        emptyDescription="Add holidays, exam weeks, or other calendar events."
      />
      {eventDialog && (
        <EventFormDialog
          mode={eventDialog.mode}
          event={eventDialog.event}
          schoolYearId={schoolYearId}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onClose={() => setEventDialog(null)}
          onSubmit={(values) => {
            if (eventDialog.mode === "create") {
              createMutation.mutate({ ...values, schoolYearId });
            } else if (eventDialog.event) {
              updateMutation.mutate({ id: eventDialog.event.id, data: values });
            }
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete event?"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        />
      )}
    </>
  );
}

// ── Enrollments ───────────────────────────────────────────────────────────────
function EnrollmentsTab({ schoolYearId }: { schoolYearId: string }): React.JSX.Element {
  const queryClient = useQueryClient();
  const [unenrollTarget, setUnenrollTarget] =
    useState<StudentSchoolYearEnrollment | null>(null);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["admin", "school-year-enrollments", schoolYearId],
    queryFn:  () => studentEnrollmentApi.getBySchoolYear(schoolYearId),
  });

  const unenrollMutation = useMutation({
    mutationFn: (id: string) => studentEnrollmentApi.unenroll(id),
    onSuccess: () => {
      toast.success("Student unenrolled.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "school-year-enrollments", schoolYearId],
      });
      setUnenrollTarget(null);
    },
    onError: () => {
      toast.error("Failed to unenroll student.");
      setUnenrollTarget(null);
    },
  });

  const STATUS_COLORS: Record<string, string> = {
    active:     "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    pending:    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
    unenrolled: "bg-muted text-muted-foreground",
  };

  const columns: ColumnDef<StudentSchoolYearEnrollment>[] = [
    {
      accessorKey: "student_id",
      header: "Student",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.studentName ?? row.original.student_id}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
            STATUS_COLORS[row.original.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "enrolled_at",
      header: "Enrolled",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.enrolled_at)}
        </span>
      ),
    },
    {
      id: "programs",
      header: "Programs",
      cell: ({ row }) => {
        const progs = row.original.programEnrollments;
        if (!progs?.length) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {progs.map((p) => (
              <Badge key={p.id} variant="secondary" className="text-xs font-normal">
                {p.program.name}
                {p.course && ` · ${p.course.code ?? p.course.name}`}
                {p.strand && ` · ${p.strand.name}`}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isUnenrolled = row.original.status === "unenrolled";
        return (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              disabled={isUnenrolled}
              onClick={() => setUnenrollTarget(row.original)}
            >
              Unenroll
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={enrollments}
        isLoading={isLoading}
        emptyTitle="No students enrolled"
        emptyDescription="Students enrolled in this school year will appear here."
      />
      {unenrollTarget && (
        <ConfirmDialog
          open
          title="Unenroll this student?"
          message={`Remove this student from the school year? Their class enrollments will not be affected.`}
          confirmLabel="Unenroll"
          destructive
          isLoading={unenrollMutation.isPending}
          onConfirm={() => unenrollMutation.mutate(unenrollTarget.id)}
          onOpenChange={(o) => { if (!o) setUnenrollTarget(null); }}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SchoolYearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: schoolYear, isLoading } = useQuery({
    queryKey: ["admin", "school-years", id],
    queryFn:  () => schoolYearApi.getById(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!schoolYear) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        School year not found.
      </p>
    );
  }

  const isEnded = schoolYear.status === "ended";

  const TABS: { key: Tab; label: string; href?: string }[] = [
    { key: "overview",    label: "Overview" },
    { key: "enrollments", label: "Enrollments" },
    { key: "calendar",    label: "Calendar" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/admin/school-years"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        School Years
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{schoolYear.name}</h1>
        <StatusBadge status={schoolYear.status} />
      </div>

      {isEnded && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This school year has ended and is read-only.
        </div>
      )}

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.href) router.push(tab.href);
              else setActiveTab(tab.key);
            }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.key === "enrollments" && (
              <Users className="inline mr-1.5 h-3.5 w-3.5" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "overview"    && <OverviewTab schoolYear={schoolYear} />}
        {activeTab === "enrollments" && <EnrollmentsTab schoolYearId={id} />}
        {activeTab === "calendar"    && <CalendarTab schoolYearId={id} />}
      </div>
    </div>
  );
}