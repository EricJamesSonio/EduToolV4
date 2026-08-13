import { useCallback, useEffect, useState } from "react";

export interface SubjectPresetData {
  programId: string;
  courseId: string | null;
  strandId: string | null;
  levelId: string | null;
}

export interface SubjectPreset extends SubjectPresetData {
  enabled: boolean;
}

const STORAGE_PREFIX = "relief-ed:subject-preset:";

function readPreset(schoolYearId: string | null): SubjectPreset | null {
  if (!schoolYearId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + schoolYearId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SubjectPreset;
    if (!parsed || typeof parsed !== "object" || !parsed.programId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePreset(schoolYearId: string, data: SubjectPreset | null): void {
  if (typeof window === "undefined") return;
  const key = STORAGE_PREFIX + schoolYearId;
  if (data === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(data));
  }
}

/**
 * Persists a "New Subject" form preset (department/course/strand/level) in
 * localStorage, namespaced per school year — programs/courses/strands/levels
 * are school-year-scoped entities, so a preset from another school year would
 * reference IDs that don't exist in the current one.
 */
export function useSubjectPreset(schoolYearId: string | null) {
  const [preset, setPresetState] = useState<SubjectPreset | null>(() =>
    readPreset(schoolYearId),
  );

  useEffect(() => {
    setPresetState(readPreset(schoolYearId));
  }, [schoolYearId]);

  const savePreset = useCallback(
    (data: SubjectPresetData) => {
      if (!schoolYearId) return;
      const next: SubjectPreset = { ...data, enabled: true };
      writePreset(schoolYearId, next);
      setPresetState(next);
    },
    [schoolYearId],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (!schoolYearId || !preset) return;
      const next: SubjectPreset = { ...preset, enabled };
      writePreset(schoolYearId, next);
      setPresetState(next);
    },
    [schoolYearId, preset],
  );

  const clearPreset = useCallback(() => {
    if (!schoolYearId) return;
    writePreset(schoolYearId, null);
    setPresetState(null);
  }, [schoolYearId]);

  return { preset, savePreset, setEnabled, clearPreset };
}