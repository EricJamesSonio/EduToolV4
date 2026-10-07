"use client";

import { useState } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import {
  BookOpen, CalendarDays, Pencil, Trash2, Plus, Loader2,
} from "lucide-react";
import { programCalendarApi } from "@/api/admin/program-calendar.api";
import type { CalendarBreak } from "@/api/admin/program-calendar.api";
import { calendarDateOf, normalizeDateInput, todayInZone } from "@/utils/datetime.util";
import { cn } from "@/lib/utils";
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

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function weeksBetween(start: string, end: string) {
  const days = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000;
  return Math.max(1, Math.round(days / 7));
}

function getStatus(start: string, end: string): { label: string; className: string } {
  // TICK-INFRA-017: kind-B day compare (a calendar ending today is ongoing).
  const today = todayInZone();
  if (today < calendarDateOf(start)) return { label: "Upcoming", className: "bg-muted text-muted-foreground" };
  if (today > calendarDateOf(end))   return { label: "Ended",    className: "bg-muted text-muted-foreground" };
  return { label: "Ongoing", className: "badge-success" };
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
  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
      // TICK-INFRA-017: normalize (legacy-ISO tolerant) — a blind slice
      // would load the wrong day for 16:00Z rows and submit it back.
      setStartDate(normalizeDateInput(calendar.startDate));
      setEndDate(normalizeDateInput(calendar.endDate));
      setBreaks([
        ...calendar.breaks.map((b) => ({
          label: b.label,
          startDate: normalizeDateInput(b.startDate as string),
          endDate: normalizeDateInput(b.endDate as string),
        })),
      ]);
    } else {
      const initialStart = normalizeDateInput(schoolYearStart);
      setStartDate(initialStart);
      setEndDate(normalizeDateInput(schoolYearEnd));
      setBreaks(seedDefaultBreaks(initialStart));
    }
    setBreaks((prev) =>
      prev.length >= 2 ? prev : padToTwoBreaks(prev),
    );
    setEditing(true);
  }

  function padToTwoBreaks(prev: CalendarBreak[]): CalendarBreak[] {
    const base = [...prev];
    while (base.length < 2) {
      base.push({ label: `Sem ${base.length + 1}`, startDate: "", endDate: "" });
    }
    return base;
  }

  function seedDefaultBreaks(seedStart: string): CalendarBreak[] {
    return [
      { label: "Sem 1", startDate: seedStart, endDate: "" },
      { label: "Sem 2", startDate: "", endDate: "" },
    ];
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasCalendar = calendar !== null && calendar !== undefined;

  const activeBreaks = breaks.filter((b) => b.startDate && b.endDate);
  const validationErrors: string[] = [];
  if (activeBreaks.length < 2) {
    validationErrors.push("Both Sem 1 and Sem 2 timelines are required before saving.");
  }
  if (activeBreaks.length > 0) {
    if (activeBreaks[0].startDate !== startDate) {
      validationErrors.push("Sem 1 start must match the calendar start date.");
    }
    if (activeBreaks[activeBreaks.length - 1].endDate !== endDate) {
      validationErrors.push("Sem 2 end must match the calendar end date.");
    }
  }

  const status = hasCalendar
    ? getStatus(calendar!.startDate, calendar!.endDate)
    : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold not-interactive">{programName}</h3>
          {isLoading ? (
            <Skeleton className="mt-1.5 h-4 w-40 rounded" />
          ) : hasCalendar ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground not-interactive">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(calendar!.startDate)} to {formatDate(calendar!.endDate)}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground not-interactive">
              No calendar set up yet
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {status && !editing && (
            <span className={cn("mr-1 rounded-sm px-2 py-0.5 text-xs font-medium", status.className)}>
              {status.label}
            </span>
          )}
          {hasCalendar && !editing && (
            <>
              <button
                onClick={startEdit}
                aria-label="Edit calendar"
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                aria-label="Delete calendar"
                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                {deleteMutation.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 border-t px-4 py-4">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  min={normalizeDateInput(schoolYearStart) || undefined}
                  max={normalizeDateInput(schoolYearEnd) || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  min={normalizeDateInput(schoolYearStart) || undefined}
                  max={normalizeDateInput(schoolYearEnd) || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">Semester Timelines</p>
              <p className="text-xs text-muted-foreground not-interactive">Set the Sem 1 and Sem 2 start/end dates. Terms are auto-computed between them.</p>
              <BreakEditor
                breaks={breaks}
                onChange={setBreaks}
                calendarStart={startDate}
                calendarEnd={endDate}
              />
            </div>
            {validationErrors.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
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
                {isSaving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {hasCalendar ? "Update Calendar" : "Create Calendar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ) : hasCalendar ? (
          calendar!.breaks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground not-interactive">Semesters</p>
              {calendar!.breaks.map((b, i) => {
                const s = b.startDate as string;
                const e = b.endDate as string;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium not-interactive">{b.label}</p>
                      <p className="text-xs text-muted-foreground not-interactive">
                        {formatShort(s)} – {formatShort(e)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[11px] font-normal">
                      {weeksBetween(s, e)} wks
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-2 text-center text-xs text-muted-foreground not-interactive">
              No semesters defined.
            </p>
          )
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-xs text-muted-foreground not-interactive">
              Set the Sem 1 and Sem 2 timelines for this department.
            </p>
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Setup Calendar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}