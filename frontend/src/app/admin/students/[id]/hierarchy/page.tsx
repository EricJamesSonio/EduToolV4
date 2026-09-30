"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SubjectHierarchyGraph } from "@/components/admin/subject/hierarchy/SubjectHierarchyGraph";
import { SubjectHierarchyLegend } from "@/components/admin/subject/hierarchy/SubjectHierarchyLegend";
import { useSubjectHierarchy, useHierarchyStatuses } from "@/hooks/admin/useSubjectHierarchy";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentApi } from "@/api/admin/student.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { subjectCompletionApi } from "@/api/admin/subject-completion.api";
import { YEAR_COLORS } from "@/lib/palette";
import { toast } from "sonner";

type ConfirmAction =
  | { kind: "complete"; subjectId: string; subjectName: string }
  | { kind: "toggle"; overrideId: string; subjectName: string; to: "completed" | "pending" }
  | { kind: "abort"; overrideId: string; subjectName: string };

export default function StudentHierarchyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const backUrl = searchParams.get("back");
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [removeDependents, setRemoveDependents] = useState(false);
  const [markFilter, setMarkFilter] = useState<"all" | "enrolled" | "completed" | "notyet">("all");

  const { data: student } = useAsyncQuery(
    queryKeys.admin.students.detail(id),
    () => studentApi.getOne(id),
  );
  const { data: schoolYears } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );
  const activeSchoolYearId =
    schoolYears?.find((sy) => sy.status === "active")?.id ?? schoolYears?.[0]?.id ?? null;

  const { data: schoolYearEnrollments } = useAsyncQuery(
    queryKeys.admin.studentEnrollment.list({ schoolYearId: activeSchoolYearId }),
    () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId as string),
    { enabled: !!activeSchoolYearId },
  );

  const programEnrollments =
    schoolYearEnrollments?.data?.filter((e) => e.student_id === id) ?? [];
  const activePe = useMemo(() => {
    const all = programEnrollments.flatMap((e) => e.programEnrollments);
    return all.find((pe) => pe.status === "active") ?? all[0] ?? null;
  }, [programEnrollments]);

  const scope = useMemo(() => {
    if (!activePe || !activeSchoolYearId) return null;
    const pe = activePe as unknown as {
      program?: { id?: string; name?: string };
      program_id?: string;
      course?: { id?: string; name?: string } | null;
      course_id?: string | null;
      strand?: { id?: string; name?: string } | null;
      strand_id?: string | null;
      level?: { name?: string } | null;
    };
    return {
      schoolYearId: activeSchoolYearId,
      programId: pe.program?.id ?? pe.program_id as string,
      courseId: pe.course?.id ?? pe.course_id ?? undefined,
      strandId: pe.strand?.id ?? pe.strand_id ?? undefined,
      programName: pe.program?.name ?? "Program",
      courseName: pe.course?.name ?? null,
      strandName: pe.strand?.name ?? null,
      levelName: pe.level?.name ?? null,
    };
  }, [activePe, activeSchoolYearId]);

  const { data, isLoading } = useSubjectHierarchy(
    scope
      ? {
          schoolYearId: scope.schoolYearId,
          programId: scope.programId,
          courseId: scope.courseId,
          strandId: scope.strandId,
        }
      : {},
    !!scope,
  );

  const nodeIds = useMemo(() => (data?.nodes ?? []).map((n) => n.id), [data]);
  const { data: statuses } = useHierarchyStatuses(id, nodeIds, !!data);

  const { data: classEnrollments = [] } = useAsyncQuery(
    queryKeys.admin.students.enrollments(id),
    () => studentApi.getEnrollments(id),
    { enabled: !!id },
  );
  const enrolledSubjectIds = useMemo(() => {
    const set = new Set<string>();
    for (const e of classEnrollments) {
      if (e.status === "active" && e.class?.subject_id) set.add(e.class.subject_id);
    }
    return [...set];
  }, [classEnrollments]);
  const enrolledSet = useMemo(() => new Set(enrolledSubjectIds), [enrolledSubjectIds]);

  const completedIds = useMemo(
    () => nodeIds.filter((sid) => statuses?.[sid]?.status === "completed"),
    [nodeIds, statuses],
  );
  const dimIds = useMemo(() => {
    if (markFilter === "all") return null;
    if (markFilter === "enrolled") return enrolledSubjectIds;
    if (markFilter === "completed") return completedIds;
    return nodeIds.filter((sid) => !enrolledSet.has(sid) && statuses?.[sid]?.status !== "completed");
  }, [markFilter, enrolledSubjectIds, completedIds, nodeIds, enrolledSet, statuses]);

  const listKey = ["admin", "students", id, "subject-completions"];
  const { data: overrides = [] } = useQuery({
    queryKey: listKey,
    queryFn: () => subjectCompletionApi.list(id),
  });
  const overrideBySubject = useMemo(
    () => new Map(overrides.map((o) => [o.subject_id, o])),
    [overrides],
  );

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: listKey });
    queryClient.invalidateQueries({ queryKey: ["admin", "students", id, "subject-statuses"] });
  };

  const completeMutation = useMutation({
    mutationFn: (p: { subjectId: string; reason?: string }) =>
      subjectCompletionApi.markCompleted(id, p.subjectId, p.reason),
    onSuccess: () => {
      toast.success("Marked as completed — student can now take dependent subjects.");
      setConfirm(null);
      setReason("");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to mark completed"),
  });
  const toggleMutation = useMutation({
    mutationFn: (p: { overrideId: string; to: "completed" | "pending"; reason?: string }) =>
      subjectCompletionApi.updateStatus(id, p.overrideId, p.to, p.reason),
    onSuccess: (_, vars) => {
      toast.success(
        vars.to === "completed" ? "Marked as completed." : "Marked as pending — existing takes stay enrolled.",
      );
      setConfirm(null);
      setReason("");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to update status"),
  });
  const abortMutation = useMutation({
    mutationFn: (p: { overrideId: string; removeDependents: boolean }) =>
      subjectCompletionApi.abort(id, p.overrideId, p.removeDependents),
    onSuccess: () => {
      toast.success("Record aborted (hard deleted).");
      setConfirm(null);
      setRemoveDependents(false);
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to abort record"),
  });

  const ranks = useMemo(() => (data?.levels ?? []).map((l) => l.rank), [data]);
  const levelNameOf = useMemo(() => {
    const map = new Map((data?.levels ?? []).map((l) => [l.rank, l.name]));
    return (rank: number): string => map.get(rank) ?? `Year ${rank}`;
  }, [data]);

  const selected = useMemo(
    () => data?.nodes.find((n) => n.id === selectedId) ?? null,
    [data, selectedId],
  );
  const prereqsOfSelected = useMemo(() => {
    if (!selected || !data) return [];
    const fromIds = new Set(data.edges.filter((e) => e.to === selected.id).map((e) => e.from));
    return data.nodes.filter((n) => fromIds.has(n.id));
  }, [data, selected]);
  const dependentsOfSelected = useMemo(() => {
    if (!selected || !data) return [];
    const toIds = new Set(data.edges.filter((e) => e.from === selected.id).map((e) => e.to));
    return data.nodes.filter((n) => toIds.has(n.id));
  }, [data, selected]);

  const selectedOverride = selected ? overrideBySubject.get(selected.id) ?? null : null;
  const selectedStatus = selected ? statuses?.[selected.id] ?? null : null;
  const selectedCompleted = selectedStatus?.status === "completed";

  const goBack = (): void => {
    router.push(`/admin/students/${id}${backUrl ? `?back=${encodeURIComponent(backUrl)}` : ""}`);
  };

  const notYetCount = nodeIds.filter(
    (sid) => !enrolledSet.has(sid) && statuses?.[sid]?.status !== "completed",
  ).length;

  const filterOptions = [
    { key: "all", label: `All (${nodeIds.length})` },
    { key: "enrolled", label: `Enrolled now (${enrolledSubjectIds.length})` },
    { key: "completed", label: `Completed (${completedIds.length})` },
    { key: "notyet", label: `Not yet (${notYetCount})` },
  ] as const;

  const headerContent = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={goBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Subject Hierarchy — {student?.fullName ?? ""}
        </h1>
      </div>
      {scope ? (
        <>
          <p className="text-sm">
            <span className="font-medium">Auto-filtered:</span> {scope.programName}
            {scope.courseName ? ` · ${scope.courseName}` : ""}
            {scope.strandName ? ` · ${scope.strandName}` : ""}
            {scope.levelName ? ` · ${scope.levelName}` : ""}
          </p>
          {data && (
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <SubjectHierarchyLegend ranks={ranks} levelNameOf={levelNameOf} />
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.map((f) => (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={markFilter === f.key ? "default" : "outline"}
                    onClick={() => setMarkFilter(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {activeSchoolYearId ? "Student has no program enrollment to scope by." : "Loading enrollment…"}
        </p>
      )}
    </div>
  );

  return (
    <>
      <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] flex-col gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex shrink-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        >
          <span>Admin</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/admin/students" className="hover:text-foreground hover:underline">
            Students
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/admin/students/${id}`} className="hover:text-foreground hover:underline">
            {student?.fullName ?? "Detail"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">Hierarchy</span>
        </nav>

        <div className="min-h-0 flex-1">
          {data && scope ? (
            <div className="relative h-full">
              <SubjectHierarchyGraph
                fill
                header={headerContent}
                nodes={data.nodes}
                edges={data.edges}
                statuses={statuses ?? undefined}
                enrolledSubjectIds={enrolledSubjectIds}
                dimIds={dimIds}
                selectedId={selectedId}
                onSelect={(s) => setSelectedId(s.id || null)}
                levelNameOf={levelNameOf}
              />
              {selected && (
                <Card className="absolute right-4 top-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto p-5 space-y-3 shadow-xl">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: YEAR_COLORS[(selected.yearRank - 1) % YEAR_COLORS.length].swatch }}
                    />
                    <h3 className="font-semibold leading-snug">{selected.name}</h3>
                    <button
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedId(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {levelNameOf(selected.yearRank)}
                      {selected.termLabel ? ` · ${selected.termLabel}` : ""}
                    </p>
                    <Badge variant={selectedCompleted ? "default" : "secondary"} className="capitalize text-xs ml-auto">
                      {selectedCompleted ? "completed" : (selectedStatus?.status ?? "not taken")}
                    </Badge>
                  </div>
                  {selected && enrolledSet.has(selected.id) && (
                    <span className="inline-block w-fit rounded-sm bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Currently enrolled this school year
                    </span>
                  )}
                  {selectedCompleted && selectedStatus?.source === "grade" && !selectedOverride && (
                    <p className="text-xs text-muted-foreground">Completed via locked passing grade.</p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {!selectedCompleted && (
                      <Button
                        size="sm"
                        onClick={() => { setReason(""); setConfirm({ kind: "complete", subjectId: selected.id, subjectName: selected.name }); }}
                      >
                        Mark completed
                      </Button>
                    )}
                    {selectedCompleted && selectedOverride && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setReason(selectedOverride.reason ?? ""); setConfirm({ kind: "toggle", overrideId: selectedOverride.id, subjectName: selected.name, to: "pending" }); }}
                        >
                          Mark pending
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => { setRemoveDependents(false); setConfirm({ kind: "abort", overrideId: selectedOverride.id, subjectName: selected.name }); }}
                        >
                          Abort
                        </Button>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Prerequisites ({prereqsOfSelected.length})
                    </p>
                    {prereqsOfSelected.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No prerequisites — entry subject.</p>
                    ) : (
                      <ul className="space-y-1">
                        {prereqsOfSelected.map((p) => (
                          <li key={p.id}>
                            <button className="text-xs text-primary hover:underline" onClick={() => setSelectedId(p.id)}>
                              {p.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Required by ({dependentsOfSelected.length})
                    </p>
                    {dependentsOfSelected.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nothing requires this yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {dependentsOfSelected.map((d) => (
                          <li key={d.id}>
                            <button className="text-xs text-primary hover:underline" onClick={() => setSelectedId(d.id)}>
                              {d.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full p-5 space-y-3">
              {headerContent}
              {isLoading && (
                <p className="text-sm text-muted-foreground py-10 text-center">Loading hierarchy…</p>
              )}
            </Card>
          )}
        </div>
      </div>

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
          message={
            confirm.kind === "abort"
              ? `Abort "${confirm.subjectName}" completely? This hard-deletes the record as if it never existed.`
              : confirm.kind === "complete" || confirm.to === "completed"
                ? `Mark "${confirm.subjectName}" as completed? The student can then enroll in subjects that require it.`
                : `Mark "${confirm.subjectName}" as pending? Already-enrolled dependents stay enrolled; only new enrollments will be blocked.`
          }
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
    </>
  );
}