import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { v4 as uuid, v5 as uuidv5 } from 'uuid'
import { PROGRAMS }                      from './data/programs.data'
import { COLLEGE_COURSES, BSED_MAJORS }  from './data/courses.data'
import { SHS_STRAND_DEFS }               from './data/strands.data'
import { buildLevelDefs }                from './data/levels.data'
import { buildScaleAssignments }         from './data/grading-scale.data'
import { SCHEME_PRESETS }                from './data/grading-schemes.data'
import { allSubjects, deriveProgramKey } from './data/subjects'

const SEED_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'

function seedId(...parts: string[]): string {
  return uuidv5(parts.join(':'), SEED_NAMESPACE)
}

export interface OrgSeedOptions {
  orgId:             string
  schoolYearId:      string
  programs:          string[]
  courses?:          string[]
  strands?:          string[]
  excludedLevels?:   string[]
  excludedSubjects?: string[]
}

@Injectable()
export class OrgSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seedOrg(options: OrgSeedOptions): Promise<void> {
    const {
      orgId,
      schoolYearId,
      programs,
      courses          = [],
      strands          = [],
      excludedLevels   = [],
      excludedSubjects = [],
    } = options

    const selectedPrograms  = new Set(programs)
    const selectedCourses   = new Set(courses)
    const selectedStrands   = new Set(strands)
    const excludedLevelSet  = new Set(excludedLevels)
    const excludedSubjSet   = new Set(excludedSubjects)

    const shouldSeedProgram = (key: string)  => selectedPrograms.has(key)
    const shouldSeedCourse  = (code: string) => courses.length === 0 || selectedCourses.has(code)
    const shouldSeedStrand  = (name: string) => strands.length === 0 || selectedStrands.has(name)
    const shouldSeedLevel   = (name: string) => !excludedLevelSet.has(name)
    const shouldSeedSubject = (name: string) => !excludedSubjSet.has(name)

    const programMap:      Record<string, string> = {}
    const courseMap:       Record<string, string> = {}
    const strandMap:       Record<string, string> = {}
    const levelMap:        Record<string, string> = {}
    const subjectNameToId: Record<string, string> = {}

