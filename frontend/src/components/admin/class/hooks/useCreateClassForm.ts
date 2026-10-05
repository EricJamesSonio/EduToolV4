import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { classApi } from "@/api/admin/class.api";
import type { CreateClassRequest, ScheduleSlot } from "@/api/admin/class.api";

import type { ScheduleConflictState } from "../ClassSchedulePicker";
import {
  EMPTY_DEFAULTS,
  type CreateClassDialogProps,
  type CreateClassForm,
} from "../CreateClassDialog.types";
import { clearClassDraft, loadClassDraft, saveClassDraft } from "./useClassDraft";
import { useCreateClassData } from "./useCreateClassData";
import { buildCreateSelectionGate } from "../CreateClassStepGate";

const NO_CONFLICTS: ScheduleConflictState = { educator: false, section: false, room: false };

export type CreateClassData = ReturnType<typeof useCreateClassData>;

type UseCreateClassFormParams = Pick <
  CreateClassDialogProps,
  | "open"
  | "onClose"
  | "schoolYearId"
  | "defaultSubjectId"
  | "defaultProgramId"
  | "defaultSemesterId"
  | "defaultTrackId"
  | "defaultLevelId"
  | "defaultSectionId"
>;

function isBlankDraft(v: Partial<CreateClassForm>): boolean {
  return (
    !v.programId &&
    !v.semesterId &&
    !v.trackId &&
    !v.levelId &&
    !v.sectionId &&
    !v.subjectId &&
    !v.educatorId &&
    !(v.schedules && v.schedules.length > 0)
  );
}

/** Runs `handler` only when `value` actually changes after mount (StrictMode-safe). */
function useOnChange<T>(value: T, handler: () => void): void {
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    handler();
  }, [value, handler]);
}

