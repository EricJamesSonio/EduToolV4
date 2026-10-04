"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy } from "lucide-react";

/**
 * Sentinel for the "use the department standard" option in the count select.
 * Base UI items need a non-empty value, so the default is never "".
 */
export const DEFAULT_OPTION = "default";

/** Hard bounds mirroring the backend DTO's per-session validation. */
export const MIN_SESSION_MINUTES = 5;
export const MAX_SESSION_MINUTES = 480;

export interface WeeklySessionDraft {
  /** Empty string = "use the department standard". */
  sessionsPerWeek: string;
  /** One entry per session, in minutes. Empty = uniform. */
  sessionDurations: number[];
  /** Fallback length for every session while the list is empty. */
  uniformMinutes: number | null;
  /**
   * True once the user has touched the schedule.
   *
   * Without this, deliberately picking values that happen to EQUAL the
   * department standard (e.g. choosing "3 per week" where the standard is
   * already 3) would be indistinguishable from never opening the control, and
   * saving would silently drop the choice. Touching it is what makes a subject
   * explicit; the values alone cannot tell us that.
   */
  touched: boolean;
}

export interface WeeklySessionsSectionProps {
  value: WeeklySessionDraft;
  onChange: (next: WeeklySessionDraft) => void;
  /** The school's slot length, used for the alignment warning. */
  slotMinutes: number;
  /** Resolved count to DISPLAY while following the standard. */
  resolvedCount: number;
  /** Resolved per-session lengths to DISPLAY while following the standard. */
  resolvedDurations: number[];
  /** True when the subject has nothing explicit stored. */
  isOnDefault: boolean;
  disabled?: boolean;
  error?: string;
}

