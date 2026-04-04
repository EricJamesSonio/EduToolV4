import { daycareSubjects }    from './daycare.subjects'
import { kinderSubjects }     from './kinder.subjects'
import { elementarySubjects } from './elementary.subjects'
import { jhsSubjects }        from './jhs.subjects'
import { shsSubjects }        from './shs.subjects'
import { collegeSubjects }    from './college.subjects'

export type SubjectDef = {
  levelName:   string
  courseCode:  string | null
  strandName:  string | null
  name:        string
  yearLevel:   string
  termLabel:   string
  prereqNames: string[]
}

/** Helper used by every subject file to build a SubjectDef cleanly. */
export function subj(
  levelName:   string,
  courseCode:  string | null,
  strandName:  string | null,
  name:        string,
  yearLevel:   string,
  termLabel:   string,
  prereqNames: string[] = [],
): SubjectDef {
  return { levelName, courseCode, strandName, name, yearLevel, termLabel, prereqNames }
}

export function allSubjects(): SubjectDef[] {
  return [
    ...daycareSubjects(),
    ...kinderSubjects(),
    ...elementarySubjects(),
    ...jhsSubjects(),
    ...shsSubjects(),
    ...collegeSubjects(),
  ]
}

/**
 * Derives the programKey from a level name so the seeder can check
 * whether this subject belongs to a program the admin selected.
 */
export function deriveProgramKey(levelName: string): string {
  if (levelName.startsWith('Daycare'))  return 'daycare'
  if (levelName.startsWith('Kinder'))   return 'kinder'
  if (/^Grade [1-6]($|\s)/.test(levelName)) return 'elementary'
  if (/^Grade (7|8|9|10)($|\s)/.test(levelName)) return 'jhs'
  if (/^Grade (11|12)/.test(levelName)) return 'shs'
  return 'college'
}