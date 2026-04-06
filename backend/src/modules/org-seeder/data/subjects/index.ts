import { daycareSubjects }    from './daycare.subjects'
import { kinderSubjects }     from './kinder.subjects'
import { elementarySubjects } from './elementary.subjects'
import { jhsSubjects }        from './jhs.subjects'
import { shsSubjects }        from './shs.subjects'
import { collegeMajorSubjects, collegeMinorSubjects } from './college.subjects'

export type SubjectDef = {
  levelName:   string
  courseCode:  string | null
  strandName:  string | null
  name:        string
  yearLevel:   string
  termLabel:   string
  prereqNames: string[]
  isMinor:     boolean   // ← new: true = subject_type 'minor'
}

export function subj(
  levelName:   string,
  courseCode:  string | null,
  strandName:  string | null,
  name:        string,
  yearLevel:   string,
  termLabel:   string,
  prereqNames: string[] = [],
  isMinor      = false,           // ← new param, defaults to false
): SubjectDef {
  return { levelName, courseCode, strandName, name, yearLevel, termLabel, prereqNames, isMinor }
}

/** All subjects that should be seeded as major subjects */
export function allMajorSubjects(): SubjectDef[] {
  return [
    ...daycareSubjects(),
    ...kinderSubjects(),
    ...elementarySubjects(),
    ...jhsSubjects(),
    ...shsSubjects(),          // SHS majors only (minors filtered inside)
    ...collegeMajorSubjects(), // per-course major subjects
  ]
}

/**
 * Minor subjects that are seeded once per program and then shared to
 * courses/strands via SubjectSharing.
 *
 * Currently:
 *   - SHS core/minor subjects (shared across all strands)
 *   - College GE subjects (shared across all courses)
 */
export function allMinorSubjects(): SubjectDef[] {
  return [
    ...collegeMinorSubjects(), // GE subjects — seeded once for college program
  ]
}

/**
 * All subjects combined — kept for backwards-compat callers that don't
 * need the major/minor split (e.g. prerequisite seeding).
 */
export function allSubjects(): SubjectDef[] {
  return [...allMajorSubjects(), ...allMinorSubjects()]
}

export function deriveProgramKey(levelName: string): string {
  if (levelName.startsWith('Daycare'))                   return 'daycare'
  if (levelName.startsWith('Kinder'))                    return 'kinder'
  if (/^Grade [1-6]($|\s)/.test(levelName))              return 'elementary'
  if (/^Grade (7|8|9|10)($|\s)/.test(levelName))         return 'jhs'
  if (/^Grade (11|12)/.test(levelName))                  return 'shs'
  // College GE minor subjects use a synthetic levelName of 'college_ge'
  if (levelName === 'college_ge')                        return 'college'
  return 'college'
}