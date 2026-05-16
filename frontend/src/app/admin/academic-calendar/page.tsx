"use client";

// frontend/src/app/admin/academic-calendar/page.tsx

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarRange, Globe, BookOpen, CalendarDays,
  ChevronDown, ChevronRight, Pencil, Trash2,
  Plus, Loader2,
} from "lucide-react";
import { programCalendarApi } from "@/api/admin/program-calendar.api";
import type { CalendarBreak } from "@/api/admin/program-calendar.api";
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
import { HolidayBaseTab } from "@/components/admin/academic-calendar/HolidayBaseTab";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PageTab = "holidays" | "programs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
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
    onChange([
      ...breaks,
      { label: `Break ${breaks.length + 1}`, startDate: "", endDate: "" },
    ]);
  }
  function update(idx: number, field: keyof CalendarBreak, value: string) {
    onChange(breaks.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
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
                type="date" value={b.startDate}
                onChange={(e) => update(idx, "startDate", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">End</label>
              <Input
                type="date" value={b.endDate}
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
  programId:        string;
  programName:      string;
  schoolYearId:     string;
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

  const qKey = ["admin", "program-calendar", programId, schoolYearId];

  const { data: calendar, isLoading } = useQuery({
    queryKey: qKey,
    queryFn:  () => programCalendarApi.getByProgram(programId, schoolYearId),
    retry:    false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const createMutation = useMutation({
    mutationFn: () =>
      programCalendarApi.create({
        schoolYearId, programId, startDate, endDate,
        notes: notes || undefined,
        breaks: breaks
          .filter((b) => b.startDate && b.endDate)
          .map(({ label, startDate, endDate }) => ({ label, startDate, endDate })),
      }),
    onSuccess: () => { toast.success("Calendar created."); invalidate(); setEditing(false); },
    onError:   (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to create calendar."),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      programCalendarApi.update(calendar!.id, {
        startDate, endDate,
        notes: notes || undefined,
        breaks: breaks
          .filter((b) => b.startDate && b.endDate)
          .map(({ label, startDate, endDate }) => ({ label, startDate, endDate })),
      }),
    onSuccess: () => { toast.success("Calendar updated."); invalidate(); setEditing(false); },
    onError:   (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to update calendar."),
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
      setBreaks(
        calendar.breaks.map((b) => ({
          label:     b.label,
          startDate: (b.startDate as string).slice(0, 10),
          endDate:   (b.endDate   as string).slice(0, 10),
        })),
      );
    } else {
      setStartDate(schoolYearStart?.slice(0, 10) ?? "");
      setEndDate(schoolYearEnd?.slice(0, 10) ?? "");
      setNotes(""); setBreaks([]);
    }
    setEditing(true);
    setExpanded(true);
  }

  const isSaving    = createMutation.isPending || updateMutation.isPending;
  const hasCalendar = calendar !== null && calendar !== undefined;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {expanded
            ? <ChevronDown  className="h-4 w-4 text-muted-foreground shrink-0" />
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
              <Badge
                variant="secondary"
                className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              >
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

      {/* Body */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-4">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start Date</label>
                  <Input type="date" value={startDate}
                    onChange={(e) => setStartDate(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">End Date</label>
                  <Input type="date" value={endDate}
                    onChange={(e) => setEndDate(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Notes (optional)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes for this calendar" className="h-8 text-sm" />
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
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : hasCalendar ? (
            <div className="space-y-4">
              {calendar!.breaks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Breaks
                  </p>
                  <div className="space-y-1.5">
                    {calendar!.breaks.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-md border bg-muted/20 px-3 py-2"
                      >
                        <span className="text-xs font-medium">{b.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(b.startDate as string)} – {formatDate(b.endDate as string)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                      <span className="text-xs font-semibold text-primary w-14 shrink-0">
                        {t.label}
                      </span>
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
              No calendar set up yet. Click "Setup Calendar" to begin.
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
        <p className="text-sm text-muted-foreground">
          Select a school year to manage program calendars.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          No programs found for this school year.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Define break periods per program — terms are auto-generated and stored for use in semester settings.
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
  const [activeTab,          setActiveTab]          = useState<PageTab>("holidays");
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<string>("");

  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  });

  // Auto-select active school year
  useEffect(() => {
    if (schoolYears.length > 0 && !selectedSchoolYearId) {
      const active = schoolYears.find((sy) => sy.status === "active");
      setSelectedSchoolYearId(active?.id ?? schoolYears[0].id);
    }
  }, [schoolYears]);

  const selectedYear = schoolYears.find((sy) => sy.id === selectedSchoolYearId);

  // Derive display year from school year start, fallback to current year
  const displayYear = selectedYear?.start_date
    ? new Date(selectedYear.start_date).getFullYear()
    : new Date().getFullYear();

  const tabs: { key: PageTab; label: string; icon: React.ReactNode }[] = [
    { key: "holidays", label: "Holiday Base Calendar", icon: <Globe        className="h-4 w-4" /> },
    { key: "programs", label: "Program Calendars",     icon: <CalendarRange className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
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
          <Select value={selectedSchoolYearId} onValueChange={setSelectedSchoolYearId}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="Select school year" />
            </SelectTrigger>
            <SelectContent>
              {schoolYears.map((sy) => (
                <SelectItem key={sy.id} value={sy.id}>
                  <span className="flex items-center gap-2">
                    {sy.name}
                    {sy.status === "active" && (
                      <Badge className="text-[10px] px-1.5 py-0" variant="secondary">
                        Active
                      </Badge>
                    )}
                  </span>
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

      {/* Content */}
      <div>
        {activeTab === "holidays" && (
          <HolidayBaseTab
            schoolYearId={selectedSchoolYearId}
            year={displayYear}
          />
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