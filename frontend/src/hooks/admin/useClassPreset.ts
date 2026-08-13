import { useCallback, useEffect, useState } from "react";

export interface ClassPresetData {
  programId: string;
  semesterId: string;
  trackId: string;
  levelId: string;
  sectionId: string;
}

export interface ClassPreset extends ClassPresetData {
  enabled: boolean;
}

const STORAGE_PREFIX = "relief-ed:class-preset:";

function readPreset(schoolYearId: string | null): ClassPreset | null {
  if (!schoolYearId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + schoolYearId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClassPreset;
    if (!parsed || typeof parsed !== "object" || !parsed.programId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePreset(schoolYearId: string, data: ClassPreset | null): void {
  if (typeof window === "undefined") return;
  const key = STORAGE_PREFIX + schoolYearId;
  if (data === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(data));
  }
}

/**
 * Persists a "New Class" form preset (department/semester/course-or-strand/
 * level/section) in localStorage, namespaced per school year — these are all
 * school-year-scoped entities, so a preset from a different school year would
 * reference IDs that don't exist in the current one.
 *
 * Deliberately does NOT cover educator or schedule — those change per class.
 */
export function useClassPreset(schoolYearId: string | null) {
  const [preset, setPresetState] = useState<ClassPreset | null>(() =>
    readPreset(schoolYearId),
  );

  useEffect(() => {
    setPresetState(readPreset(schoolYearId));
  }, [schoolYearId]);

  const savePreset = useCallback(
    (data: ClassPresetData) => {
      if (!schoolYearId) return;
      const next: ClassPreset = { ...data, enabled: true };
      writePreset(schoolYearId, next);
      setPresetState(next);
    },
    [schoolYearId],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (!schoolYearId || !preset) return;
      const next: ClassPreset = { ...preset, enabled };
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