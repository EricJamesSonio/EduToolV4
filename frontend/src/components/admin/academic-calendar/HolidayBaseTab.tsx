"use client";

// frontend/src/components/admin/academic-calendar/HolidayBaseTab.tsx

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, List, CalendarDays, Info, Sparkles } from "lucide-react";
import { programCalendarApi }  from "@/api/admin/program-calendar.api";
import type { CustomHoliday }  from "@/api/admin/program-calendar.api";
import { HolidayCalendarGrid } from "./HolidayCalendarGrid";
import { HolidayListPanel }    from "./HolidayListPanel";
import { Button } from "@/components/ui/button";
import { cn }     from "@/lib/utils";

type ViewMode = "calendar" | "list";

interface HolidayBaseTabProps {
  /** Used only to determine the display year for the calendar grid */
  year: number;
}

export function HolidayBaseTab({ year }: HolidayBaseTabProps) {
  const queryClient = useQueryClient();
  const [viewMode,       setViewMode]       = useState<ViewMode>("calendar");
  const [enabledKeys,    setEnabledKeys]    = useState<Set<string>>(new Set());
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [dirty,          setDirty]          = useState(false);

  // Org-global config — no schoolYearId needed
  const { data: config, isLoading } = useQuery({
    queryKey: ["admin", "holiday-config"],
    queryFn:  () => programCalendarApi.getHolidayConfig(),
  });

  useEffect(() => {
    if (!config) return;
    setEnabledKeys(new Set(config.holidays.filter((h) => h.enabled).map((h) => h.key)));
    setCustomHolidays(config.customHolidays ?? []);
    setDirty(false);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () =>
      programCalendarApi.saveHolidayConfig({
        enabledKeys:    [...enabledKeys],
        customHolidays,
      }),
    onSuccess: (res) => {
      const syncMsg = res.synced > 0
        ? ` Re-synced ${res.synced} program calendar${res.synced !== 1 ? "s" : ""} automatically.`
        : "";
      toast.success(`Holiday configuration saved.${syncMsg}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "holiday-config"] });
      // Invalidate all program calendars so they show updated holiday rows
      queryClient.invalidateQueries({ queryKey: ["admin", "program-calendar"] });
      setDirty(false);
    },
    onError: () => toast.error("Failed to save holiday config."),
  });

  const seedMutation = useMutation({
    mutationFn: () => programCalendarApi.seedDefaultHolidays(),
    onSuccess: (res) => {
      const msg = res.added.length > 0
        ? `Seeded ${res.added.length} default holidays (${res.skipped} already present). Synced ${res.synced} program calendars.`
        : `All ${res.skipped} default holidays already enabled. No new holidays added.`;
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["admin", "holiday-config"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "program-calendar"] });
    },
    onError: () => toast.error("Failed to seed default holidays."),
  });

  function toggleKey(key: string, enabled: boolean) {
    setEnabledKeys((prev) => {
      const next = new Set(prev);
      enabled ? next.add(key) : next.delete(key);
      return next;
    });
    setDirty(true);
  }

  function addCustom(holiday: CustomHoliday) {
    setCustomHolidays((prev) => [...prev, holiday]);
    setDirty(true);
  }

  function removeCustom(idx: number) {
    setCustomHolidays((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  const holidays     = config?.holidays ?? [];
  const enabledCount = enabledKeys.size;

  const holidaysWithState = holidays.map((h) => ({
    ...h,
    enabled: enabledKeys.has(h.key),
  }));

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/20">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          This is the <strong>org-wide Holiday Base Calendar</strong> — reused across all school years.
          Configure which holidays apply once here. When you save, all existing program academic
          calendars are automatically updated to reflect the changes.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium">
          {isLoading ? "Loading…" : `${enabledCount} of ${holidays.length} holidays enabled`}
        </p>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            Seed Default Holidays
          </Button>

          {dirty && (
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Save Configuration
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border bg-card h-[520px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "calendar" ? (
        <HolidayCalendarGrid
          year={year}
          holidays={holidaysWithState}
          customHolidays={customHolidays}
          onToggleHoliday={toggleKey}
          onAddCustom={addCustom}
        />
      ) : (
        <HolidayListPanel
          holidays={holidaysWithState}
          customHolidays={customHolidays}
          enabledKeys={enabledKeys}
          onToggle={toggleKey}
          onAddCustom={addCustom}
          onRemoveCustom={removeCustom}
        />
      )}
    </div>
  );
}