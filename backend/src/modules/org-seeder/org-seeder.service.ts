import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { v4 as uuid } from 'uuid'
import { PROGRAMS }                      from './data/programs.data'
import { COLLEGE_COURSES, BSED_MAJORS }  from './data/courses.data'
import { SHS_STRAND_DEFS }               from './data/strands.data'
import { buildLevelDefs }                from './data/levels.data'
import { buildScaleAssignments }         from './data/grading-scale.data'
import { SCHEME_PRESETS }                from './data/grading-schemes.data'
import { allSubjects, deriveProgramKey } from './data/subjects'

export interface OrgSeedOptions {
  orgId:             string
  programs:          string[]       // e.g. ['elementary', 'college']
  courses?:          string[]       // college course codes e.g. ['BSIT', 'BSCS']
  strands?:          string[]       // shs strand names e.g. ['STEM', 'ABM']
  excludedLevels?:   string[]       // level names to skip e.g. ['Grade 1']
  excludedSubjects?: string[]       // subject names to skip
}

@Injectable()
export class OrgSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seedOrg(options: OrgSeedOptions): Promise<void> {
    const {
      orgId,
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
    const shouldSeedCourse  = (code: string) =>
      courses.length === 0 || selectedCourses.has(code)
    const shouldSeedStrand  = (name: string) =>
      strands.length === 0 || selectedStrands.has(name)
    const shouldSeedLevel   = (name: string) => !excludedLevelSet.has(name)
    const shouldSeedSubject = (name: string) => !excludedSubjSet.has(name)

    const programMap:       Record<string, string> = {}
    const courseMap:        Record<string, string> = {}
    const strandMap:        Record<string, string> = {}
    const levelMap:         Record<string, string> = {}
    const subjectNameToId:  Record<string, string> = {}

    await this.seedPrograms(orgId, shouldSeedProgram, programMap)
    await this.seedCourses(orgId, shouldSeedProgram, shouldSeedCourse, programMap, courseMap)
    await this.seedStrands(orgId, shouldSeedProgram, shouldSeedStrand, programMap, strandMap)
    await this.seedLevelsAndSections(orgId, shouldSeedProgram, shouldSeedLevel, programMap, levelMap)
    await this.seedGradingScales(orgId, shouldSeedProgram, levelMap)
    await this.seedGradingSchemes(orgId, shouldSeedProgram)
    await this.seedSubjects(orgId, shouldSeedProgram, shouldSeedSubject, levelMap, courseMap, strandMap, subjectNameToId)
    await this.seedPrerequisites(orgId, shouldSeedProgram, levelMap, subjectNameToId)
  }

  private async seedPrograms(
    orgId:         string,
    shouldSeed:    (k: string) => boolean,
    programMap:    Record<string, string>,
  ) {
    for (const p of PROGRAMS) {
      if (!shouldSeed(p.key)) continue
      const rec = await this.db.program.upsert({
        where:  { id: `seed-prog-${p.key}-${orgId}` },
        update: {},
        create: {
          id:     `seed-prog-${p.key}-${orgId}`,
          org_id: orgId,
          name:   p.name,
          type:   p.type,
        },
      })
      programMap[p.key] = rec.id
    }
  }

  private async seedCourses(
    orgId:        string,
    shouldSeedP:  (k: string) => boolean,
    shouldSeedC:  (code: string) => boolean,
    programMap:   Record<string, string>,
    courseMap:    Record<string, string>,
  ) {
    if (!shouldSeedP('college') || !programMap['college']) return
    for (const c of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
      if (!shouldSeedC(c.code)) continue
      const rec = await this.db.course.upsert({
        where:  { id: `seed-course-${c.code}-${orgId}` },
        update: {},
        create: {
          id:         `seed-course-${c.code}-${orgId}`,
          org_id:     orgId,
          program_id: programMap['college'],
          name:       c.name,
          code:       c.code,
        },
      })
      courseMap[c.code] = rec.id
    }
  }

  private async seedStrands(
    orgId:        string,
    shouldSeedP:  (k: string) => boolean,
    shouldSeedS:  (name: string) => boolean,
    programMap:   Record<string, string>,
    strandMap:    Record<string, string>,
  ) {
    if (!shouldSeedP('shs') || !programMap['shs']) return
    for (const s of SHS_STRAND_DEFS) {
      if (!shouldSeedS(s.name)) continue
      const rec = await this.db.strand.upsert({
        where:  { id: `seed-strand-${s.name.replace(/\s+/g, '-')}-${orgId}` },
        update: {},
        create: {
          id:         `seed-strand-${s.name.replace(/\s+/g, '-')}-${orgId}`,
          org_id:     orgId,
          program_id: programMap['shs'],
          name:       s.name,
        },
      })
      strandMap[s.name] = rec.id
    }
  }

