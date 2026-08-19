"use client";

import { useState, useEffect } from "react";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import { Loader2, List, CalendarDays, Info, Sparkles } from "lucide-react";
import { programCalendarApi } from "@/api/admin/program-calendar.api";
import type { CustomHoliday } from "@/api/admin/program-calendar.api";
import { HolidayCalendarGrid } from "./HolidayCalendarGrid";
import { HolidayListPanel } from "./HolidayListPanel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ViewMode = "calendar" | "list";

interface HolidayBaseTabProps {
  year: number;
}

export function HolidayBaseTab({ year }: HolidayBaseTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [enabledKeys, setEnabledKeys] = useState<Set<string>>(new Set());
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data: config, isLoading } = useAsyncQuery(
    queryKeys.admin.holidayConfig.list(),
    () => programCalendarApi.getHolidayConfig(),
  );

  useEffect(() => {
    if (!config) return;
    setEnabledKeys(new Set(config.holidays.filter((h) => h.enabled).map((h) => h.key)));
    setCustomHolidays(config.customHolidays ?? []);
    setDirty(false);
  }, [config]);

  const saveMutation = useMutationWithInvalidation(
    () =>
      programCalendarApi.saveHolidayConfig({
        enabledKeys: [...enabledKeys],
        customHolidays,
      }),
    {
      invalidateKeys: [queryKeys.admin.holidayConfig.list(), queryKeys.admin.programCalendar.all],
      onSuccess: (res) => {
        const syncMsg = res.synced > 0
          ? ` Re-synced ${res.synced} department calendar${res.synced !== 1 ? "s" : ""} automatically.`
          : "";
        toast.success(`Holiday configuration saved.${syncMsg}`);
        setDirty(false);
      },
      onError: () => toast.error("Failed to save holiday config."),
    },
  );

  const seedMutation = useMutationWithInvalidation(
    () => programCalendarApi.seedDefaultHolidays(),
    {
      invalidateKeys: [queryKeys.admin.holidayConfig.list(), queryKeys.admin.programCalendar.all],
      onSuccess: (res) => {
        const msg = res.added.length > 0
          ? `Seeded ${res.added.length} default holidays (${res.skipped} already present). Synced ${res.synced} department calendars.`
          : `All ${res.skipped} default holidays already enabled. No new holidays added.`;
        toast.success(msg);
      },
      onError: () => toast.error("Failed to seed default holidays."),
    },
  );

function toggleKey(key: string, enabled: boolean) {
  setEnabledKeys((prev) => {
    const next = new Set(prev);
    if (enabled) {
      next.add(key);
    } else {
      next.delete(key);
    }
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

  const holidays = config?.holidays ?? [];
  const enabledCount = enabledKeys.size;

  const holidaysWithState = holidays.map((h) => ({
    ...h,
    enabled: enabledKeys.has(h.key),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-info/25 bg-info/10 px-4 py-3">
        <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-info leading-relaxed not-interactive">
          This is the <strong>org-wide Holiday Base Calendar</strong> — reused across all school years.
          Configure which holidays apply once here. When you save, all existing department academic
          calendars are automatically updated to reflect the changes.
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium not-interactive">
          {isLoading ? "Loading…" : `${enabledCount} of ${holidays.length} holidays enabled`}
        </p>

        <div className="flex items-center gap-2">
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