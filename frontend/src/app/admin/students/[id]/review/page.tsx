"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckSquare, Square, BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentApi } from "@/api/admin/student.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { classApi } from "@/api/admin/class.api";
import { useClassAssignmentRequests, useFinalizeClassAssignmentRequest } from "@/hooks/admin/useClassAssignmentRequest";

export default function StudentReviewPage({ params }: { params: Promise<{ id: string }> }): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: student } = useAsyncQuery(queryKeys.admin.students.detail(id), () => studentApi.getOne(id));
  const { data: schoolYears } = useAsyncQuery(queryKeys.admin.schoolYears.list(), schoolYearApi.getAll);
  const activeSchoolYearId = schoolYears?.find((sy) => sy.status === "active")?.id ?? schoolYears?.[0]?.id ?? null;

  const { data: syeData } = useAsyncQuery(
    queryKeys.admin.studentEnrollment.list({ schoolYearId: activeSchoolYearId }),
    () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId!),
    { enabled: !!activeSchoolYearId },
  );

  const activeSye = syeData?.data?.find((e) => e.student_id === id) ?? null;
  const activePe = activeSye?.programEnrollments?.find((pe) => pe.status === "active") ?? activeSye?.programEnrollments?.[0] ?? null;

  const { data: requestsData, isLoading: reqLoading } = useClassAssignmentRequests({ studentId: id, status: "pending_review" });

  // Available classes where student enrolled (program/section) — use eligible endpoint to get live prerequisite warnings
  const sectionIdForFilter = activePe?.section?.id ?? null;
  const { data: classesRaw, isLoading: classesLoading } = useAsyncQuery(
    ["admin", "review-classes-eligible", id, activeSye?.id, sectionIdForFilter] as unknown as readonly unknown[],
    () =>
      classApi.getEligibleForStudent(id).then((all) => {
        let filtered = all as unknown as Array<Record<string, unknown>>;
        if (activeSchoolYearId) filtered = filtered.filter((c) => (c as unknown as { schoolYearId: string }).schoolYearId === activeSchoolYearId);
        if (sectionIdForFilter) filtered = filtered.filter((c) => (c as unknown as { sectionId: string | null }).sectionId === sectionIdForFilter);
        return filtered;
      }),
    { enabled: !!activeSchoolYearId && !!activePe && !!id },
  );

  const availableClasses = useMemo(() => {
    const arr = (classesRaw as unknown as { data?: unknown[] } | unknown[]) as unknown;
    if (Array.isArray(arr)) return arr as { id: string; subjectName?: string; subjectId?: string; subject?: { name: string } }[];
    const inner = (arr as Record<string, unknown>)?.data;
    if (Array.isArray(inner)) return inner as never[];
    // fallback: classApi returns {data, total}
    const maybe = classesRaw as unknown as { data?: { id: string; subjectName?: string }[] };
    return maybe?.data ?? [];
  }, [classesRaw]);

  const request = (requestsData as unknown as { data?: Array<{ id: string; has_prerequisite_warning?: boolean; prerequisite_warnings?: Array<{ subject_name: string; prerequisite_subject_name: string; prerequisite_subject_id: string; subject_id: string }> }> })?.data?.[0] as unknown as { id: string; has_prerequisite_warning?: boolean; prerequisite_warnings?: Array<{ subject_name: string; prerequisite_subject_name: string; prerequisite_subject_id: string; subject_id: string }> } | undefined
    ?? (Array.isArray(requestsData) ? (requestsData as unknown as Array<{ id: string; has_prerequisite_warning?: boolean; prerequisite_warnings?: never[] }>)[0] as unknown as { id: string; has_prerequisite_warning?: boolean; prerequisite_warnings?: never[] } : undefined);
  const frozenWarnings = (request as unknown as { prerequisite_warnings?: unknown[] })?.prerequisite_warnings ?? [];

  const finalize = useFinalizeClassAssignmentRequest();

  const allIds = availableClasses.map((c) => c.id);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;

  const handleToggle = (classId: string) => {
    const next = new Set(selected);
    if (next.has(classId)) next.delete(classId);
    else next.add(classId);
    setSelected(next);
  };

  const handleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const handleDone = () => {
    if (!request) {
      toast.error("No pending request found");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one class");
      return;
    }
    // Map selected classIds to subjectIds for finalize
    const subjectIds = availableClasses.filter((c) => selected.has(c.id)).map((c) => (c as unknown as { subjectId?: string; subject?: { id: string } }).subjectId ?? (c as unknown as { subject?: { id: string } }).subject?.id).filter(Boolean) as string[];
    const uniqueSubjectIds = Array.from(new Set(subjectIds));
    if (uniqueSubjectIds.length === 0) {
      toast.error("Could not resolve subjects for selected classes");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmDone = () => {
    if (!request) return;
    const subjectIds = availableClasses.filter((c) => selected.has(c.id)).map((c) => (c as unknown as { subjectId?: string; subject?: { id: string } }).subjectId ?? (c as unknown as { subject?: { id: string } }).subject?.id).filter(Boolean) as string[];
    const unique = Array.from(new Set(subjectIds));
    finalize.mutate({ id: request.id, subjectIds: unique }, {
      onSuccess: () => {
        toast.success("Selection finalized");
        router.push(`/admin/students/${id}`);
      },
      onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
    });
  };

  if (!activePe) {
    return (
      <div className="space-y-6">
        <PageHeader title={student?.fullName ?? "Review"} breadcrumbs={[{ label: "Admin" }, { label: "Students", href: "/admin/students" }, { label: student?.fullName ?? id }, { label: "Review" }]} />
        <Card className="p-6"><p className="text-sm text-muted-foreground">Student has no active program enrollment to review.</p></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(`/admin/students/${id}`)}>
        <ArrowLeft className="h-4 w-4" /> Back to Student
      </Button>
      <PageHeader title={`Review — ${student?.fullName ?? id}`} breadcrumbs={[{ label: "Admin" }, { label: "Students", href: "/admin/students" }, { label: student?.fullName ?? id, href: `/admin/students/${id}` }, { label: "Review" }]} />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Available classes for {activePe.program?.name} {activePe.section ? `· ${activePe.section.name}` : ""}</h3>
            <p className="text-xs text-muted-foreground mt-1">Select subjects this student can take, or select all. This will be finalized on proceed.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSelectAll} className="gap-1.5">
            {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>

        {frozenWarnings.length > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex gap-3 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Prerequisite warning — frozen at submission</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">This request had unmet prerequisites when submitted. Approving is the override — no separate flag needed.</p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 list-disc ml-4 space-y-0.5">
                {(frozenWarnings as Array<{ subject_name: string; prerequisite_subject_name: string }>).map((w, i) => (
                  <li key={i}>{w.subject_name} requires {w.prerequisite_subject_name} (not yet passed)</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {classesLoading || reqLoading ? (
          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
        ) : !request ? (
          <EmptyState title="No pending review" description="This student is not flagged for review." />
        ) : availableClasses.length === 0 ? (
          <EmptyState icon={BookOpen} title="No classes available" description="No classes found for this student's program/section." />
        ) : (
          <div className="space-y-2">
            {availableClasses.map((cls) => {
              const subjectName = (cls as unknown as { subjectName?: string; subject?: { name: string } }).subjectName ?? (cls as unknown as { subject?: { name: string } }).subject?.name ?? cls.id.slice(0, 8);
              const checked = selected.has(cls.id);
              const hasWarning = !!(cls as unknown as { has_prerequisite_warning?: boolean }).has_prerequisite_warning;
              const warnings = (cls as unknown as { prerequisite_warnings?: Array<{ subject_name: string }> }).prerequisite_warnings ?? [];
              return (
                <label key={cls.id} className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/50"}`}>
                  <div className="flex items-center gap-3 w-full">
                    <Checkbox checked={checked} onCheckedChange={() => handleToggle(cls.id)} />
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium flex-1">{subjectName}</span>
                    {hasWarning && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-amber-300 text-amber-700 bg-amber-50 shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        Prereq
                      </Badge>
                    )}
                  </div>
                  {hasWarning && warnings.length > 0 && (
                    <p className="text-xs text-amber-700 ml-8">Not yet passed: {warnings.map((w) => w.subject_name).join(", ")}</p>
                  )}
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button onClick={handleDone} disabled={selected.size === 0 || finalize.isPending || !request}>Done</Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Finalize selection?"
        message={`You selected ${selected.size} class${selected.size !== 1 ? "es" : ""}. This will mark the student as ready. Proceed?`}
        confirmLabel="Confirm"
        onConfirm={confirmDone}
        isLoading={finalize.isPending}
      />
    </div>
  );
}