/** Formats a length the way the rest of the UI writes it: "1h 30m", "45m". */
export function formatLength(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Splits minutes into the two inputs, e.g. 150 -> { h: "2", m: "30" }. */
export function splitMinutes(minutes: number | null): { h: string; m: string } {
  if (minutes == null) return { h: "", m: "" };
  return { h: String(Math.floor(minutes / 60)), m: String(minutes % 60) };
}

/** Collapses the two inputs back into a total, e.g. ("2", "30") -> 150. */
export function joinMinutes(h: string, m: string): number {
  return (Number(h) || 0) * 60 + (Number(m) || 0);
}


/**
 * Weekly sessions configuration.
 *
 * Optional on purpose: it only drives AUTOMATED CLASS GENERATION. A subject left
 * on the department standard follows that standard automatically, and the
 * resolved values are shown read-only so an admin can see what is actually in
 * effect without editing anything.
 *
 * Switching to a custom count/length is the ONLY way a subject becomes
 * explicit — nothing here is ever pre-filled from the standard.
 */
export function WeeklySessionsSection({
  value,
  onChange,
  slotMinutes,
  resolvedCount,
  resolvedDurations,
  isOnDefault,
  disabled = false,
  error,
}: WeeklySessionsSectionProps): React.JSX.Element {
  const isCustom = !isOnDefault;
  const count = value.sessionsPerWeek
    ? Number(value.sessionsPerWeek)
    : resolvedCount;

  // Base UI types the handler value as `string | null`; the sentinel list
  // never yields null, but narrow defensively rather than asserting.
  const setCount = (raw: string | null): void => {
    if (raw == null || raw === DEFAULT_OPTION) {
      onChange({ ...value, sessionsPerWeek: "", sessionDurations: [], touched: false });
      return;
    }
    const next = Number(raw);
    const previous = value.sessionDurations;
    // Re-shaping the count keeps the rows that survive their own length; new
    // rows start from the uniform value, never from the standard.
    const resized = Array.from({ length: next }, (_, i) =>
      i < previous.length
        ? previous[i]
        : (value.uniformMinutes ?? resolvedDurations[0] ?? 60),
    );
    onChange({ ...value, sessionsPerWeek: raw, sessionDurations: resized, touched: true });
  };

  const setUniform = (minutes: number | null): void => {
    const next =
      minutes == null ? [] : Array.from({ length: count }, () => minutes);
    onChange({ ...value, uniformMinutes: minutes, sessionDurations: next, touched: true });
  };

  const setDurationAt = (index: number, minutes: number): void => {
    const next = Array.from({ length: count }, (_, i) =>
      i === index ? minutes : (value.sessionDurations[i] ?? 60),
    );
    onChange({
      ...value,
      sessionDurations: next,
      uniformMinutes: next.every((d) => d === next[0]) ? next[0] : null,
      touched: true,
    });
  };

  /** "Apply to all" — collapse every row onto session 1's length. */
  const applyToAll = (): void => {
    const source = value.sessionDurations[0] ?? value.uniformMinutes;
    if (source == null) return;
    onChange({
      ...value,
      uniformMinutes: source,
      sessionDurations: Array.from({ length: count }, () => source),
      touched: true,
    });
  };

  const rows = isCustom ? value.sessionDurations : resolvedDurations;
  // All rows identical -> collapse to a single "all sessions" control.
  const uniformBase =
    rows.length > 0 && rows.every((d) => d === rows[0]) ? rows[0] : null;
  const misaligned = rows.find((d) => d > 0 && d % slotMinutes !== 0) ?? null;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Weekly sessions</Label>
        <p className="text-xs text-muted-foreground">
          Optional &mdash; used only by automated class generation. Leave it on
          the department standard and the generator follows that standard.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,13rem)_1fr]">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Sessions per week
          </Label>
          <Select
            value={value.sessionsPerWeek || DEFAULT_OPTION}
            onValueChange={setCount}
            disabled={disabled}
          >
            <SelectTrigger aria-label="Sessions per week">
              <SelectValue placeholder="Department standard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_OPTION}>
                Department standard
              </SelectItem>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} per week
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">
              Length of each session
            </Label>
            {isCustom && !uniformBase && count > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={applyToAll}
                disabled={disabled}
              >
                <Copy className="mr-1.5 h-3 w-3" />
                Apply to all
              </Button>
            )}
          </div>

          {uniformBase != null ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                className="w-20"
                min={0}
                max={8}
                placeholder="Hrs"
                aria-label="Session hours"
                disabled={disabled || !isCustom}
                value={splitMinutes(uniformBase).h}
                onChange={(e) =>
                  setUniform(joinMinutes(e.target.value, splitMinutes(uniformBase).m))
                }
              />
              <Input
                type="number"
                className="w-20"
                min={0}
                max={59}
                placeholder="Min"
                aria-label="Session minutes"
                disabled={disabled || !isCustom}
                value={splitMinutes(uniformBase).m}
                onChange={(e) =>
                  setUniform(joinMinutes(splitMinutes(uniformBase).h, e.target.value))
                }
              />
              <span className="text-xs text-muted-foreground">
                {isCustom
                  ? `all ${count} sessions`
                  : `department standard · ${count} sessions`}
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((minutes, i) => {
                const parts = splitMinutes(minutes);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">
                      Session {i + 1}
                    </span>
                    <Input
                      type="number"
                      className="w-20"
                      min={0}
                      max={8}
                      placeholder="Hrs"
                      aria-label={`Session ${i + 1} hours`}
                      disabled={disabled || !isCustom}
                      value={parts.h}
                      onChange={(e) =>
                        setDurationAt(i, joinMinutes(e.target.value, parts.m))
                      }
                    />
                    <Input
                      type="number"
                      className="w-20"
                      min={0}
                      max={59}
                      placeholder="Min"
                      aria-label={`Session ${i + 1} minutes`}
                      disabled={disabled || !isCustom}
                      value={parts.m}
                      onChange={(e) =>
                        setDurationAt(i, joinMinutes(parts.h, e.target.value))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {formatLength(minutes)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {isOnDefault
          ? `Following the department standard (${count} × ${formatLength(resolvedDurations[0] ?? 60)} per week). Pick a count or length to override it.`
          : `Each length must be a multiple of the school&apos;s ${slotMinutes}m slot, between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES} minutes.`}
      </p>

      {misaligned != null && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          {misaligned}m is not a multiple of the {slotMinutes}m slot and will be
          rejected on save.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
