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
  orgId: string
  programs: string[] // e.g. ['elementary', 'jhs', 'college']
}

@Injectable()
export class OrgSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seedOrg(options: OrgSeedOptions): Promise<void> {
    const { orgId, programs } = options
    const selected = new Set(programs)
    const shouldSeed = (key: string) => selected.has(key)

    const programMap: Record<string, string> = {}
    const courseMap: Record<string, string> = {}
    const strandMap: Record<string, string> = {}
    const levelMap: Record<string, string> = {}
    const subjectNameToId: Record<string, string> = {}

    await this.seedPrograms(orgId, shouldSeed, programMap)
    await this.seedCourses(orgId, shouldSeed, programMap, courseMap)
    await this.seedStrands(orgId, shouldSeed, programMap, strandMap)
    await this.seedLevelsAndSections(orgId, shouldSeed, programMap, levelMap)
    await this.seedGradingScales(orgId, shouldSeed, levelMap)
    await this.seedGradingSchemes(orgId)
    await this.seedSubjects(orgId, shouldSeed, levelMap, courseMap, strandMap, subjectNameToId)
    await this.seedPrerequisites(orgId, shouldSeed, levelMap, subjectNameToId)
  }

  private async seedPrograms(
    orgId: string,
    shouldSeed: (k: string) => boolean,
    programMap: Record<string, string>,
  ) {
    for (const p of PROGRAMS) {
      if (!shouldSeed(p.key)) continue
      const rec = await this.db.program.upsert({
        where: { id: `seed-prog-${p.key}-${orgId}` },
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
    orgId: string,
    shouldSeed: (k: string) => boolean,
    programMap: Record<string, string>,
    courseMap: Record<string, string>,
  ) {
    if (!shouldSeed('college') || !programMap['college']) return
    for (const c of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
      const rec = await this.db.course.upsert({
        where: { id: `seed-course-${c.code}-${orgId}` },
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
    orgId: string,
    shouldSeed: (k: string) => boolean,
    programMap: Record<string, string>,
    strandMap: Record<string, string>,
  ) {
    if (!shouldSeed('shs') || !programMap['shs']) return
    for (const s of SHS_STRAND_DEFS) {
      const rec = await this.db.strand.upsert({
        where: { id: `seed-strand-${s.name.replace(/\s+/g, '-')}-${orgId}` },
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
    orgId: string,
    shouldSeed: (k: string) => boolean,
    programMap: Record<string, string>,
    levelMap: Record<string, string>,
  ) {
    const levelDefs = buildLevelDefs().filter((l) => shouldSeed(l.programKey))
    for (const lvl of levelDefs) {
      const levelKey = `${lvl.programKey}-${lvl.name}`.replace(/\s+/g, '-')
      const rec = await this.db.level.upsert({
        where: { id: `seed-level-${levelKey}-${orgId}` },
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
          where: { id: `seed-section-${sectionKey}-${orgId}` },
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
    orgId: string,
    shouldSeed: (k: string) => boolean,
    levelMap: Record<string, string>,
  ) {
    for (const sa of buildScaleAssignments()) {
      if (!shouldSeed(sa.programKey)) continue
      const levelId = levelMap[sa.levelName]
      if (!levelId) continue
      const scaleKey = `${sa.levelName}-${sa.scaleName}`.replace(/\s+/g, '-')
      await this.db.gradingScale.upsert({
        where: { id: `seed-scale-${scaleKey}-${orgId}` },
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

  private async seedGradingSchemes(orgId: string) {
    for (const preset of SCHEME_PRESETS) {
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
    orgId: string,
    shouldSeed: (k: string) => boolean,
    levelMap: Record<string, string>,
    courseMap: Record<string, string>,
    strandMap: Record<string, string>,
    subjectNameToId: Record<string, string>,
  ) {
    const subjectDefs = allSubjects().filter((s) =>
      shouldSeed(deriveProgramKey(s.levelName)),
    )
    for (const s of subjectDefs) {
      const levelId = levelMap[s.levelName]
      if (!levelId) continue
      const courseId = s.courseCode ? courseMap[s.courseCode] : null
      const strandId = s.strandName ? strandMap[s.strandName] : null
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
              id:         `seed-subj-${subjectKey}-${orgId}`.substring(0, 100),
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
    orgId: string,
    shouldSeed: (k: string) => boolean,
    levelMap: Record<string, string>,
    subjectNameToId: Record<string, string>,
  ) {
    const subjectDefs = allSubjects().filter((s) =>
      shouldSeed(deriveProgramKey(s.levelName)),
    )
    for (const s of subjectDefs) {
      if (s.prereqNames.length === 0) continue
      if (!levelMap[s.levelName]) continue
      const subjectId = subjectNameToId[s.name]
      if (!subjectId) continue

      for (const prereqName of s.prereqNames) {
        const cleanName = prereqName.replace(/\s*\(.*?\)\s*$/, '').trim()
        const prereqId = subjectNameToId[cleanName]
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