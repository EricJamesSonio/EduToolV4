"use client";

// frontend/src/components/admin/academic-calendar/HolidayBaseTab.tsx

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Sparkles, List, CalendarDays } from "lucide-react";
import { programCalendarApi }    from "@/api/admin/program-calendar.api";
import type { CustomHoliday }    from "@/api/admin/program-calendar.api";
import { HolidayCalendarGrid }   from "./HolidayCalendarGrid";
import { HolidayListPanel }      from "./HolidayListPanel";
import { Button }   from "@/components/ui/button";
import { cn }       from "@/lib/utils";

type ViewMode = "calendar" | "list";

interface HolidayBaseTabProps {
  schoolYearId: string;
  year:         number; // calendar display year
}

export function HolidayBaseTab({ schoolYearId, year }: HolidayBaseTabProps) {
  const queryClient = useQueryClient();
  const [viewMode,       setViewMode]       = useState<ViewMode>("calendar");
  const [enabledKeys,    setEnabledKeys]    = useState<Set<string>>(new Set());
  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);
  const [dirty,          setDirty]          = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin", "holiday-config", schoolYearId],
    queryFn:  () => programCalendarApi.getHolidayConfig(schoolYearId),
    enabled:  !!schoolYearId,
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
      programCalendarApi.seedHolidays({ schoolYearId, year }),
    onSuccess: (res) => {
      toast.success(
        `Seeded ${res.seeded} holiday event${res.seeded !== 1 ? "s" : ""} to the school year calendar.`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "calendar"] });
    },
    onError: () => toast.error("Failed to seed holidays."),
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

  if (!schoolYearId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          Select a school year to configure holidays.
        </p>
      </div>
    );
  }

  const holidays = config?.holidays ?? [];
  const enabledCount = enabledKeys.size;

  // Build holidays with current enabled state (local, not yet saved)
  const holidaysWithState = holidays.map((h) => ({
    ...h,
    enabled: enabledKeys.has(h.key),
  }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium">
            {enabledCount} of {holidays.length} holidays enabled
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any day or use the list view to enable/disable. Save config first, then seed.
          </p>
        </div>

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

          <Button
            size="sm"
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending || dirty}
            title={dirty ? "Save configuration before seeding" : "Seed enabled holidays as calendar events"}
          >
            {seedMutation.isPending
              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            }
            Seed to Calendar
          </Button>
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