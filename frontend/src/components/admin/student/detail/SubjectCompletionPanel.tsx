"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Network, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { subjectCompletionApi } from "@/api/admin/subject-completion.api";
import type { SubjectCompletionOverride } from "@/api/admin/subject-completion.api";
import dynamic from "next/dynamic";
const SubjectHierarchyModal = dynamic(
  () => import("@/components/admin/subject/hierarchy/SubjectHierarchyModal").then((m) => m.SubjectHierarchyModal),
  { ssr: false },
);
import type { HierarchyScope } from "@/api/admin/subject-hierarchy.api";

interface Props {
  studentId: string;
}

type PendingAction =
  | { kind: "toggle"; overrideId: string; subjectName: string; to: "completed" | "pending" }
  | { kind: "abort"; overrideId: string; subjectName: string };

type RecordFilter = "all" | "regular" | "manual" | "pending";

interface YearGroup {
  key: string;
  label: string;
  rank: number;
  items: SubjectCompletionOverride[];
}

const OTHER_GROUP_KEY = "__other__";

function isRegularCredit(record: SubjectCompletionOverride): boolean {
  return record.source === "regular";
}

function parseRank(label: string | null): number {
  if (!label) return Number.MAX_SAFE_INTEGER;
  const match = label.match(/\d+/);
  return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER - 1;
}

function sortRecords(a: SubjectCompletionOverride, b: SubjectCompletionOverride): number {
  const term = (a.subject.term_label ?? "").localeCompare(b.subject.term_label ?? "");
  if (term !== 0) return term;
  return a.subject.name.localeCompare(b.subject.name);
}

function groupByYear(records: SubjectCompletionOverride[]): YearGroup[] {
  const groups = new Map<string, YearGroup>();
  for (const record of records) {
    const yearLabel = record.subject.year_level;
    const key = yearLabel ?? OTHER_GROUP_KEY;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: yearLabel ?? "Other subjects",
        rank: parseRank(yearLabel),
        items: [],
      };
      groups.set(key, group);
    }
    group.items.push(record);
  }
  return [...groups.values()]
    .map((group) => ({ ...group, items: [...group.items].sort(sortRecords) }))
    .sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label));
}

