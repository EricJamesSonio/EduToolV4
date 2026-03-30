"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { levelApi } from "@/api/admin/level.api";
import { academicCalendarApi } from "@/api/admin/academic-calendar.api";
import type { CalendarEventType } from "@/types/admin/calendar.types";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ChevronLeft, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date.util";
import type { CalendarEvent } from "@/types/admin/calendar.types";
import type { Level } from "@/types/admin/level.types";

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = "overview" | "levels" | "calendar";

// ─── Event type labels ────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  holiday: "Holiday",
  no_class_day: "No Class Day",
  exam_week: "Exam Week",
  special_event: "Special Event",
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ schoolYear }: { schoolYear: { id: string; name: string; status: string } }): React.JSX.Element {
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
    </div>
  );
}

// ─── Levels Tab ───────────────────────────────────────────────────────────────

function LevelsTab({
  schoolYearId,
  isEnded,
}: {
  schoolYearId: string;
  isEnded: boolean;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { data: levels, isLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId],
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.updateOne(id, name),
    onSuccess: () => {
      toast.success("Level updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "levels", schoolYearId] });
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update level."),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!levels?.length) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No levels found for this school year.
      </p>
    );
  }

  return (
    <div className="rounded-lg border bg-card divide-y">
      {levels.map((level: Level) => (
        <div key={level.id} className="flex items-center justify-between gap-4 px-4 py-3">
          {editingId === level.id ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 max-w-xs"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ id: level.id, name: editName })}
                disabled={updateMutation.isPending || !editName.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium">{level.name}</span>
              {!isEnded && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setEditingId(level.id); setEditName(level.name); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────

interface CalendarEventForm {
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  description: string;
}

function CalendarTab({
  schoolYearId,
}: {
  schoolYearId: string;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const [eventDialog, setEventDialog] = useState<{
    mode: "create" | "edit";
    event?: CalendarEvent;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin", "calendar", schoolYearId],
    queryFn: () => academicCalendarApi.getAll(schoolYearId),
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
            <span className="text-muted-foreground"> – {formatDate(row.original.end_date)}</span>
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
      cell: ({ row }) => <span className="font-medium text-sm">{row.original.title}</span>,
    },
    {
      accessorKey: "description",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.description ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEventDialog({ mode: "edit", event: row.original })}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
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
          <Plus className="mr-1.5 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={events ?? []}
        isLoading={isLoading}
        emptyTitle="No events yet"
        emptyDescription="Add holidays, exam weeks, or other calendar events."
      />

      {/* Event Dialog */}
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

      {/* Delete Confirm */}
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

// ─── Event Form Dialog ────────────────────────────────────────────────────────

function EventFormDialog({
  mode,
  event,
  schoolYearId: _schoolYearId,
  isLoading,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  event?: CalendarEvent;
  schoolYearId: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<CalendarEventForm, "schoolYearId"> & { schoolYearId?: string }) => void;
}): React.JSX.Element {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CalendarEventForm>({
    defaultValues: {
      title: event?.title ?? "",
      type: event?.type ?? "holiday",
      startDate: event?.start_date?.slice(0, 10) ?? "",
      endDate: event?.end_date?.slice(0, 10) ?? "",
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
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue("type", v as CalendarEventType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register("endDate", { required: "Required" })} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchoolYearDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: schoolYear, isLoading } = useQuery({
    queryKey: ["admin", "school-years", id],
    queryFn: () => schoolYearApi.getById(id),
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

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "levels", label: "Levels" },
    { key: "calendar", label: "Calendar" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/school-years"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        School Years
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{schoolYear.name}</h1>
        <StatusBadge status={schoolYear.status} />
      </div>

      {/* Ended banner */}
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
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "overview" && <OverviewTab schoolYear={schoolYear} />}
        {activeTab === "levels" && (
          <LevelsTab schoolYearId={id} isEnded={isEnded} />
        )}
        {activeTab === "calendar" && <CalendarTab schoolYearId={id} />}
      </div>
    </div>
  );
}