// frontend/src/utils/level-rank.ts
// Mirrors backend/src/modules/subject-prerequisite/subject-prerequisite.utils.ts
// — keep the two in sync. The backend is the source of truth; this only
// keeps the "Select prerequisite" dropdown from offering invalid choices.

export interface LevelInfo {
  /** Level label, e.g. "1st Year", "Grade 7". */
  level?: string | null;
  /** Department name, used to avoid comparing across departments. */
  program?: string | null;
}

/** First integer in the level label ("2nd Year" → 2, "Grade 10" → 10). */
export function parseLevelRank(label?: string | null): number | null {
  if (!label) return null;
  const match = label.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * True when `prerequisite` is the same year or higher than `subject`.
 * Not enforced when a level can't be ranked or the departments differ.
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