export function SubjectCompletionPanel({ studentId }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RecordFilter>("all");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<PendingAction | null>(null);
  const [removeDependents, setRemoveDependents] = useState(false);
  const [hierarchy, setHierarchy] = useState<{ scope: HierarchyScope; focusId: string; label: string } | null>(null);

  const listKey = ["admin", "students", studentId, "subject-completions"];
  const { data: overrides = [], isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => subjectCompletionApi.list(studentId),
  });

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: listKey });
    queryClient.invalidateQueries({ queryKey: ["admin", "students", studentId, "subject-statuses"] });
  };

  const toggleMutation = useMutation({
    mutationFn: (p: { overrideId: string; to: "completed" | "pending"; reason?: string }) =>
      subjectCompletionApi.updateStatus(studentId, p.overrideId, p.to, p.reason),
    onSuccess: (_, vars) => {
      toast.success(
        vars.to === "completed"
          ? "Marked as completed."
          : "Marked as pending — already-taken dependents stay enrolled (grandfathered).",
      );
      setConfirm(null);
      setReason("");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to update status"),
  });

  const abortMutation = useMutation({
    mutationFn: (p: { overrideId: string; removeDependents: boolean }) =>
      subjectCompletionApi.abort(studentId, p.overrideId, p.removeDependents),
    onSuccess: () => {
      toast.success("Record aborted (hard deleted).");
      setConfirm(null);
      setRemoveDependents(false);
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to abort record"),
  });

  const counts = useMemo(() => {
    let regular = 0;
    let manual = 0;
    let pending = 0;
    for (const o of overrides) {
      if (isRegularCredit(o)) regular += 1;
      else manual += 1;
      if (o.status === "pending") pending += 1;
    }
    return { all: overrides.length, regular, manual, pending };
  }, [overrides]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return overrides.filter((o) => {
      if (filter === "regular" && !isRegularCredit(o)) return false;
      if (filter === "manual" && isRegularCredit(o)) return false;
      if (filter === "pending" && o.status !== "pending") return false;
      if (q && !o.subject.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [overrides, filter, search]);

  const groups = useMemo(() => groupByYear(filtered), [filtered]);

  const filterOptions: { key: RecordFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "regular", label: "Regular", count: counts.regular },
    { key: "manual", label: "Manual", count: counts.manual },
    { key: "pending", label: "Pending", count: counts.pending },
  ];

  const openHierarchy = (record: SubjectCompletionOverride): void => {
    if (!record.subject.program_id) return;
    setHierarchy({
      scope: {
        programId: record.subject.program_id,
        courseId: record.subject.course_id ?? undefined,
        strandId: record.subject.strand_id ?? undefined,
      },
      focusId: record.subject_id,
      label: record.subject.name,
    });
  };

  const confirmMessage = (a: PendingAction): string => {
    if (a.kind === "toggle" && a.to === "completed")
      return `Mark "${a.subjectName}" as completed? The student can then enroll in subjects that require it.`;
    if (a.kind === "toggle")
      return `Mark "${a.subjectName}" as pending? Already-enrolled dependents stay enrolled; only new enrollments will be blocked.`;
    return `Abort "${a.subjectName}" completely? This hard-deletes the record as if it never existed.`;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <BookOpenCheck className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold leading-none">Subject Completion Records</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Completed unlocks prerequisites; pending blocks new takes but keeps existing ones.
          </p>
        </div>
        <div className="ml-auto flex gap-1.5">
          {overrides.length > 0 && overrides[0].subject.program_id && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => openHierarchy(overrides[0])}
            >
              <Network className="h-3.5 w-3.5" /> Hierarchy
            </Button>
          )}
          <Button size="sm" className="gap-1" onClick={() => router.push(`/admin/students/${studentId}/hierarchy`)}>
            <Plus className="h-3.5 w-3.5" /> Mark subject
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          className="sm:max-w-xs"
          placeholder="Search subjects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {filterOptions.map((option) => (
            <Button
              key={option.key}
              size="sm"
              variant={filter === option.key ? "default" : "outline"}
              onClick={() => setFilter(option.key)}
            >
              {option.label} ({option.count})
            </Button>
          ))}
        </div>
      </div>

      {counts.regular > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Regular</span> subjects were credited automatically because this
          student is marked Regular. Mark the student Irregular to remove them.
        </p>
      )}

      <div className="mt-3 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {overrides.length === 0 ? "No completion records yet." : "No subjects match this filter."}
          </p>
        ) : (
          groups.map((group) => {
            const completedCount = group.items.filter((o) => o.status === "completed").length;
            return (
              <div key={group.key} className="rounded-lg border overflow-hidden">
                <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2">
                  <span className="text-sm font-semibold not-interactive">{group.label}</span>
                  <span className="text-xs text-muted-foreground not-interactive">
                    {completedCount} of {group.items.length} completed
                  </span>
                </div>

                <div className="divide-y">
                  {group.items.map((o) => {
                    const regular = isRegularCredit(o);
                    return (
                      <div
                        key={o.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5"
                      >
                        <div className="min-w-0 flex-1 basis-56">
                          <button
                            className="block max-w-full truncate text-left text-sm font-medium hover:text-primary hover:underline"
                            title="View in subject hierarchy"
                            onClick={() => openHierarchy(o)}
                          >
                            {o.subject.name}
                          </button>
                          {(o.subject.term_label || o.reason) && (
                            <p className="truncate text-xs text-muted-foreground">
                              {[o.subject.term_label, o.reason].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>

                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-xs",
                            regular
                              ? "border-primary/40 text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {regular ? "Regular" : "Manual"}
                        </Badge>

                        <Badge
                          variant={o.status === "completed" ? "default" : "secondary"}
                          className="shrink-0 capitalize text-xs"
                        >
                          {o.status}
                        </Badge>

                        <div className="flex shrink-0 items-center gap-1">
                          {o.status === "completed" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReason(o.reason ?? "");
                                setConfirm({ kind: "toggle", overrideId: o.id, subjectName: o.subject.name, to: "pending" });
                              }}
                            >
                              Mark pending
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReason(o.reason ?? "");
                                setConfirm({ kind: "toggle", overrideId: o.id, subjectName: o.subject.name, to: "completed" });
                              }}
                            >
                              Mark completed
                            </Button>
                          )}
                          {!regular && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive gap-1"
                              onClick={() => {
                                setRemoveDependents(false);
                                setConfirm({ kind: "abort", overrideId: o.id, subjectName: o.subject.name });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Abort
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          open
          title={
            confirm.kind === "abort"
              ? "Abort record?"
              : confirm.to === "completed"
                ? "Mark as completed?"
                : "Mark as pending?"
          }
          message={confirmMessage(confirm)}
          description={
            confirm.kind === "abort" ? (
              <span className="mt-2 block space-y-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={removeDependents}
                    onChange={(e) => setRemoveDependents(e.target.checked)}
                  />
                  Also remove student&apos;s active enrollments in dependent subjects
                </label>
                {!removeDependents && (
                  <span className="block text-muted-foreground">
                    Default: already-taken subjects stay enrolled even after abort.
                  </span>
                )}
              </span>
            ) : (
              <span className="mt-2 block">
                <Label>Reason / note (optional)</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Verified TOR"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </span>
            )
          }
          confirmLabel={confirm.kind === "abort" ? "Abort record" : "Confirm"}
          destructive={confirm.kind === "abort"}
          isLoading={toggleMutation.isPending || abortMutation.isPending}
          onConfirm={() => {
            if (confirm.kind === "toggle") {
              toggleMutation.mutate({ overrideId: confirm.overrideId, to: confirm.to, reason: reason || undefined });
            } else {
              abortMutation.mutate({ overrideId: confirm.overrideId, removeDependents });
            }
          }}
          onOpenChange={(o) => { if (!o) setConfirm(null); }}
        />
      )}

      {hierarchy && (
        <SubjectHierarchyModal
          open
          onClose={() => setHierarchy(null)}
          scope={hierarchy.scope}
          scopeLabel={`Showing hierarchy around "${hierarchy.label}". A check mark means completed (record or passing grade).`}
          studentId={studentId}
          focusSubjectId={hierarchy.focusId}
          title="Subject Hierarchy"
        />
      )}
    </Card>
  );
}