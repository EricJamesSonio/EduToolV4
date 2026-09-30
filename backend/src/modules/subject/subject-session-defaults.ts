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
  sessionMinutes: number;
  /** Where the numbers came from: the subject row, or the program-type default. */
  source: 'explicit' | 'default';
}

/**
 * Defaults per program type. These are starting values, not hard rules — an
 * admin overrides them per subject, which flips `source` to 'explicit'.
 */
export const SUBJECT_SESSION_DEFAULTS: Record<string, Omit<SessionRequirement, 'source'>> = {
  daycare: { sessionsPerWeek: 5, sessionMinutes: 30 },
  kinder: { sessionsPerWeek: 5, sessionMinutes: 45 },
  elementary: { sessionsPerWeek: 5, sessionMinutes: 60 },
  jhs: { sessionsPerWeek: 5, sessionMinutes: 60 },
  shs: { sessionsPerWeek: 5, sessionMinutes: 60 },
  college: { sessionsPerWeek: 2, sessionMinutes: 90 },
};

/** Fallback for a program type with no entry above (e.g. a custom type). */
const FALLBACK: Omit<SessionRequirement, 'source'> = {
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
 * Resolves the effective weekly requirement for a subject.
 *
 * Each field falls back independently, so a subject that sets only the count
 * still gets a sensible length.
 */
export function resolveSessionRequirement(
  subject: {
    sessionsPerWeek?: number | null;
    sessionMinutes?: number | null;
  },
  programType: string | null | undefined,
  slotMinutes: number,
): SessionRequirement {
  const fallback = SUBJECT_SESSION_DEFAULTS[programType ?? ''] ?? FALLBACK;

  const explicitCount = subject.sessionsPerWeek ?? null;
  const explicitMinutes = subject.sessionMinutes ?? null;

  const sessionsPerWeek = explicitCount ?? fallback.sessionsPerWeek;
  const sessionMinutes =
    explicitMinutes ?? roundUpToSlot(fallback.sessionMinutes, slotMinutes);

  return {
    sessionsPerWeek,
    sessionMinutes,
    source: explicitCount != null || explicitMinutes != null ? 'explicit' : 'default',
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
