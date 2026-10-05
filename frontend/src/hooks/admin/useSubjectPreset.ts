import { useCallback, useEffect, useState } from "react";

export interface SubjectPresetData {
  programId: string;
  courseId: string | null;
  strandId: string | null;
  levelId: string | null;
  /** null / undefined = follow the department standard. */
  sessionsPerWeek?: number | null;
  /** Uniform length, kept for presets saved before per-session times existed. */
  sessionMinutes?: number | null;
  /**
   * Per-session lengths. Empty / undefined = uniform.
   *
   * Carried so a preset with mixed lengths does not silently collapse to one
   * length on the next "Set Preset" — every subject created from it would
   * otherwise get a different shape than the admin configured.
   */
  sessionDurations?: number[] | null;
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
    // Presets saved before weekly sessions existed fall back to the standard.
    return {
      ...parsed,
      sessionsPerWeek: parsed.sessionsPerWeek ?? null,
      sessionMinutes: parsed.sessionMinutes ?? null,
      // Presets saved before per-session times are uniform by definition.
      sessionDurations: Array.isArray(parsed.sessionDurations)
        ? parsed.sessionDurations
        : [],
    };
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
 * Persists a "New Subject" form preset (department/course/strand/level and
 * weekly sessions) in localStorage, namespaced per school year —
 * programs/courses/strands/levels are school-year-scoped entities, so a preset
 * from another school year would reference IDs that don't exist in the
 * current one.
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