export function useCreateClassForm({
  open,
  onClose,
  schoolYearId,
  defaultSubjectId,
  defaultProgramId,
  defaultSemesterId,
  defaultTrackId,
  defaultLevelId,
  defaultSectionId,
}: UseCreateClassFormParams) {
  // ── Initial state: preset wins over draft; draft wins over empty ──────────
  const [initial] = useState(() => {
    const raw = loadClassDraft();
    const presetActive = !!defaultProgramId;
    const hasDraft = !presetActive && !!raw && Object.keys(raw).length > 0;
    return { presetActive, hasDraft, draft: presetActive ? null : raw };
  });
  const { presetActive, hasDraft, draft } = initial;

  const methods = useForm<CreateClassForm>({
    defaultValues: {
      ...EMPTY_DEFAULTS,
      ...(!hasDraft
        ? {
            programId: defaultProgramId ?? EMPTY_DEFAULTS.programId,
            semesterId: defaultSemesterId ?? EMPTY_DEFAULTS.semesterId,
            trackId: defaultTrackId ?? EMPTY_DEFAULTS.trackId,
            levelId: defaultLevelId ?? EMPTY_DEFAULTS.levelId,
            sectionId: defaultSectionId ?? EMPTY_DEFAULTS.sectionId,
          }
        : {}),
      ...draft,
      subjectId: defaultSubjectId ?? draft?.subjectId ?? "",
    },
  });
  const { handleSubmit, reset, setValue, watch } = methods;

  // ── Draft autosave (skips blank forms so discard/reset never re-creates a draft)
  useEffect(() => {
    const sub = watch((values) => {
      const next = values as Partial<CreateClassForm>;
      if (isBlankDraft(next)) return;
      saveClassDraft(next);
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const values = watch();
  const {
    programId,
    semesterId,
    trackId,
    levelId,
    sectionId,
    subjectId,
    educatorId,
    schedules,
  } = values;

  // ── Department selection intent ───────────────────────────────────────────
  //
  // A restored draft (or a preset) can populate programId without the admin
  // having chosen a department in THIS session. Every downstream validation
  // (semester template, semester list, subject list) used to key off the raw
  // `programId` value, so opening the dialog with a stale draft immediately
  // evaluated "does this department have a semester template?" and could show
  // the "No template assigned" warning before the admin had touched anything.
  //
  // `programChosenByUser` is the fix: validation only runs once the admin
  // actually picks a department. It starts true when a preset supplied one
  // (that IS an explicit, deliberate choice by whatever opened the dialog).
  const [programChosenByUser, setProgramChosenByUser] = useState(presetActive);
  const handleProgramChange = useCallback(
    (next: string) => {
      setProgramChosenByUser(!!next);
      setValue("programId", next);
    },
    [setValue],
  );

  // ── Data ──────────────────────────────────────────────────────────────────
  const data = useCreateClassData({
    schoolYearId,
    selectedProgramId: programId,
    // Only a department the admin actually picked is validated. Without this,
    // a restored draft triggered the semester-template check on open.
    programChosenByUser,
    selectedSemesterId: semesterId,
    selectedTrackId: trackId,
    selectedLevelId: levelId,
    selectedSectionId: sectionId,
    selectedEducatorId: educatorId,
    isEnabled: open,
  });

  // ── Cascade resets ────────────────────────────────────────────────────────
  useOnChange(
    programId,
    useCallback(() => {
      setValue("semesterId", "");
      setValue("trackId", "");
      setValue("levelId", "");
      setValue("sectionId", "");
      setValue("subjectId", "");
    }, [setValue]),
  );
  useOnChange(
    trackId,
    useCallback(() => {
      setValue("levelId", "");
      setValue("sectionId", "");
      setValue("subjectId", "");
    }, [setValue]),
  );
  useOnChange(
    levelId,
    useCallback(() => {
      setValue("sectionId", "");
      setValue("subjectId", "");
    }, [setValue]),
  );
  useOnChange(
    sectionId,
    useCallback(() => {
      setValue("subjectId", "");
    }, [setValue]),
  );

  // ── One class per subject, per section, per semester ──────────────────────
  // Extra meeting times are added as slots on that class, not a second class.
  const takenSubjectIds = useMemo(() => {
    const ids = new Set<string>();
    if (!sectionId || !semesterId) return ids;
    for (const c of data.sectionClasses ?? []) {
      if (c.semesterId === semesterId) ids.add(c.subjectId);
    }
    return ids;
  }, [data.sectionClasses, sectionId, semesterId]);

  const subjectAlreadyHasClass = !!subjectId && takenSubjectIds.has(subjectId);

  // ── Schedule conflict gating ──────────────────────────────────────────────
  const [scheduleConflicts, setScheduleConflicts] =
    useState<ScheduleConflictState>(NO_CONFLICTS);
  const handleScheduleConflictsChange = useCallback(
    (conflicts: ScheduleConflictState) => setScheduleConflicts(conflicts),
    [],
  );
  useEffect(() => {
    if (open) setScheduleConflicts(NO_CONFLICTS);
  }, [open]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const mutation = useMutationWithInvalidation(
    (form: CreateClassForm) => {
      const payload: CreateClassRequest = {
        subjectId: form.subjectId,
        educatorId: form.educatorId,
        sectionId: form.sectionId || undefined,
        schoolYearId: schoolYearId!,
        semesterId: form.semesterId || undefined,
        schedules: form.schedules.map((s) => ({
          weekday: Number(s.weekday),
          startTime: s.startTime,
          endTime: s.endTime,
          // Empty string means "no room" — send nothing so the backend stores null.
          roomId: s.roomId || undefined,
        })) as ScheduleSlot[],
      };
      return classApi.create(payload);
    },
    {
      invalidateKeys: [queryKeys.admin.classes.all, adminQueryKeys.rooms.all],
      onSuccess: () => {
        toast.success("Class created.");
        clearClassDraft();
        reset(EMPTY_DEFAULTS);
        onClose();
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to create class.");
      },
    },
  );

  const handleDiscard = useCallback((): void => {
    clearClassDraft();
    reset(EMPTY_DEFAULTS);
    onClose();
  }, [reset, onClose]);

  // The single gate for the schedule grid. The dialog passes this straight to
  // ScheduleSlotFields, so the "may I place a slot?" rule is defined exactly
  // once instead of being re-derived inside the picker.
  const selectionGate = useMemo(
    () =>
      buildCreateSelectionGate(
        {
          programId,
          semesterId,
          trackId,
          levelId,
          sectionId,
          subjectId,
          educatorId,
        },
        { hasTrack: data.hasTrack, subjectAlreadyHasClass },
      ),
    [
      programId,
      semesterId,
      trackId,
      levelId,
      sectionId,
      subjectId,
      educatorId,
      data.hasTrack,
      subjectAlreadyHasClass,
    ],
  );

  const isSubmitDisabled =
    mutation.isPending ||
    scheduleConflicts.educator ||
    scheduleConflicts.section ||
    scheduleConflicts.room ||
    // One rule for both: the gate already encodes every pick plus the
    // duplicate-subject block, so these can't drift apart.
    !selectionGate.ready ||
    data.programMissingTemplate ||
    schedules.length === 0;

  return {
    methods,
    values,
    data,
    hasDraft,
    presetActive,
    programChosenByUser,
    handleProgramChange,
    takenSubjectIds,
    subjectAlreadyHasClass,
    selectionGate,
    isSubmitting: mutation.isPending,
    isSubmitDisabled,
    onSubmit: handleSubmit((form) => mutation.mutate(form)),
    handleDiscard,
    handleScheduleConflictsChange,
  };
}