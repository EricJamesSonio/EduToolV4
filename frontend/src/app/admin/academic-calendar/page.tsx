"use client";

// frontend/src/app/admin/academic-calendar/page.tsx

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarRange, Globe, Plus, Trash2, Check, X,
  ChevronDown, ChevronRight, Pencil, Loader2,
  CalendarDays, Sparkles, BookOpen,
} from "lucide-react";
import { programCalendarApi } from "@/api/admin/program-calendar.api";
import type {
  HolidaySeed, CustomHoliday, CalendarBreak,
} from "@/api/admin/program-calendar.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi }    from "@/api/admin/program.api";
import { PageHeader }    from "@/components/shared/PageHeader";
import { Button }        from "@/components/ui/button";
import { Badge }         from "@/components/ui/badge";
import { Skeleton }      from "@/components/ui/skeleton";
import { Input }         from "@/components/ui/input";
import { cn }            from "@/lib/utils";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonthDay(month: number, day: number) {
  return `${MONTH_NAMES[month]} ${day}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

type PageTab = "holidays" | "programs";

// ─── Holiday Toggle Row ───────────────────────────────────────────────────────

function HolidayRow({
  holiday,
  enabled,
  onToggle,
}: {
  holiday:  HolidaySeed;
  enabled:  boolean;
  onToggle: (key: string, enabled: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer select-none",
        enabled
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
          : "bg-card border-border hover:bg-muted/30",
      )}
      onClick={() => onToggle(holiday.key, !enabled)}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 transition-colors",
          enabled
            ? "bg-emerald-500 border-emerald-500"
            : "border-muted-foreground/40",
        )}
      >
        {enabled && <Check className="h-3 w-3 text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{holiday.title}</p>
        {holiday.description && (
          <p className="text-xs text-muted-foreground truncate">{holiday.description}</p>
        )}
      </div>

      <span className="text-xs text-muted-foreground shrink-0">
        {formatMonthDay(holiday.month, holiday.day)}
      </span>

      {holiday.isDefault && (
        <Badge variant="secondary" className="text-xs shrink-0">Default</Badge>
      )}
    </div>
  );
}

// ─── Holiday Base Tab ─────────────────────────────────────────────────────────

function HolidayBaseTab({ schoolYearId }: { schoolYearId: string }) {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin", "holiday-config", schoolYearId],
    queryFn:  () => programCalendarApi.getHolidayConfig(schoolYearId),
    enabled:  !!schoolYearId,
  });

  const [enabledKeys,     setEnabledKeys]     = useState<Set<string>>(new Set());
  const [customHolidays,  setCustomHolidays]  = useState<CustomHoliday[]>([]);
  const [newTitle,        setNewTitle]        = useState("");
  const [newDate,         setNewDate]         = useState("");
  const [newDesc,         setNewDesc]         = useState("");
  const [addingCustom,    setAddingCustom]    = useState(false);
  const [dirty,           setDirty]           = useState(false);

  // Sync state when config loads or schoolYearId changes
  useEffect(() => {
    if (!config) return;
    setEnabledKeys(new Set(config.holidays.filter((h) => h.enabled).map((h) => h.key)));
    setCustomHolidays(config.customHolidays ?? []);
    setDirty(false);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () =>
      programCalendarApi.saveHolidayConfig({
        schoolYearId,
        enabledKeys:    [...enabledKeys],
        customHolidays,
      }),
    onSuccess: () => {
      toast.success("Holiday configuration saved.");
      queryClient.invalidateQueries({ queryKey: ["admin", "holiday-config", schoolYearId] });
      setDirty(false);
    },
    onError: () => toast.error("Failed to save holiday config."),
  });

  const seedMutation = useMutation({
    mutationFn: () =>
      programCalendarApi.seedHolidays({
        schoolYearId,
        year: new Date().getFullYear(),
      }),
    onSuccess: (res) => {
      toast.success(`Seeded ${res.seeded} holiday event${res.seeded !== 1 ? "s" : ""} to the calendar.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "academic-calendar"] });
    },
    onError: () => toast.error("Failed to seed holidays."),
  });

  function toggleKey(key: string, on: boolean) {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
    setDirty(true);
  }

  function addCustom() {
    if (!newTitle.trim() || !newDate) return;
    setCustomHolidays((prev) => [
      ...prev,
      { title: newTitle.trim(), date: newDate, description: newDesc.trim() || undefined },
    ]);
    setNewTitle(""); setNewDate(""); setNewDesc("");
    setAddingCustom(false);
    setDirty(true);
  }

  function removeCustom(idx: number) {
    setCustomHolidays((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  if (!schoolYearId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Select a school year to configure holidays.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  const holidays = config?.holidays ?? [];
  const enabledCount = [...enabledKeys].length;

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium">
            {enabledCount} of {holidays.length} holidays enabled
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toggle holidays on/off, add custom ones, then save. Seed pushes them to the calendar as events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Save Configuration
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending || dirty}
            title={dirty ? "Save first before seeding" : ""}
          >
            {seedMutation.isPending
              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            }
            Seed to Calendar
          </Button>
        </div>
      </div>

      {/* System holidays */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Philippine Holidays
        </p>
        <div className="space-y-1.5">
          {holidays.map((h) => (
            <HolidayRow
              key={h.key}
              holiday={h}
              enabled={enabledKeys.has(h.key)}
              onToggle={toggleKey}
            />
          ))}
        </div>
      </div>

      {/* Custom holidays */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom Holidays ({customHolidays.length})
          </p>
          <button
            onClick={() => setAddingCustom(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add Custom
          </button>
        </div>

        {/* Add form */}
        {addingCustom && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Foundation Day"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description (optional)</label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addCustom} disabled={!newTitle.trim() || !newDate}>
                Add Holiday
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingCustom(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {customHolidays.length === 0 && !addingCustom ? (
          <p className="text-xs text-muted-foreground py-2">No custom holidays added yet.</p>
        ) : (
          <div className="space-y-1.5">
            {customHolidays.map((ch, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ch.title}</p>
                  {ch.description && (
                    <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(ch.date)}
                </span>
                <button
                  onClick={() => removeCustom(idx)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Break Editor ─────────────────────────────────────────────────────────────

function BreakEditor({
  breaks,
  onChange,
}: {
  breaks:   CalendarBreak[];
  onChange: (breaks: CalendarBreak[]) => void;
}) {
  function addBreak() {
    onChange([...breaks, { label: `Break ${breaks.length + 1}`, startDate: "", endDate: "" }]);
  }

  function update(idx: number, field: keyof CalendarBreak, value: string) {
    const next = breaks.map((b, i) => i === idx ? { ...b, [field]: value } : b);
    onChange(next);
  }

  function remove(idx: number) {
    onChange(breaks.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {breaks.map((b, idx) => (
        <div key={idx} className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Input
              value={b.label}
              onChange={(e) => update(idx, "label", e.target.value)}
              placeholder="Break label"
              className="h-7 text-xs w-40 border-0 bg-transparent p-0 font-medium focus-visible:ring-0"
            />
            <button
              onClick={() => remove(idx)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Start</label>
              <Input
                type="date"
                value={b.startDate}
                onChange={(e) => update(idx, "startDate", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End</label>
              <Input
                type="date"
                value={b.endDate}
                onChange={(e) => update(idx, "endDate", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addBreak}
        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Plus className="h-3 w-3" /> Add Break
      </button>
    </div>
  );
}

// ─── Program Calendar Card ────────────────────────────────────────────────────

function ProgramCalendarCard({
  programId,
  programName,
  schoolYearId,
  schoolYearStart,
  schoolYearEnd,
}: {
  programId:       string;
  programName:     string;
  schoolYearId:    string;
  schoolYearStart?: string;
  schoolYearEnd?:   string;
}) {
  const queryClient = useQueryClient();
  const [expanded,  setExpanded]  = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [notes,     setNotes]     = useState("");
  const [breaks,    setBreaks]    = useState<CalendarBreak[]>([]);

  const { data: calendar, isLoading } = useQuery({
    queryKey: ["admin", "program-calendar", programId, schoolYearId],
    queryFn:  () => programCalendarApi.getByProgram(programId, schoolYearId),
    retry:    false,
    // 404 = no calendar yet → treat as null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["admin", "program-calendar", programId, schoolYearId],
    });

  const createMutation = useMutation({
    mutationFn: () =>
      programCalendarApi.create({
        schoolYearId, programId, startDate, endDate,
        notes: notes || undefined,
        breaks: breaks.filter((b) => b.startDate && b.endDate).map(({ label, startDate, endDate }) => ({ label, startDate, endDate })),
      }),
    onSuccess: () => { toast.success("Calendar created."); invalidate(); setEditing(false); },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create calendar."),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      programCalendarApi.update(calendar!.id, {
        startDate, endDate,
        notes: notes || undefined,
        breaks: breaks.filter((b) => b.startDate && b.endDate).map(({ label, startDate, endDate }) => ({ label, startDate, endDate })),
      }),
    onSuccess: () => { toast.success("Calendar updated."); invalidate(); setEditing(false); },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update calendar."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => programCalendarApi.delete(calendar!.id),
    onSuccess:  () => { toast.success("Calendar removed."); invalidate(); },
    onError:    () => toast.error("Failed to delete calendar."),
  });

  function startEdit() {
    if (calendar) {
      setStartDate(calendar.startDate.slice(0, 10));
      setEndDate(calendar.endDate.slice(0, 10));
      setNotes(calendar.notes ?? "");
      setBreaks(calendar.breaks.map((b) => ({
        label:     b.label,
        startDate: (b.startDate as string).slice(0, 10),
        endDate:   (b.endDate as string).slice(0, 10),
      })));
    } else {
      // Default to school year dates
      setStartDate(schoolYearStart?.slice(0, 10) ?? "");
      setEndDate(schoolYearEnd?.slice(0, 10) ?? "");
      setNotes("");
      setBreaks([]);
    }
    setEditing(true);
    setExpanded(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasCalendar = !!calendar;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header row */}
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
            <Skeleton className="h-5 w-20 rounded" />
          ) : hasCalendar ? (
            <>
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                {calendar!.terms.length} term{calendar!.terms.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatDate(calendar!.startDate)} – {formatDate(calendar!.endDate)}
              </Badge>
              <button
                onClick={startEdit}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
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

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          {editing ? (
            /* ── Edit / Create form ── */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start Date</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End Date</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Notes (optional)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for this calendar" className="h-8 text-sm" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Semester Breaks
                </p>
                <p className="text-xs text-muted-foreground">
                  Define break periods — terms are auto-computed between them.
                </p>
                <BreakEditor breaks={breaks} onChange={setBreaks} />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => hasCalendar ? updateMutation.mutate() : createMutation.mutate()}
                  disabled={isSaving || !startDate || !endDate}
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  {hasCalendar ? "Update Calendar" : "Create Calendar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : hasCalendar ? (
            /* ── View mode ── */
            <div className="space-y-4">
              {/* Breaks */}
              {calendar!.breaks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Breaks
                  </p>
                  <div className="space-y-1.5">
                    {calendar!.breaks.map((b, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2">
                        <span className="text-xs font-medium">{b.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(b.startDate as string)} – {formatDate(b.endDate as string)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Computed terms */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Generated Terms
                </p>
                <div className="space-y-1.5">
                  {calendar!.terms.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-md border bg-primary/5 border-primary/20 px-3 py-2"
                    >
                      <span className="text-xs font-semibold text-primary w-14 shrink-0">{t.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(t.startDate)} – {formatDate(t.endDate)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {calendar!.notes && (
                <p className="text-xs text-muted-foreground italic">{calendar!.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              No calendar set up for this program yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Program Calendars Tab ────────────────────────────────────────────────────

function ProgramCalendarsTab({
  schoolYearId,
  schoolYearStart,
  schoolYearEnd,
}: {
  schoolYearId:     string;
  schoolYearStart?: string;
  schoolYearEnd?:   string;
}) {
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId),
    enabled:  !!schoolYearId,
  });

  if (!schoolYearId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Select a school year to manage program calendars.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No programs found for this school year.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Set up a break-based academic calendar per program. Terms are auto-generated from your break periods.
      </p>
      {programs.map((program) => (
        <ProgramCalendarCard
          key={program.id}
          programId={program.id}
          programName={program.name}
          schoolYearId={schoolYearId}
          schoolYearStart={schoolYearStart}
          schoolYearEnd={schoolYearEnd}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademicCalendarPage(): React.JSX.Element {
  const [activeTab,        setActiveTab]        = useState<PageTab>("holidays");
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string>("");

  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  });

  // Auto-select active school year on load
  useEffect(() => {
    if (schoolYears.length > 0 && !selectedSchoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedSchoolYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears]);

  const selectedYear = schoolYears.find((sy) => sy.id === selectedSchoolYearId);

  const tabs: { key: PageTab; label: string; icon: React.ReactNode }[] = [
    { key: "holidays", label: "Holiday Base Calendar", icon: <Globe       className="h-4 w-4" /> },
    { key: "programs", label: "Program Calendars",     icon: <CalendarRange className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Academic Calendar"
        description="Configure holidays and set up program-scoped academic calendars with break periods and auto-generated terms."
      />

      {/* School Year Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium shrink-0">School Year</label>
        {syLoading ? (
          <Skeleton className="h-9 w-48 rounded-md" />
        ) : (
          <Select
            value={selectedSchoolYearId}
            onValueChange={setSelectedSchoolYearId}
          >
            <SelectTrigger className="h-9 w-52">
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={sy.id}>
                  {sy.name}
                  {sy.status === "active" && (
                    <Badge className="ml-2 text-xs" variant="secondary">Active</Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "holidays" && (
          <HolidayBaseTab schoolYearId={selectedSchoolYearId} />
        )}
        {activeTab === "programs" && (
          <ProgramCalendarsTab
            schoolYearId={selectedSchoolYearId}
            schoolYearStart={selectedYear?.start_date ?? undefined}
            schoolYearEnd={selectedYear?.end_date ?? undefined}
          />
        )}
      </div>
    </div>
  );
}