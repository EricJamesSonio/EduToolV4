"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpen, Clock, Lock } from "lucide-react";
import { toast } from "sonner";

import { Modal } from "@/components/shared/Modal";
import { SchedulePanel } from "@/components/shared/SchedulePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/error-handling";
import {
  useAvailableClassRequests,
  useSubmitClassRequest,
} from "@/hooks/student/useClassRequest";
import {
  classesConflict,
  formatClassSlots,
  toScheduleClasses,
} from "@/utils/classRequest.utils";
import type { AvailableClass } from "@/api/student/class-request.api";
import type { Class } from "@/types/admin/class.types";

interface Props {
  open: boolean;
  onClose: () => void;
}

function pickDefaultSemester(
  semesters: { id: string; startDate: string; endDate: string }[],
  hasClasses: (id: string) => boolean,
): string {
  if (semesters.length === 0) return "";
  const usable = semesters.filter((s) => hasClasses(s.id));
  const pool = usable.length > 0 ? usable : semesters;
  const now = Date.now();
  const current = pool.find(
    (s) => new Date(s.startDate).getTime() <= now && now <= new Date(s.endDate).getTime(),
  );
  if (current) return current.id;
  const upcoming = pool
    .filter((s) => new Date(s.startDate).getTime() > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
  if (upcoming) return upcoming.id;
  return pool[pool.length - 1].id;
}

function ClassOption({
  cls,
  checked,
  disabledReason,
  onToggle,
}: {
  cls: AvailableClass;
  checked: boolean;
  disabledReason: string | null;
  onToggle: () => void;
}): React.JSX.Element {
  const disabled = !!disabledReason && !checked;
  return (
    <label
      className={`flex flex-col gap-1 rounded-lg border p-3 transition-colors ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-primary/5 border-primary/30" : "bg-card hover:bg-muted/50"}`}
    >
      <div className="flex items-center gap-3 w-full">
        <Checkbox checked={checked} disabled={disabled} onCheckedChange={onToggle} />
        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1">{cls.subjectName}</span>
        {cls.scope === "lower" && (
          <Badge variant="outline" className="text-[10px] shrink-0">
            {cls.levelName ?? "Lower year"}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground ml-11 flex items-center gap-1">
        <Clock className="h-3 w-3 shrink-0" />
        {formatClassSlots(cls.schedules)}
      </p>
      <p className="text-xs text-muted-foreground ml-11">
        {[cls.sectionName, cls.educatorName].filter(Boolean).join(" · ")}
      </p>
      {disabledReason && !checked && (
        <p className="text-xs text-amber-700 ml-11 flex items-center gap-1">
          <Lock className="h-3 w-3 shrink-0" />
          {disabledReason}
        </p>
      )}
    </label>
  );
}

export function RequestSubjectsDialog({ open, onClose }: Props): React.JSX.Element {
  const { data, isLoading } = useAvailableClassRequests(open);
  const submit = useSubmitClassRequest();

  const [semesterId, setSemesterId] = useState("");
  const [showLower, setShowLower] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data || semesterId) return;
    const withClasses = new Set([
      ...data.classes.map((c) => c.semesterId),
      ...data.enrolled.map((c) => c.semesterId),
    ]);
    setSemesterId(pickDefaultSemester(data.semesters, (id) => withClasses.has(id)));
  }, [data, semesterId]);

  const placement = data?.placement ?? null;
  const isIrregular = placement?.isIrregular ?? false;
  const latest = data?.latestRequest ?? null;
  const isPending = latest?.status === "pending_review";

  const inSemester = (c: { semesterId: string }): boolean => c.semesterId === semesterId;

  const enrolledHere = useMemo(
    () => (data?.enrolled ?? []).filter(inSemester),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, semesterId],
  );
  const currentClasses = useMemo(
    () => (data?.classes ?? []).filter((c) => inSemester(c) && c.scope === "current"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, semesterId],
  );
  const lowerClasses = useMemo(
    () =>
      isIrregular && showLower
        ? (data?.classes ?? []).filter((c) => inSemester(c) && c.scope === "lower")
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, semesterId, isIrregular, showLower],
  );
  const selectedClasses = useMemo(
    () => (data?.classes ?? []).filter((c) => selected.has(c.classId)),
    [data, selected],
  );
  const blockedHere = useMemo(
    () => (data?.blocked ?? []).filter((c) => (isIrregular && showLower) || c.scope === "current"),
    [data, isIrregular, showLower],
  );

  const reasonFor = (cls: AvailableClass): string | null => {
    if (cls.isFull) return "This class is full.";
    const sameSubject = selectedClasses.find(
      (s) => s.subjectId === cls.subjectId && s.classId !== cls.classId,
    );
    if (sameSubject) return "You already picked another class for this subject.";
    const blocker = [...enrolledHere, ...selectedClasses].find((b) => classesConflict(cls, b));
    if (blocker) return `Overlaps with ${blocker.subjectName}. Choose one of them.`;
    return null;
  };

  const gridClasses = useMemo(
    () => toScheduleClasses([...enrolledHere, ...currentClasses, ...lowerClasses]),
    [enrolledHere, currentClasses, lowerClasses],
  );

  const sublabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of enrolledHere) map.set(c.classId, "Enrolled");
    for (const c of [...currentClasses, ...lowerClasses]) {
      map.set(
        c.classId,
        selected.has(c.classId)
          ? "Selected"
          : [c.sectionName, c.scope === "lower" ? c.levelName : null]
              .filter(Boolean)
              .join(" · "),
      );
    }
    return map;
  }, [enrolledHere, currentClasses, lowerClasses, selected]);

  const toggle = (classId: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const handleClose = (): void => {
    setSelected(new Set());
    setShowLower(false);
    setSemesterId("");
    onClose();
  };

  const handleSubmit = (): void => {
    if (!placement || selected.size === 0) return;

    const pickedLower = selectedClasses.some((c) => c.scope === "lower");
    const allCurrent = (data?.classes ?? []).filter((c) => c.scope === "current");
    if (!pickedLower && allCurrent.length > 0 && selected.size === allCurrent.length) {
      toast.info(
        "No need for a request. You selected every available subject, which means you have no issue.",
      );
      return;
    }

    submit.mutate(
      {
        studentSchoolYearId: placement.studentSchoolYearId,
        programEnrollmentId: placement.programEnrollmentId,
        origin: "student_request",
        studentRequestedClassIds: [...selected],
      },
      {
        onSuccess: () => {
          toast.success("Request submitted. The admin will review it.");
          handleClose();
        },
        onError: (err: unknown) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const semesterLabel = data?.semesters.find((s) => s.id === semesterId)?.name ?? "Select semester";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      className="w-[92vw] lg:w-[90vw] xl:max-w-6xl h-[88vh] max-h-[90vh] overflow-hidden flex flex-col"
      title="Request Subjects to Take"
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !placement ? (
        <p className="text-sm text-muted-foreground">
          You are not placed in an active school year yet. Please contact the admin.
        </p>
      ) : isPending && latest ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your request is waiting for the admin&apos;s review. You will be notified once it is
            reviewed.
          </div>
          {latest.classes.map((c) => (
            <div key={c.classId} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{c.subjectName}</p>
              <p className="text-xs text-muted-foreground">{formatClassSlots(c.schedules)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6 flex-1 min-h-0">
            <div className="overflow-y-auto md:pr-4 md:border-r space-y-4">
              <p className="text-sm text-muted-foreground">
                {[placement.programName, placement.levelName, placement.sectionName]
                  .filter(Boolean)
                  .join(" · ")}
                {isIrregular && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    Irregular
                  </Badge>
                )}
              </p>

              {latest && latest.status !== "pending_review" && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-1">
                  <p className="font-medium">Last request</p>
                  {latest.classes.map((c) => (
                    <p key={c.classId}>
                      {c.subjectName}:{" "}
                      <span className={c.decision === "approved" ? "text-success" : "text-destructive"}>
                        {c.decision}
                      </span>
                    </p>
                  ))}
                </div>
              )}

              {data && data.semesters.length > 0 && (
                <Select value={semesterId} onValueChange={(v) => setSemesterId(v ?? "")}>
                  <SelectTrigger className="h-9 text-sm">
                    <span className="flex flex-1 truncate text-left">{semesterLabel}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {data.semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {isIrregular && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={showLower}
                    onCheckedChange={(v) => setShowLower(v === true)}
                  />
                  Show lower year level subjects
                </label>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Available subjects
                </h4>
                {currentClasses.length === 0 && lowerClasses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No subjects left to request for this semester.
                  </p>
                ) : (
                  <>
                    {currentClasses.map((c) => (
                      <ClassOption
                        key={c.classId}
                        cls={c}
                        checked={selected.has(c.classId)}
                        disabledReason={reasonFor(c)}
                        onToggle={() => toggle(c.classId)}
                      />
                    ))}
                    {lowerClasses.length > 0 && (
                      <>
                        <h4 className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Lower year levels
                        </h4>
                        {lowerClasses.map((c) => (
                          <ClassOption
                            key={c.classId}
                            cls={c}
                            checked={selected.has(c.classId)}
                            disabledReason={reasonFor(c)}
                            onToggle={() => toggle(c.classId)}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>

              {blockedHere.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Not available yet (prerequisites)
                  </h4>
                  {blockedHere.map((b) => (
                    <div
                      key={b.subjectId}
                      className="rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-sm font-medium">{b.subjectName}</span>
                      </div>
                      <p className="text-xs text-amber-700 mt-1">
                        Not yet passed: {b.missing.map((m) => m.subject_name).join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-y-auto space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Weekly schedule
              </h4>
              <SchedulePanel
                classes={gridClasses}
                getSublabel={(cls: Class) => sublabelById.get(cls.id) ?? ""}
                emptyTitle="Nothing to show"
                emptyDescription="There are no classes to display for this semester."
                noScheduleTitle="No schedule yet"
                noScheduleDescription="These classes don't have schedule times assigned yet."
              />
              <p className="text-[11px] text-muted-foreground">
                Overlapping blocks sit side by side. A class that overlaps something you picked or
                are enrolled in is locked until you unpick the other one.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-2 border-t shrink-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={selected.size === 0 || submit.isPending}
            >
              {submit.isPending ? "Submitting..." : `Submit Request (${selected.size})`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}