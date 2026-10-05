"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  generatorEntityTarget,
  generatorIssueTarget,
} from "@/utils/generatorReadinessTargets";
import type {
  GeneratePreview,
  GeneratorReadinessIssue,
} from "@/types/admin/class-generator.types";

/** Matches the grid's Mon -> Sun column order. */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const hhmm = (min: number) => {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

/**
 * Readiness issues with links to the page that fixes each one, mirroring the
 * school-year readiness display. Whole-issue links come first; aggregate
 * issues render their entities as chips (+N more when capped).
 */
export function GeneratorReadinessIssues({
  data,
  schoolYearId,
}: {
  data: {
    ok: boolean;
    activeWeekdays: number[];
    warnings: string[];
    issues: GeneratorReadinessIssue[];
  };
  schoolYearId: string;
}): React.JSX.Element {
  const blocking = data.issues.filter((i) => i.severity === "blocking");
  const warnings = data.issues.filter((i) => i.severity === "warning");
  // Plain-text extras with no issue behind them (window caveat, scope note).
  const issueMessages = new Set(data.issues.map((i) => i.message));
  const extras = data.warnings.filter((w) => !issueMessages.has(w));

  return (
    <div className="space-y-2 rounded-md border p-3">
      {blocking.map((issue) => (
        <IssueRow
          key={issue.code}
          issue={issue}
          schoolYearId={schoolYearId}
          tone="destructive"
        />
      ))}
      {warnings.map((issue) => (
        <IssueRow
          key={issue.code}
          issue={issue}
          schoolYearId={schoolYearId}
          tone="muted"
        />
      ))}
      {extras.map((w) => (
        <p
          key={w}
          className="flex items-start gap-1.5 text-xs text-muted-foreground"
        >
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {w}
        </p>
      ))}
      {data.ok && data.warnings.length === 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready to generate across{" "}
          {data.activeWeekdays.map((d) => DAY_LABELS[d]).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function IssueRow({
  issue,
  schoolYearId,
  tone,
}: {
  issue: GeneratorReadinessIssue;
  schoolYearId: string;
  tone: "destructive" | "muted";
}): React.JSX.Element {
  const href = generatorIssueTarget(issue, schoolYearId);
  const entities = issue.entities ?? [];
  const hidden = Math.max(
    0,
    (issue.count ?? entities.length) - entities.length,
  );
  const textClass =
    tone === "destructive" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <p className={`flex items-start gap-1.5 text-xs ${textClass}`}>
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {href ? (
          <Link href={href} className="underline underline-offset-2 hover:opacity-80">
            {issue.message}
          </Link>
        ) : (
          <span>{issue.message}</span>
        )}
        {typeof issue.count === "number" ? (
          <Badge variant="outline" className="ml-1 text-[10px]">
            {issue.count}
          </Badge>
        ) : null}
      </p>
      {entities.length > 0 ? (
        <div className="flex flex-wrap gap-1 pl-5">
          {entities.map((e) => {
            const target = generatorEntityTarget(e, schoolYearId);
            return target ? (
              <Link key={`${e.type}:${e.id}`} href={target}>
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal hover:bg-muted"
                >
                  {e.name}
                </Badge>
              </Link>
            ) : (
              <Badge
                key={`${e.type}:${e.id}`}
                variant="outline"
                className="text-[10px] font-normal"
              >
                {e.name}
              </Badge>
            );
          })}
          {hidden > 0 ? (
            <span className="text-[10px] text-muted-foreground">
              +{hidden} more
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** The review step. Split out to keep the configure markup readable. */
export function PreviewStep({
  plan,
  committing,
  onBack,
  onConfirm,
}: {
  plan: GeneratePreview | null;
  committing: boolean;
  onBack: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  if (!plan) {
    return <p className="text-sm text-muted-foreground">No plan yet.</p>;
  }

  const placed = plan.items.filter((i) => !i.unplacedReason);
  const unplaced = plan.items.filter((i) => i.unplacedReason);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary">{plan.placedCount} to create</Badge>
          {unplaced.length > 0 ? (
            <Badge variant="outline" className="text-muted-foreground">
              {unplaced.length} could not be placed
            </Badge>
          ) : null}
        </div>
        <ScrollArea className="h-[38vh] rounded-md border">
          <div className="space-y-1 p-2">
            {placed.map((item) => (
              <div
                key={`${item.sectionId}:${item.subjectId}`}
                className="rounded border p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.subjectName}
                      <span className="text-muted-foreground">
                        {" "}
                        — {item.sectionName}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.levelName} · {item.sessionsPerWeek} ×{" "}
                      {item.sessionMinutes}m ·{" "}
                      {item.educatorName ?? "unassigned"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {item.slots.map((s, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {DAY_LABELS[s.weekday]} {hhmm(s.startMin)}
                      </Badge>
                    ))}
                  </div>
                </div>
                {item.warnings.map((w) => (
                  <p
                    key={w}
                    className="mt-1 flex items-start gap-1 text-[11px] text-amber-600 dark:text-amber-400"
                  >
                    <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                    {w}
                  </p>
                ))}
              </div>
            ))}
            {unplaced.map((item) => (
              <div
                key={`${item.sectionId}:${item.subjectId}`}
                className="rounded border border-dashed p-2 opacity-70"
              >
                <p className="text-sm">
                  {item.subjectName}
                  <span className="text-muted-foreground">
                    {" "}
                    — {item.sectionName}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Skipped: {item.unplacedReason}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={committing}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={committing || placed.length === 0}>
          {committing ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
          )}
          Create {placed.length} class{placed.length === 1 ? "" : "es"}
        </Button>
      </div>
    </>
  );
}