  private async seedLevelsAndSections(
    orgId:         string,
    shouldSeedP:   (k: string) => boolean,
    shouldSeedL:   (name: string) => boolean,
    programMap:    Record<string, string>,
    levelMap:      Record<string, string>,
  ) {
    const levelDefs = buildLevelDefs().filter((l) => shouldSeedP(l.programKey))
    for (const lvl of levelDefs) {
      if (!shouldSeedL(lvl.name)) continue
      const levelKey = `${lvl.programKey}-${lvl.name}`.replace(/\s+/g, '-')
      const rec = await this.db.level.upsert({
        where:  { id: `seed-level-${levelKey}-${orgId}` },
        update: {},
        create: {
          id:         `seed-level-${levelKey}-${orgId}`,
          org_id:     orgId,
          program_id: programMap[lvl.programKey],
          name:       lvl.name,
        },
      })
      levelMap[lvl.name] = rec.id
      for (const sec of lvl.sections) {
        const sectionKey = `${levelKey}-${sec.name}`.replace(/\s+/g, '-')
        await this.db.section.upsert({
          where:  { id: `seed-section-${sectionKey}-${orgId}` },
          update: {},
          create: {
            id:       `seed-section-${sectionKey}-${orgId}`,
            org_id:   orgId,
            level_id: rec.id,
            name:     sec.name,
            capacity: sec.capacity,
          },
        })
      }
    }
  }

  private async seedGradingScales(
    orgId:      string,
    shouldSeed: (k: string) => boolean,
    levelMap:   Record<string, string>,
  ) {
    for (const sa of buildScaleAssignments()) {
      if (!shouldSeed(sa.programKey)) continue
      const levelId = levelMap[sa.levelName]
      if (!levelId) continue
      const scaleKey = `${sa.levelName}-${sa.scaleName}`.replace(/\s+/g, '-')
      await this.db.gradingScale.upsert({
        where:  { id: `seed-scale-${scaleKey}-${orgId}` },
        update: {},
        create: {
          id:        `seed-scale-${scaleKey}-${orgId}`,
          org_id:    orgId,
          level_id:  levelId,
          name:      sa.scaleName,
          ranges:    sa.ranges,
          is_locked: false,
        },
      })
    }
  }

  private async seedGradingSchemes(
    orgId:      string,
    shouldSeed: (k: string) => boolean,
  ) {
    // map scheme name → program key so we only seed relevant schemes
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
      const schemeKey = preset.name.replace(/\s+/g, '-')
      const existing = await this.db.gradingScheme.findFirst({
        where: { org_id: orgId, name: preset.name },
      })
      if (existing) continue
      const scheme = await this.db.gradingScheme.create({
        data: {
          id:         `seed-scheme-${schemeKey}-${orgId}`,
          org_id:     orgId,
          name:       preset.name,
          is_default: false,
          is_locked:  false,
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
    orgId:          string,
    shouldSeedP:    (k: string) => boolean,
    shouldSeedSubj: (name: string) => boolean,
    levelMap:       Record<string, string>,
    courseMap:      Record<string, string>,
    strandMap:      Record<string, string>,
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

      // skip if course/strand was not seeded (user deselected it)
      if (s.courseCode && !courseId) continue
      if (s.strandName && !strandId) continue

      const subjectKey = `${s.levelName}-${s.courseCode ?? 'none'}-${s.strandName ?? 'none'}-${s.name}`
        .replace(/\s+/g, '-')
      const existing = await this.db.subject.findFirst({
        where: {
          org_id:    orgId,
          name:      s.name,
          level_id:  levelId,
          course_id: courseId ?? undefined,
          strand_id: strandId ?? undefined,
        },
      })
      const subjectId = existing
        ? existing.id
        : (await this.db.subject.create({
            data: {
              id:         uuid(),   // ← just use uuid() like prerequisites do
              org_id:     orgId,
              name:       s.name,
              level_id:   levelId,
              course_id:  courseId,
              strand_id:  strandId,
              year_level: s.yearLevel,
              term_label: s.termLabel,
              is_locked:  false,
            },
          })).id
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