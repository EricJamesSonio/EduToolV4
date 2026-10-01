"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";

import {
  useCommitGenerated,
  useGeneratePreview,
  useGeneratorReadiness,
} from "@/hooks/admin/useClassGenerator";
import { programApi } from "@/api/admin/program.api";
import { semesterApi } from "@/api/admin/semester.api";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  GeneratePreview,
  GenerateRequest,
} from "@/types/admin/class-generator.types";

/** Matches the grid's Mon -> Sun column order. */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const hhmm = (min: number) => {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

type Step = "configure" | "preview";

interface ClassGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  schoolYearId?: string;
  onGenerated?: () => void;
}

export function ClassGeneratorDialog({
  open,
  onClose,
  schoolYearId,
  onGenerated,
}: ClassGeneratorDialogProps): React.JSX.Element {
  const [step, setStep] = useState<Step>("configure");
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [useWindow, setUseWindow] = useState(false);
  const [windowStart, setWindowStart] = useState("08:00");
  const [windowEnd, setWindowEnd] = useState("15:00");
  const [plan, setPlan] = useState<GeneratePreview | null>(null);

  const previewMutation = useGeneratePreview();
  const commitMutation = useCommitGenerated(() => {
    setPlan(null);
    setStep("configure");
    onGenerated?.();
  });

  const { data: programs = [] } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
  );
  const { data: semesters = [] } = useAsyncQuery(
    queryKeys.admin.semesters.list({ schoolYearId }),
    () => semesterApi.getAll(schoolYearId),
    { enabled: !!schoolYearId },
  );

  const readiness = useGeneratorReadiness(schoolYearId, programIds);

  useEffect(() => {
    if (!open) {
      setStep("configure");
      setPlan(null);
    }
  }, [open]);

  // Default to the first semester once the list arrives, so the admin does not
  // have to choose where there is only one sensible value.
  useEffect(() => {
    if (!semesterId && semesters.length > 0) setSemesterId(semesters[0].id);
  }, [semesters, semesterId]);

  const buildRequest = useMemo(
    (): GenerateRequest => ({
      schoolYearId: schoolYearId!,
      programIds,
      semesterId,
      ...(useWindow ? { windowStart, windowEnd } : {}),
    }),
    [schoolYearId, programIds, semesterId, useWindow, windowStart, windowEnd],
  );

  const canPreview = !!schoolYearId && programIds.length > 0 && !!semesterId;

  const runPreview = () => {
    previewMutation.mutate(buildRequest, {
      onSuccess: (result) => {
        setPlan(result);
        setStep("preview");
      },
    });
  };

  const toggleProgram = (id: string) => {
    setProgramIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Auto-generate classes
          </DialogTitle>
          <DialogDescription>
            {step === "configure"
              ? "Choose what to generate. Nothing is written until you approve the preview."
              : "Review the plan. Only placed items will be created."}
          </DialogDescription>
        </DialogHeader>

        {step === "configure" ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Departments</Label>
              <div className="flex flex-wrap gap-1.5">
                {programs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No departments in this school year.
                  </p>
                ) : (
                  programs.map((p) => {
                    const on = programIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleProgram(p.id)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Semester</Label>
              <Select
                value={semesterId}
                onValueChange={(v) => setSemesterId(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-window"
                  checked={useWindow}
                  onCheckedChange={(v) => setUseWindow(!!v)}
                />
                <Label htmlFor="use-window" className="text-xs font-normal">
                  Limit to a daily time window
                </Label>
              </div>
              {useWindow ? (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <Input
                    type="time"
                    step={60}
                    value={windowStart}
                    onChange={(e) => setWindowStart(e.target.value)}
                    aria-label="Window start"
                    className="h-9"
                  />
                  <Input
                    type="time"
                    step={60}
                    value={windowEnd}
                    onChange={(e) => setWindowEnd(e.target.value)}
                    aria-label="Window end"
                    className="h-9"
                  />
                </div>
              ) : null}
            </div>

            {readiness.data ? <ReadinessPanel data={readiness.data} /> : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={runPreview}
                disabled={!canPreview || previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1.5" />
                )}
                Preview plan
              </Button>
            </div>
          </div>
        ) : (
          <PreviewStep
            plan={plan}
            committing={commitMutation.isPending}
            onBack={() => setStep("configure")}
            onConfirm={() =>
              commitMutation.mutate({ ...buildRequest, confirmed: true })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Blockers and warnings from the server, shown while configuring. */
function ReadinessPanel({
  data,
}: {
  data: {
    ok: boolean;
    activeWeekdays: number[];
    warnings: string[];
    blockers: string[];
  };
}): React.JSX.Element {
  return (
    <div className="space-y-2 rounded-md border p-3">
      {data.blockers.map((b) => (
        <p
          key={b}
          className="flex items-start gap-1.5 text-xs text-destructive"
        >
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {b}
        </p>
      ))}
      {data.warnings.map((w) => (
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

/** The review step. Split out to keep the configure markup readable. */
function PreviewStep({
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