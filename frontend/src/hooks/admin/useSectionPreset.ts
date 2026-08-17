import { useCallback, useEffect, useState } from "react";

export interface SectionPresetData {
  programId: string;
  courseId: string | null;
  strandId: string | null;
  levelId: string | null;
}

export interface SectionPreset extends SectionPresetData {
  enabled: boolean;
}

const STORAGE_PREFIX = "relief-ed:section-preset:";

function readPreset(schoolYearId: string | null): SectionPreset | null {
  if (!schoolYearId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + schoolYearId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SectionPreset;
    if (!parsed || typeof parsed !== "object" || !parsed.programId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePreset(schoolYearId: string, data: SectionPreset | null): void {
  if (typeof window === "undefined") return;
  const key = STORAGE_PREFIX + schoolYearId;
  if (data === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(data));
  }
}

/**
 * Persists a "New Section" form preset (department/course-or-strand/level) in
 * localStorage, namespaced per school year — programs/courses/strands/levels
 * are school-year-scoped entities, so a preset from another school year would
 * reference IDs that don't exist in the current one.
 */
export function useSectionPreset(schoolYearId: string | null) {
  const [preset, setPresetState] = useState<SectionPreset | null>(() =>
    readPreset(schoolYearId),
  );

  useEffect(() => {
    setPresetState(readPreset(schoolYearId));
  }, [schoolYearId]);

  const savePreset = useCallback(
    (data: SectionPresetData) => {
      if (!schoolYearId) return;
      const next: SectionPreset = { ...data, enabled: true };
      writePreset(schoolYearId, next);
      setPresetState(next);
    },
    [schoolYearId],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (!schoolYearId || !preset) return;
      const next: SectionPreset = { ...preset, enabled };
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