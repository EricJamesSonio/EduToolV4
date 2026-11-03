/**
 * Global teachable-subject keys.
 *
 * "Subject X can be taught by educator E" is GLOBAL: it applies to every
 * school year automatically. Subjects (and sections) are recreated per year,
 * so ids never carry over — this normalized key is the stable identity that
 * links an educator to a subject across years:
 *
 *   normalized(name) | programType | levelName | courseName | strandName
 *
 * Level name is included deliberately: the same subject name exists at many
 * levels, and matching on name alone would attach the wrong one. Extracted
 * here so the eligibility table, the yearly read model, the bundle write
 * path, and orphan pruning all compute byte-identical keys. The SQL backfill
 * in the global-teachables migration mirrors `norm` with
 * `LOWER(regexp_replace(x, '^\s+|\s+$', '', 'g'))`.
 */

export interface SubjectKeyParts {
  name: string;
  programType: string | null;
  levelName: string | null;
  courseName: string | null;
  strandName: string | null;
}

/** Case/whitespace-insensitive comparison key. */
export const normSubjectKeyPart = (s: string): string => s.trim().toLowerCase();

export function buildSubjectKey(s: SubjectKeyParts): string {
  return [
    normSubjectKeyPart(s.name),
    normSubjectKeyPart(s.programType ?? ''),
    normSubjectKeyPart(s.levelName ?? ''),
    normSubjectKeyPart(s.courseName ?? ''),
    normSubjectKeyPart(s.strandName ?? ''),
  ].join('|');
}
