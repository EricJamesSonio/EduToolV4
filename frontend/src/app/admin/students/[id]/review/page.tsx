"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckSquare, Square, BookOpen, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { SchedulePanel } from "@/components/shared/SchedulePanel";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-handling";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { studentApi } from "@/api/admin/student.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { classApi } from "@/api/admin/class.api";
import type { ClassAssignmentRequestItem } from "@/api/admin/class-assignment-request.api";
import { useClassAssignmentRequests, useFinalizeClassAssignmentRequest } from "@/hooks/admin/useClassAssignmentRequest";
import { findClassConflicts, formatClassSlots, toScheduleClasses } from "@/utils/classRequest.utils";
import type { Class } from "@/types/admin/class.types";

// ── Student-requested classes: approve / deny each ───────────────────────────

function RequestedClassesReview({
  studentId,
  request,
}: {
  studentId: string;
  request: ClassAssignmentRequestItem;
}): React.JSX.Element {
  const router = useRouter();
  const finalize = useFinalizeClassAssignmentRequest();
  const requested = useMemo(() => request.requestedClasses ?? [], [request]);
  const [denied, setDenied] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const approved = useMemo(
    () => requested.filter((c) => !denied.has(c.classId)),
    [requested, denied],
  );
  const conflicts = useMemo(() => findClassConflicts(approved), [approved]);
  const scheduleClasses = useMemo(() => toScheduleClasses(approved), [approved]);

  const setDecision = (classId: string, deny: boolean): void => {
    setDenied((prev) => {
      const next = new Set(prev);
      if (deny) next.add(classId);
      else next.delete(classId);
      return next;
    });
  };

  const handleConfirm = (): void => {
    finalize.mutate(
      { id: request.id, approvedClassIds: approved.map((c) => c.classId) },
      {
        onSuccess: () => {
          toast.success("Decisions saved. The student was notified.");
          router.push(`/admin/students/${studentId}`);
        },
        onError: (e: unknown) => {
          setConfirmOpen(false);
          toast.error(getErrorMessage(e));
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold">Requested classes</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Approve or deny each class. Approved classes enroll the student right away.
          </p>
        </div>

        {conflicts.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <p className="font-medium">Overlapping approved classes</p>
            <ul className="list-disc ml-5 text-xs mt-1 space-y-0.5">
              {conflicts.map(([a, b]) => (
                <li key={`${a.classId}-${b.classId}`}>
                  {a.subjectName} and {b.subjectName}. Deny one of them to continue.
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          {requested.map((c) => {
            const isDenied = denied.has(c.classId);
            const full = c.capacity > 0 && c.enrolledCount >= c.capacity;
            return (
              <div
                key={c.classId}
                className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                  isDenied ? "bg-muted/40" : "bg-card"
                }`}
              >
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium">
                    {c.subjectName}
                    {c.levelName && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {c.levelName}
                      </Badge>
                    )}
                    {full && (
                      <Badge variant="outline" className="ml-2 text-[10px] border-amber-300 text-amber-700">
                        Full
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[c.semesterName, c.sectionName, c.educatorName].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatClassSlots(c.schedules)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isDenied ? "outline" : "default"}
                    onClick={() => setDecision(c.classId, false)}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant={isDenied ? "destructive" : "outline"}
                    onClick={() => setDecision(c.classId, true)}
                    className="gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Deny
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={finalize.isPending || conflicts.length > 0}
          >
            Submit decisions
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">Approved schedule</h3>
        <SchedulePanel
          classes={scheduleClasses}
          getSublabel={(cls: Class) =>
            approved.find((c) => c.classId === cls.id)?.educatorName ?? ""
          }
          emptyTitle="Nothing approved"
          emptyDescription="Approved classes will appear here."
          noScheduleTitle="No schedule yet"
          noScheduleDescription="The approved classes don't have schedule times assigned yet."
        />
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit decisions?"
        message={`${approved.length} approved, ${denied.size} denied. Approved classes enroll the student immediately and the student is notified.`}
        confirmLabel="Confirm"
        onConfirm={handleConfirm}
        isLoading={finalize.isPending}
      />
    </div>
  );
}

// ── Admin-flagged (no student picks): choose classes to assign ───────────────

type EligibleClass = {
  id: string;
  subjectName?: string;
  subject?: { name: string };
  has_prerequisite_warning?: boolean;
  prerequisite_warnings?: Array<{ subject_name: string }>;
};

function PickerReview({
  studentId,
  request,
}: {
  studentId: string;
  request: ClassAssignmentRequestItem;
}): React.JSX.Element {
  const router = useRouter();
  const finalize = useFinalizeClassAssignmentRequest();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: schoolYears } = useAsyncQuery(queryKeys.admin.schoolYears.list(), schoolYearApi.getAll);
  const activeSchoolYearId = schoolYears?.find((sy) => sy.status === "active")?.id ?? schoolYears?.[0]?.id ?? null;

  const { data: syeData } = useAsyncQuery(
    queryKeys.admin.studentEnrollment.list({ schoolYearId: activeSchoolYearId }),
    () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId!),
    { enabled: !!activeSchoolYearId },
  );
  const activeSye = syeData?.data?.find((e) => e.student_id === studentId) ?? null;
  const activePe = activeSye?.programEnrollments?.find((pe) => pe.status === "active") ?? activeSye?.programEnrollments?.[0] ?? null;
  const sectionId = activePe?.section?.id ?? null;

  const { data: classesRaw, isLoading } = useAsyncQuery(
    ["admin", "review-classes-eligible", studentId, activeSye?.id, sectionId] as unknown as readonly unknown[],
    () =>
      classApi.getEligibleForStudent(studentId).then((all) => {
        let filtered = all as unknown as Array<Record<string, unknown>>;
        if (activeSchoolYearId) filtered = filtered.filter((c) => (c as unknown as { schoolYearId: string }).schoolYearId === activeSchoolYearId);
        if (sectionId) filtered = filtered.filter((c) => (c as unknown as { sectionId: string | null }).sectionId === sectionId);
        return filtered;
      }),
    { enabled: !!activeSchoolYearId && !!activePe },
  );

  const available = useMemo(
    () => (Array.isArray(classesRaw) ? (classesRaw as unknown as EligibleClass[]) : []),
    [classesRaw],
  );

  const allIds = available.map((c) => c.id);
  const allSelected = allIds.length > 0 && selected.size === allIds.length;
  const frozenWarnings = request.prerequisite_warnings ?? [];

  const toggle = (classId: string): void => {
    const next = new Set(selected);
    if (next.has(classId)) next.delete(classId);
    else next.add(classId);
    setSelected(next);
  };

  const confirm = (): void => {
    finalize.mutate(
      { id: request.id, approvedClassIds: [...selected] },
      {
        onSuccess: () => {
          toast.success("Classes assigned. The student was notified.");
          router.push(`/admin/students/${studentId}`);
        },
        onError: (e: unknown) => {
          setConfirmOpen(false);
          toast.error(getErrorMessage(e));
        },
      },
    );
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">
            Available classes for {activePe?.program?.name} {activePe?.section ? `· ${activePe.section.name}` : ""}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Select the classes this student should take. They are enrolled when you proceed.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelected(allSelected ? new Set() : new Set(allIds))}
          className="gap-1.5"
        >
          {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {frozenWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex gap-3 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <ul className="text-xs text-amber-700 list-disc ml-4 space-y-0.5">
            {frozenWarnings.map((w, i) => (
              <li key={i}>{w.subject_name} requires {w.prerequisite_subject_name} (not yet passed)</li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : available.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes available" description="No classes found for this student's program/section." />
      ) : (
        <div className="space-y-2">
          {available.map((cls) => {
            const checked = selected.has(cls.id);
            const warnings = cls.prerequisite_warnings ?? [];
            return (
              <label key={cls.id} className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${checked ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/50"}`}>
                <div className="flex items-center gap-3 w-full">
                  <Checkbox checked={checked} onCheckedChange={() => toggle(cls.id)} />
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium flex-1">{cls.subjectName ?? cls.subject?.name ?? cls.id.slice(0, 8)}</span>
                  {cls.has_prerequisite_warning && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-amber-300 text-amber-700 bg-amber-50 shrink-0">
                      <AlertTriangle className="h-3 w-3" />
                      Prereq
                    </Badge>
                  )}
                </div>
                {cls.has_prerequisite_warning && warnings.length > 0 && (
                  <p className="text-xs text-amber-700 ml-8">Not yet passed: {warnings.map((w) => w.subject_name).join(", ")}</p>
                )}
              </label>
            );
          })}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={() => setConfirmOpen(true)} disabled={selected.size === 0 || finalize.isPending}>Done</Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Assign selected classes?"
        message={`You selected ${selected.size} class${selected.size !== 1 ? "es" : ""}. The student is enrolled right away and notified.`}
        confirmLabel="Confirm"
        onConfirm={confirm}
        isLoading={finalize.isPending}
      />
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StudentReviewPage({ params }: { params: Promise<{ id: string }> }): React.JSX.Element {
  const { id } = use(params);
  const router = useRouter();

  const { data: student } = useAsyncQuery(queryKeys.admin.students.detail(id), () => studentApi.getOne(id));
  const { data: requestsData, isLoading } = useClassAssignmentRequests({ studentId: id, status: "pending_review" });
  const request = requestsData?.data?.[0];

  const hasRequestedClasses = (request?.requestedClasses?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push(`/admin/students/${id}`)}>
        <ArrowLeft className="h-4 w-4" /> Back to Student
      </Button>
      <PageHeader
        title={`Review — ${student?.fullName ?? id}`}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Students", href: "/admin/students" },
          { label: student?.fullName ?? id, href: `/admin/students/${id}` },
          { label: "Review" },
        ]}
      />

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : !request ? (
        <EmptyState title="No pending review" description="This student has no pending subject request." />
      ) : hasRequestedClasses ? (
        <RequestedClassesReview studentId={id} request={request} />
      ) : (
        <PickerReview studentId={id} request={request} />
      )}
    </div>
  );
}