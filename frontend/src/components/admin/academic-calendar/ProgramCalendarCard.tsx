// frontend/src/components/admin/academic-calendar/ProgramCalendarCard.tsx
"use client";

import { useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, BookOpen,
  Pencil, Trash2, Plus, Loader2,
} from "lucide-react";
import { programCalendarApi } from "@/api/admin/program-calendar.api";
import type { CalendarBreak } from "@/api/admin/program-calendar.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { BreakEditor } from "./BreakEditor";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

interface Props {
  programId: string;
  programName: string;
  schoolYearId: string;
  schoolYearStart?: string;
  schoolYearEnd?: string;
}

export function ProgramCalendarCard({
  programId,
  programName,
  schoolYearId,
  schoolYearStart,
  schoolYearEnd,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [breaks, setBreaks] = useState<CalendarBreak[]>([]);

  const calendarKey = queryKeys.admin.programCalendar.detail(programId, schoolYearId);

  const { data: calendar, isLoading } = useAsyncQuery(
    calendarKey,
    () => programCalendarApi.getByProgram(programId, schoolYearId),
    { retry: false },
  );

  const createMutation = useMutationWithInvalidation(
    () =>
      programCalendarApi.create({
        schoolYearId, programId, startDate, endDate,
        notes: notes || undefined,
        breaks: breaks
          .filter((b) => b.startDate && b.endDate)
          .map(({ label, startDate, endDate }) => ({ label, startDate, endDate })),
      }),
    {
      invalidateKeys: [calendarKey],
      onSuccess: () => { toast.success("Calendar created."); setEditing(false); },
      onError: (e: any) =>
        toast.error(e?.response?.data?.message ?? "Failed to create calendar."),
    },
  );

  const updateMutation = useMutationWithInvalidation(
    () =>
      programCalendarApi.update(calendar!.id, {
        startDate, endDate,
        notes: notes || undefined,
        breaks: breaks
          .filter((b) => b.startDate && b.endDate)
          .map(({ label, startDate, endDate }) => ({ label, startDate, endDate })),
      }),
    {
      invalidateKeys: [calendarKey],
      onSuccess: () => { toast.success("Calendar updated."); setEditing(false); },
      onError: (e: any) =>
        toast.error(e?.response?.data?.message ?? "Failed to update calendar."),
    },
  );

  const deleteMutation = useMutationWithInvalidation(
    () => programCalendarApi.delete(calendar!.id),
    {
      invalidateKeys: [calendarKey],
      onSuccess: () => { toast.success("Calendar removed."); },
      onError: () => toast.error("Failed to delete calendar."),
    },
  );

  function startEdit() {
    if (calendar) {
      setStartDate(calendar.startDate.slice(0, 10));
      setEndDate(calendar.endDate.slice(0, 10));
      setNotes(calendar.notes ?? "");
      setBreaks([
        ...calendar.breaks.map((b) => ({
          label: b.label,
          startDate: (b.startDate as string).slice(0, 10),
          endDate: (b.endDate as string).slice(0, 10),
        })),
      ]);
} else {
  const initialStart = schoolYearStart?.slice(0, 10) ?? "";
  setStartDate(initialStart); 
  setEndDate(schoolYearEnd?.slice(0, 10) ?? "");
  setNotes("");
  setBreaks(seedDefaultBreaks(initialStart));
}
    // Ensure at least two break slots on entering edit mode (placeholders only —
    // never persisted unless the user explicitly saves).
    setBreaks((prev) =>
      prev.length >= 2 ? prev : padToTwoBreaks(prev),
    );
    setEditing(true);
    setExpanded(true);
  }

  function padToTwoBreaks(prev: CalendarBreak[]): CalendarBreak[] {
    const base = [...prev];
    while (base.length < 2) {
      base.push({ label: `Break ${base.length + 1}`, startDate: "", endDate: "" });
    }
    return base;
  }

function seedDefaultBreaks(seedStart: string): CalendarBreak[] {
  return [
    { label: "Break 1", startDate: seedStart, endDate: "" },
    { label: "Break 2", startDate: "", endDate: "" },
  ];
}

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasCalendar = calendar !== null && calendar !== undefined;

  const activeBreaks = breaks.filter((b) => b.startDate && b.endDate);
  const validationErrors: string[] = [];
  if (activeBreaks.length < 2) {
    validationErrors.push("At least two semester breaks are required before saving.");
  }
  if (activeBreaks.length > 0) {
    if (activeBreaks[0].startDate !== startDate) {
      validationErrors.push("First break start must match the calendar start date.");
    }
    if (activeBreaks[activeBreaks.length - 1].endDate !== endDate) {
      validationErrors.push("Last break end must match the calendar end date.");
    }
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          }
          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{programName}</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {isLoading ? (
            <Skeleton className="h-5 w-24 rounded" />
          ) : hasCalendar ? (
            <>
              <Badge variant="outline" className="text-xs">
                {formatDate(calendar!.startDate)} – {formatDate(calendar!.endDate)}
              </Badge>
              <button onClick={startEdit} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={startEdit}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Setup Calendar
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    min={schoolYearStart?.slice(0, 10)}
                    max={schoolYearEnd?.slice(0, 10)}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    min={schoolYearStart?.slice(0, 10)}
                    max={schoolYearEnd?.slice(0, 10)}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Notes (optional)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for this calendar" className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">Semester Breaks</p>
                <p className="text-xs text-muted-foreground not-interactive">Define break periods — terms are auto-computed between them.</p>
                <BreakEditor
                  breaks={breaks}
                  onChange={setBreaks}
                  calendarStart={startDate}
                  calendarEnd={endDate}
                />
              </div>
              {validationErrors.length > 0 && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => hasCalendar ? updateMutation.mutate() : createMutation.mutate()}
                  disabled={isSaving || !startDate || !endDate || validationErrors.length > 0}
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  {hasCalendar ? "Update Calendar" : "Create Calendar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : hasCalendar ? (
            <div className="space-y-4">
              {calendar!.breaks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">Breaks</p>
                  <div className="space-y-1.5">
                    {calendar!.breaks.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2">
                        <span className="text-xs font-medium not-interactive">{b.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto not-interactive">
                          {formatDate(b.startDate as string)} – {formatDate(b.endDate as string)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {calendar!.notes && (
                <p className="text-xs text-muted-foreground italic not-interactive">{calendar!.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4 not-interactive">
              No calendar set up yet. Click &quotSetup Calendar&quot to begin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}