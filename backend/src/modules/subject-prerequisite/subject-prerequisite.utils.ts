// @/modules/subject-prerequisite/subject-prerequisite.utils.ts

export interface LevelInfo {
  /** Level label, e.g. "1st Year", "Grade 7". */
  level?: string | null;
  /** Department/program identity (type on the backend, name on the frontend). */
  program?: string | null;
}

/**
 * `Level` has no order column, only a name. Level names in this app carry
 * their position as a number ("1st Year", "2nd Year", "Grade 7"), so the
 * first integer in the label is the rank. Returns null when there is no
 * number to compare (the rule is then skipped rather than guessed).
 */
export function parseLevelRank(label?: string | null): number | null {
  if (!label) return null;
  const match = label.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * True when `prerequisite` is NOT strictly lower than `subject`, i.e. the
 * same year or higher, which is not allowed.
 *
 * Skipped (returns false) when either level can't be ranked, and when both
 * subjects belong to different departments (Grade 7 vs. 1st Year college
 * isn't a meaningful comparison).
 */
export function violatesLowerLevelRule(
  prerequisite: LevelInfo,
  subject: LevelInfo,
): boolean {
  const prereqRank = parseLevelRank(prerequisite.level);
  const subjectRank = parseLevelRank(subject.level);
  if (prereqRank === null || subjectRank === null) return false;

  if (
    prerequisite.program &&
    subject.program &&
    prerequisite.program !== subject.program
  ) {
    return false;
  }

  return prereqRank >= subjectRank;
}