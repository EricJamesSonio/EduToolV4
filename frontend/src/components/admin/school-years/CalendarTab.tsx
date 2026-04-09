"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { academicCalendarApi } from "@/api/admin/academic-calendar.api";
import type { CalendarEvent }  from "@/types/admin/calendar.types";
import { DataTable }    from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button }       from "@/components/ui/button";
import { formatDate }   from "@/utils/date.util";

import { EventFormDialog } from "./EventFormDialog";
import { EVENT_TYPE_LABELS } from "./constants";

interface CalendarTabProps {
  schoolYearId: string;
}

export function CalendarTab({ schoolYearId }: CalendarTabProps): React.JSX.Element {
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
    mutationFn: ({
      id,
      data,
    }: {
      id:   string;
      data: Parameters<typeof academicCalendarApi.update>[1];
    }) => academicCalendarApi.update(id, data),
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