    await this.seedPrograms(orgId, schoolYearId, shouldSeedProgram, programMap)
    await this.seedCourses(orgId, schoolYearId, shouldSeedProgram, shouldSeedCourse, programMap, courseMap)
    await this.seedStrands(orgId, schoolYearId, shouldSeedProgram, shouldSeedStrand, programMap, strandMap)
    await this.seedLevelsAndSections(orgId, schoolYearId, shouldSeedProgram, shouldSeedLevel, programMap, levelMap)
    await this.seedGradingScales(orgId, schoolYearId, shouldSeedProgram, levelMap)
    await this.seedGradingSchemes(orgId, schoolYearId, shouldSeedProgram)
    await this.seedSubjects(orgId, shouldSeedProgram, shouldSeedSubject, levelMap, courseMap, strandMap, subjectNameToId)
    await this.seedPrerequisites(orgId, shouldSeedProgram, levelMap, subjectNameToId)
  }

  private async seedPrograms(
    orgId:        string,
    schoolYearId: string,
    shouldSeed:   (k: string) => boolean,
    programMap:   Record<string, string>,
  ) {
    for (const p of PROGRAMS) {
      if (!shouldSeed(p.key)) continue
      const id = seedId('prog', p.key, schoolYearId, orgId)
      const rec = await this.db.program.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          org_id:         orgId,
          school_year_id: schoolYearId,
          name:           p.name,
          type:           p.type,
        },
      })
      programMap[p.key] = rec.id
    }
  }

  private async seedCourses(
    orgId:        string,
    schoolYearId: string,
    shouldSeedP:  (k: string) => boolean,
    shouldSeedC:  (code: string) => boolean,
    programMap:   Record<string, string>,
    courseMap:    Record<string, string>,
  ) {
    if (!shouldSeedP('college') || !programMap['college']) return

    for (const c of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
      if (!shouldSeedC(c.code)) continue
      const id = seedId('course', c.code, schoolYearId, orgId)
      const rec = await this.db.course.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          org_id:         orgId,
          school_year_id: schoolYearId,
          program_id:     programMap['college'],
          name:           c.name,
          code:           c.code,
        },
      })
      courseMap[c.code] = rec.id
    }
  }

  private async seedStrands(
    orgId:        string,
    schoolYearId: string,
    shouldSeedP:  (k: string) => boolean,
    shouldSeedS:  (name: string) => boolean,
    programMap:   Record<string, string>,
    strandMap:    Record<string, string>,
  ) {
    if (!shouldSeedP('shs') || !programMap['shs']) return

    for (const s of SHS_STRAND_DEFS) {
      if (!shouldSeedS(s.name)) continue
      const id = seedId('strand', s.name, schoolYearId, orgId)
      const rec = await this.db.strand.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          org_id:         orgId,
          school_year_id: schoolYearId,
          program_id:     programMap['shs'],
          name:           s.name,
        },
      })
      strandMap[s.name] = rec.id
    }
  }

  private async seedLevelsAndSections(
    orgId:        string,
    schoolYearId: string,
    shouldSeedP:  (k: string) => boolean,
    shouldSeedL:  (name: string) => boolean,
    programMap:   Record<string, string>,
    levelMap:     Record<string, string>,
  ) {
    const levelDefs = buildLevelDefs().filter((l) => shouldSeedP(l.programKey))

    for (const lvl of levelDefs) {
      if (!shouldSeedL(lvl.name)) continue
      const programId = programMap[lvl.programKey]
      if (!programId) continue

      const id = seedId('level', lvl.programKey, lvl.name, schoolYearId, orgId)
      const rec = await this.db.level.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          org_id:         orgId,
          school_year_id: schoolYearId,
          program_id:     programId,
          name:           lvl.name,
        },
      })
      levelMap[lvl.name] = rec.id

      for (const sec of lvl.sections) {
        const sectionId = seedId('section', lvl.programKey, lvl.name, sec.name, schoolYearId, orgId)
        await this.db.section.upsert({
          where:  { id: sectionId },
          update: {},
          create: {
            id:             sectionId,
            org_id:         orgId,
            level_id:       rec.id,
            school_year_id: schoolYearId,  // ← add this
            name:           sec.name,
            capacity:       sec.capacity,
          },
        })
      }
    }
  }

  private async seedGradingScales(
    orgId:        string,
    schoolYearId: string,
    shouldSeed:   (k: string) => boolean,
    levelMap:     Record<string, string>,
  ) {
    for (const sa of buildScaleAssignments()) {
      if (!shouldSeed(sa.programKey)) continue
      const levelId = levelMap[sa.levelName]
      if (!levelId) continue

      const id = seedId('scale', sa.levelName, sa.scaleName, schoolYearId, orgId)
      await this.db.gradingScale.upsert({
        where:  { id },
        update: {},
        create: {
          id,
          org_id:         orgId,
          school_year_id: schoolYearId,
          level_id:       levelId,
          name:           sa.scaleName,
          ranges:         sa.ranges,
          is_locked:      false,
        },
      })
    }
  }

    private async seedGradingSchemes(
      orgId:        string,
      schoolYearId: string,   // ← add param
      shouldSeed:   (k: string) => boolean,
    ) {
    const schemeProgram: Record<string, string> = {
      'Daycare Scheme':            'daycare',
      'Kindergarten Scheme':       'kinder',
      'Elementary Scheme':         'elementary',
      'High School Scheme':        'jhs',
      'Senior High School Scheme': 'shs',
      'College Scheme':            'college',
    }

    for (const preset of SCHEME_PRESETS) {
      const progKey = schemeProgram[preset.name]
      if (progKey && !shouldSeed(progKey)) continue

      const id = seedId('scheme', preset.name, orgId)
      const existing = await this.db.gradingScheme.findFirst({ where: { id } })
      if (existing) continue

      const scheme = await this.db.gradingScheme.create({
        data: {
          id,
          org_id:         orgId,
          school_year_id: schoolYearId,  // ← add
          name:           preset.name,
          is_default:     false,
          is_locked:      false,
        },
      })

      await this.db.gradingSchemeComponent.createMany({
        data: preset.components.map((c) => ({
          id:                uuid(),
          org_id:            orgId,
          grading_scheme_id: scheme.id,
          name:              c.name,
          type:              c.type,
          weight:            c.weight,
          is_optional:       c.isOptional,
        })),
      })
    }
  }

  private async seedSubjects(
    orgId:           string,
    shouldSeedP:     (k: string) => boolean,
    shouldSeedSubj:  (name: string) => boolean,
    levelMap:        Record<string, string>,
    courseMap:       Record<string, string>,
    strandMap:       Record<string, string>,
    subjectNameToId: Record<string, string>,
  ) {
    const subjectDefs = allSubjects().filter((s) =>
      shouldSeedP(deriveProgramKey(s.levelName)),
    )

    for (const s of subjectDefs) {
      if (!shouldSeedSubj(s.name)) continue
      const levelId = levelMap[s.levelName]
      if (!levelId) continue

      const courseId = s.courseCode ? courseMap[s.courseCode] : null
      const strandId = s.strandName ? strandMap[s.strandName] : null
      if (s.courseCode && !courseId) continue
      if (s.strandName && !strandId) continue

      const id = seedId(
        'subject',
        s.levelName,
        s.courseCode ?? 'none',
        s.strandName ?? 'none',
        s.name,
        orgId,
      )

      const existing = await this.db.subject.findFirst({ where: { id } })
      const subjectId = existing
        ? existing.id
        : (
            await this.db.subject.create({
              data: {
                id,
                org_id:     orgId,
                level_id:   levelId,
                course_id:  courseId ?? undefined,
                strand_id:  strandId ?? undefined,
                name:       s.name,
                year_level: s.yearLevel,
                term_label: s.termLabel,
                is_locked:  false,
              },
            })
          ).id

      subjectNameToId[s.name] = subjectId
    }
  }

  private async seedPrerequisites(
    orgId:           string,
    shouldSeedP:     (k: string) => boolean,
    levelMap:        Record<string, string>,
    subjectNameToId: Record<string, string>,
  ) {
    const subjectDefs = allSubjects().filter((s) =>
      shouldSeedP(deriveProgramKey(s.levelName)),
    )

    for (const s of subjectDefs) {
      if (s.prereqNames.length === 0) continue
      if (!levelMap[s.levelName]) continue
      const subjectId = subjectNameToId[s.name]
      if (!subjectId) continue

      for (const prereqName of s.prereqNames) {
        const cleanName = prereqName.replace(/\s*\(.*?\)\s*$/, '').trim()
        const prereqId  = subjectNameToId[cleanName]
        if (!prereqId) continue

        await this.db.subjectPrerequisite.upsert({
          where: {
            subject_id_prerequisite_id: {
              subject_id:      subjectId,
              prerequisite_id: prereqId,
            },
          },
          update: {},
          create: {
            id:              uuid(),
            org_id:          orgId,
            subject_id:      subjectId,
            prerequisite_id: prereqId,
          },
        })
      }
    }
  }
}