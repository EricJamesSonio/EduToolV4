"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, Network, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { subjectCompletionApi } from "@/api/admin/subject-completion.api";
import { SubjectHierarchyModal } from "@/components/admin/subject/hierarchy/SubjectHierarchyModal";
import type { HierarchyScope } from "@/api/admin/subject-hierarchy.api";

interface Props {
  studentId: string;
}

type PendingAction =
  | { kind: "complete"; subjectId: string; subjectName: string }
  | { kind: "toggle"; overrideId: string; subjectName: string; to: "completed" | "pending" }
  | { kind: "abort"; overrideId: string; subjectName: string };

export function SubjectCompletionPanel({ studentId }: Props): React.JSX.Element {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [pickedSubjectId, setPickedSubjectId] = useState("");
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<PendingAction | null>(null);
  const [removeDependents, setRemoveDependents] = useState(false);
  const [hierarchy, setHierarchy] = useState<{ scope: HierarchyScope; focusId: string; label: string } | null>(null);

  const listKey = ["admin", "students", studentId, "subject-completions"];
  const { data: overrides = [], isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => subjectCompletionApi.list(studentId),
  });
  const { data: catalog = [] } = useQuery({
    queryKey: ["admin", "students", studentId, "subject-catalog", catalogSearch],
    queryFn: () => subjectCompletionApi.catalog(studentId, catalogSearch || undefined),
    enabled: addOpen,
  });

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: listKey });
    queryClient.invalidateQueries({ queryKey: ["admin", "students", studentId, "subject-statuses"] });
  };

  const completeMutation = useMutation({
    mutationFn: (p: { subjectId: string; reason?: string }) =>
      subjectCompletionApi.markCompleted(studentId, p.subjectId, p.reason),
    onSuccess: () => {
      toast.success("Marked as completed — student can now take dependent subjects.");
      setConfirm(null);
      setAddOpen(false);
      setPickedSubjectId("");
      setReason("");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to mark completed"),
  });

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return overrides;
    return overrides.filter((o) => o.subject.name.toLowerCase().includes(q));
  }, [overrides, search]);

  const existingSubjectIds = useMemo(() => new Set(overrides.map((o) => o.subject_id)), [overrides]);
  const catalogOptions = useMemo(
    () => catalog.filter((c) => !existingSubjectIds.has(c.id)),
    [catalog, existingSubjectIds],
  );

  const confirmMessage = (a: PendingAction): string => {
    if (a.kind === "complete")
      return `Mark "${a.subjectName}" as completed? The student can then enroll in subjects that require it.`;
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
            Transferee / pre-system credits. Completed unlocks prerequisites; pending blocks new takes but keeps existing ones.
          </p>
        </div>
        <div className="ml-auto flex gap-1.5">
          {overrides.length > 0 && overrides[0].subject.program_id && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                const s = overrides[0].subject;
                setHierarchy({
                  scope: {
                    programId: s.program_id ?? undefined,
                    courseId: s.course_id ?? undefined,
                    strandId: s.strand_id ?? undefined,
                  },
                  focusId: overrides[0].subject_id,
                  label: overrides[0].subject.name,
                });
              }}
            >
              <Network className="h-3.5 w-3.5" /> Hierarchy
            </Button>
          )}
          <Button size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Mark subject
          </Button>
        </div>
      </div>

      <div className="mt-3 mb-3">
        <Input placeholder="Search records…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No completion records yet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((o) => (
            <div key={o.id} className="rounded-lg border bg-card px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  className="text-sm font-medium truncate text-left hover:text-primary hover:underline"
                  title="View in subject hierarchy"
                  onClick={() => {
                    if (!o.subject.program_id) return;
                    setHierarchy({
                      scope: {
                        programId: o.subject.program_id,
                        courseId: o.subject.course_id ?? undefined,
                        strandId: o.subject.strand_id ?? undefined,
                      },
                      focusId: o.subject_id,
                      label: o.subject.name,
                    });
                  }}
                >
                  {o.subject.name}
                </button>
                <Badge variant={o.status === "completed" ? "default" : "secondary"} className="capitalize text-xs shrink-0">
                  {o.status}
                </Badge>
              </div>
              {o.subject.year_level || o.subject.term_label ? (
                <p className="text-xs text-muted-foreground">
                  {[o.subject.year_level, o.subject.term_label].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {o.reason ? <p className="text-xs text-muted-foreground italic">“{o.reason}”</p> : null}
              <div className="flex flex-wrap gap-1.5">
                {o.status === "completed" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setReason(o.reason ?? ""); setConfirm({ kind: "toggle", overrideId: o.id, subjectName: o.subject.name, to: "pending" }); }}
                  >
                    Mark pending
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setReason(o.reason ?? ""); setConfirm({ kind: "toggle", overrideId: o.id, subjectName: o.subject.name, to: "completed" }); }}
                  >
                    Mark completed
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive gap-1"
                  onClick={() => { setRemoveDependents(false); setConfirm({ kind: "abort", overrideId: o.id, subjectName: o.subject.name }); }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Abort
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Mark subject as completed" size="sm">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Search subjects</Label>
              <Input placeholder="Type subject name…" value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Select value={pickedSubjectId} onValueChange={(v) => setPickedSubjectId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject by name" />
                </SelectTrigger>
                <SelectContent>
                  {catalogOptions.length === 0 ? (
                    <SelectItem value="__none" disabled>No subjects found</SelectItem>
                  ) : (
                    catalogOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.year_level ? ` · ${c.year_level}` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason / note (optional)</Label>
              <Input placeholder="e.g. Taken at previous school" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!pickedSubjectId || completeMutation.isPending}
              onClick={() => {
                const item = catalogOptions.find((c) => c.id === pickedSubjectId);
                setConfirm({ kind: "complete", subjectId: pickedSubjectId, subjectName: item?.name ?? "subject" });
              }}
            >
              Review & confirm
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={
            confirm.kind === "abort"
              ? "Abort record?"
              : confirm.kind === "complete" || confirm.to === "completed"
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
          isLoading={completeMutation.isPending || toggleMutation.isPending || abortMutation.isPending}
          onConfirm={() => {
            if (confirm.kind === "complete") {
              completeMutation.mutate({ subjectId: confirm.subjectId, reason: reason || undefined });
            } else if (confirm.kind === "toggle") {
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
          scopeLabel={`Showing hierarchy around “${hierarchy.label}”. ✓ = completed (record or passing grade).`}
          studentId={studentId}
          focusSubjectId={hierarchy.focusId}
          title="Subject Hierarchy"
        />
      )}
    </Card>
  );
}
