/**
 * Per-subject weekly session requirements.
 *
 * A subject may declare `sessionsPerWeek` / `sessionMinutes` explicitly. When
 * it does not, a per-program-type default applies. This module is the ONLY
 * place that resolution happens, so the generator, the readiness report and the
 * UI can never disagree about how many slots a subject needs.
 *
 * Pure and dependency-free on purpose: the service passes the org's slot
 * length in rather than reaching for OrgScheduleConfigService, which keeps the
 * subject -> org-schedule-config dependency one-directional.
 */

export interface SessionRequirement {
  sessionsPerWeek: number;
  /**
   * The uniform session length, resolved exactly as it always has been.
   *
   * For a uniform subject this is the length of every session. For a subject
   * with per-position lengths it is still the resolved BASE (the explicit
   * `sessionMinutes`, else the program-type default) — `durations` is the
   * authoritative per-position list and `sessionMinutes` must not be mistaken
   * for a summary of it.
   */
  sessionMinutes: number;
  /**
   * Length of every weekly session, position by position.
   *
   * ALWAYS exactly `sessionsPerWeek` long, so a caller can index it with the
   * slot position it is placing without a bounds check.
   */
  durations: number[];
  /** Where the numbers came from: the subject row, or the program-type default. */
  source: 'explicit' | 'default';
}

/**
 * Defaults per program type. These are starting values, not hard rules — an
 * admin overrides them per subject, which flips `source` to 'explicit'.
 *
 * Deliberately typed WITHOUT `durations`: a standard is by definition
 * uniform, and per-position lengths are derived from it by the resolver
 * rather than restated here.
 */
export const SUBJECT_SESSION_DEFAULTS: Record<
  string,
  Omit<SessionRequirement, 'source' | 'durations'>
> = {
  daycare: { sessionsPerWeek: 5, sessionMinutes: 60 },
  kinder: { sessionsPerWeek: 5, sessionMinutes: 60 },
  elementary: { sessionsPerWeek: 5, sessionMinutes: 60 },
  jhs: { sessionsPerWeek: 5, sessionMinutes: 120 },
  shs: { sessionsPerWeek: 5, sessionMinutes: 120 },
  college: { sessionsPerWeek: 1, sessionMinutes: 180 },
};

/** Fallback for a program type with no entry above (e.g. a custom type). */
const FALLBACK: Omit<SessionRequirement, 'source' | 'durations'> = {
  sessionsPerWeek: 5,
  sessionMinutes: 60,
};

/**
 * Rounds up to the next whole multiple of `slotMinutes`.
 *
 * Applied ONLY to defaults. An explicit value is already validated as a
 * multiple on save, so rounding it here would silently hide a bad row instead
 * of surfacing it.
 */
export function roundUpToSlot(minutes: number, slotMinutes: number): number {
  if (slotMinutes <= 0) return minutes;
  return Math.ceil(minutes / slotMinutes) * slotMinutes;
}

/**
 * Expands a subject's stored per-session lengths into the full position list.
 *
 * An empty `sessionDurations` means "uniform" and expands to `count` copies of
 * the resolved base length. That is what every pre-existing subject stores, so
 * their output is identical to the pre-per-session behaviour.
 *
 * A stored list is honoured only when it is exactly `count` long. A wrong
 * length is a corrupt row (the service rejects it on save); falling back to
 * uniform there is safer than truncating or padding, because a silently
 * reshaped schedule would place classes at times nobody configured.
 */
function expandDurations(
  stored: readonly number[] | null | undefined,
  count: number,
  base: number,
): number[] {
  if (stored && stored.length > 0 && stored.length === count) {
    return [...stored];
  }
  return Array.from({ length: count }, () => base);
}

/**
 * Resolves the effective weekly requirement for a subject.
 *
 * Each field falls back independently, so a subject that sets only the count
 * still gets a sensible length.
 *
 * Per-position lengths are honoured ONLY for an explicit requirement. On the
 * program-type default the department standard wins outright: a stale stored
 * array must never quietly override the standard the subject is following.
 */
export function resolveSessionRequirement(
  subject: {
    sessionsPerWeek?: number | null;
    sessionMinutes?: number | null;
    /** Per-position lengths; empty/undefined = uniform. */
    sessionDurations?: readonly number[] | null;
  },
  programType: string | null | undefined,
  slotMinutes: number,
): SessionRequirement {
  const fallback = SUBJECT_SESSION_DEFAULTS[programType ?? ''] ?? FALLBACK;

  const explicitCount = subject.sessionsPerWeek ?? null;
  const explicitMinutes = subject.sessionMinutes ?? null;
  const explicitDurations = subject.sessionDurations ?? null;

  const sessionsPerWeek = explicitCount ?? fallback.sessionsPerWeek;
  const sessionMinutes =
    explicitMinutes ?? roundUpToSlot(fallback.sessionMinutes, slotMinutes);

  const source: SessionRequirement['source'] =
    explicitCount != null ||
    explicitMinutes != null ||
    (explicitDurations?.length ?? 0) > 0
      ? 'explicit'
      : 'default';

  const durations =
    source === 'explicit'
      ? expandDurations(explicitDurations, sessionsPerWeek, sessionMinutes)
      : Array.from({ length: sessionsPerWeek }, () => sessionMinutes);

  return {
    sessionsPerWeek,
    sessionMinutes,
    durations,
    source,
  };
}

/** Valid slot lengths, mirroring the org schedule config DTO. */
export const SLOT_MINUTE_OPTIONS = [15, 20, 25, 30, 45, 60] as const;

/** The valid session lengths for a given slot: every slot up to 3 hours. */
export function sessionMinutesOptions(slotMinutes: number): number[] {
  if (slotMinutes <= 0) return [...SLOT_MINUTE_OPTIONS];
  const out: number[] = [];
  for (let m = slotMinutes; m <= 180; m += slotMinutes) out.push(m);
  return out;
}
