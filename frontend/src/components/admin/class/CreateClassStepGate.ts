/**
 * CreateClassStepGate — the ONE place that decides what the New Class form is
 * allowed to do next.
 *
 * Why this file exists
 * The ordering used to be scattered across three components with two real bugs:
 *
 *   1. `ClassSchedulePicker` derived `scheduleReady = !!subjectId && !!educatorId`
 *      — it never checked `sectionId`, so an admin could place time slots for a
 *      class with no section at all.
 *   2. `EditClassDialog` renders that same picker, but its form shape is
 *      `{ educatorId, sectionId, schedules }` — there is no `subjectId` field,
 *      so `watch('subjectId')` was always undefined and `scheduleReady` was
 *      permanently false. Editing a class's schedule was silently broken.
 *
 * The picker no longer reads the form to decide this. It takes a
 * `selectionGate` prop, and each dialog supplies its own rule. That removes the
 * coupling that caused both bugs and makes the rule testable without rendering.
 *
 * The order is intentionally strict — Department -> Semester -> Course/Strand
 * -> Level -> Section -> Subject -> Educator -> Schedule — because every
 * later choice is a filter of the earlier ones. The admin cannot pick an
 * educator before knowing the subject, so the educator list cannot be narrowed
 * by teachability, and cannot pick a time before the educator, which is the
 * only input to the conflict check.
 */

/** The ordered picks that gate the schedule grid, in selection order. */
export const CREATE_CLASS_PICK_ORDER = [
  'programId',
  'semesterId',
  'trackId',
  'levelId',
  'sectionId',
  'subjectId',
  'educatorId',
] as const;

export type CreateClassPick = (typeof CREATE_CLASS_PICK_ORDER)[number];

export type CreateClassValues = {
  programId?: string;
  semesterId?: string;
  /** Course or strand. Optional: departments without tracks skip this step. */
  trackId?: string;
  levelId?: string;
  sectionId?: string;
  subjectId?: string;
  educatorId?: string;
};

/** Human label for a pick, used in the "do X first" hints. */
export const PICK_LABELS: Record<CreateClassPick, string> = {
  programId: 'department',
  semesterId: 'semester',
  trackId: 'course',
  levelId: 'level',
  sectionId: 'section',
  subjectId: 'subject',
  educatorId: 'educator',
};

/**
 * Which picks are still missing, in the order they must be chosen.
 * `trackId` is only counted when the department actually has tracks, so a
 * track-less department never shows a false "select a course first".
 */
export function missingPicks(
  values: CreateClassValues,
  opts: { hasTrack: boolean },
): CreateClassPick[] {
  const missing: CreateClassPick[] = [];
  for (const pick of CREATE_CLASS_PICK_ORDER) {
    if (pick === 'trackId' && !opts.hasTrack) continue;
    if (!values[pick]) missing.push(pick);
  }
  return missing;
}

/** "a section, a subject and an educator" — for the schedule hint. */
export function describeMissing(picks: CreateClassPick[]): string {
  if (picks.length === 0) return '';
  const labels = picks.map((p) => PICK_LABELS[p]);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/**
 * The gate the schedule grid is opened with.
 *
 * `ready` is false until every pick in `required` is set. The picker uses this
 * to block interaction; `missing` drives the "select X first" hint so the admin
 * always knows exactly what is holding them up.
 */
export interface SelectionGate {
  ready: boolean;
  /** Still-unset picks among `required`, in selection order. */
  missing: CreateClassPick[];
  /** "Select a section, a subject and an educator first." */
  hint: string;
}

/**
 * Build the gate for a given set of required picks.
 *
 * Create requires all seven. Edit passes `['educatorId']` because a class's
 * subject is immutable on that screen — which is precisely why Edit must not
 * reuse Create's rule.
 */
export function buildSelectionGate(
  values: CreateClassValues,
  required: readonly CreateClassPick[],
  opts: { hasTrack: boolean } = { hasTrack: false },
): SelectionGate {
  const missing = required.filter(
    (pick) => !(pick === 'trackId' && !opts.hasTrack) && !values[pick],
  );
  const label = describeMissing(missing);
  return {
    ready: missing.length === 0,
    missing: missing as CreateClassPick[],
    hint: label ? `Select ${label} first.` : '',
  };
}

/**
 * The create-flow gate, additionally refusing to open when the selected
 * section already has a class for the chosen subject. Re-implementing that
 * check here would let the two drift, so the picker is told about it instead.
 */
export function buildCreateSelectionGate(
  values: CreateClassValues,
  opts: { hasTrack: boolean; subjectAlreadyHasClass: boolean },
): SelectionGate {
  const base = buildSelectionGate(values, CREATE_CLASS_PICK_ORDER, opts);
  if (!base.ready || !opts.subjectAlreadyHasClass) return base;
  return {
    ready: false,
    missing: ['subjectId'],
    hint: 'This section already has a class for this subject. Edit it to add slots.',
  };
}