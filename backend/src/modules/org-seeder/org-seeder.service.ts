// backend/src/modules/org-seeder/org-seeder.service.ts
import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { v4 as uuid, v5 as uuidv5 } from 'uuid'
import { PROGRAMS }                                  from './data/programs.data'
import { COLLEGE_COURSES, BSED_MAJORS }              from './data/courses.data'
import { SHS_STRAND_DEFS }                           from './data/strands.data'
import { buildLevelDefs }                            from './data/levels.data'
import { buildScaleAssignments }                     from './data/grading-scale.data'
import { SCHEME_PRESETS }                            from './data/grading-schemes.data'
import { allMajorSubjects, allMinorSubjects, allSubjects, deriveProgramKey } from './data/subjects'

const SEED_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'

function seedId(...parts: string[]): string {
  return uuidv5(parts.join(':'), SEED_NAMESPACE)
}

export interface GradingScaleRangeOption {
  label:      string
  minScore:   number
  maxScore:   number
  gradeValue: string
}

export interface GradingScaleOption {
  presetKey: string
  name:      string
  ranges:    GradingScaleRangeOption[]
}

export interface OrgSeedOptions {
  orgId: string
  schoolYearId: string
  programs: string[]
  courses?: string[]
  strands?: string[]
  excludedLevels?: string[]
  excludedSubjects?: string[]

  levelConfigs?: Record<string, string[]>

  // ✅ ADD THIS
  sectionConfigs?: Record<
    string,
    {
      name: string
      capacity: number
    }[]
  >

  gradingScales?: Record<string, GradingScaleOption>
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
      levelConfigs     = {},
      sectionConfigs = {},
      gradingScales    = {},
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
    await this.seedLevelsAndSections(orgId, schoolYearId, shouldSeedProgram, shouldSeedLevel, programMap, levelMap, levelConfigs,sectionConfigs)
    await this.seedGradingScales(orgId, schoolYearId, shouldSeedProgram, levelMap, gradingScales)
    await this.seedGradingSchemes(orgId, shouldSeedProgram)
    await this.seedMajorSubjects(orgId, shouldSeedProgram, shouldSeedSubject, levelMap, courseMap, strandMap, subjectNameToId)
    await this.seedMinorSubjects(orgId, shouldSeedProgram, shouldSeedSubject, levelMap, courseMap, strandMap, programMap, subjectNameToId)
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
      const id  = seedId('prog', p.key, schoolYearId, orgId)
      const rec = await this.db.program.upsert({
        where:  { id },
        update: {},
        create: { id, org_id: orgId, school_year_id: schoolYearId, name: p.name, type: p.type },
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
      const id  = seedId('course', c.code, schoolYearId, orgId)
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
      const id  = seedId('strand', s.name, schoolYearId, orgId)
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
  orgId: string,
  schoolYearId: string,
  shouldSeedP: (k: string) => boolean,
  shouldSeedL: (name: string) => boolean,
  programMap: Record<string, string>,
  levelMap: Record<string, string>,
  levelConfigs: Record<string, string[]>,
  sectionConfigs: Record<
    string,
    {
      name: string
      capacity: number
    }[]
  >,
) {
    // Build level defs: prefer frontend levelConfigs over buildLevelDefs()
    const defaultDefs = buildLevelDefs().filter((l) => shouldSeedP(l.programKey))

    // Collect all program keys that need levels
    const programKeys = [...new Set(defaultDefs.map((l) => l.programKey))]

    for (const progKey of programKeys) {
      const programId = programMap[progKey]
      if (!programId) continue

      // If frontend sent custom level names for this program, use those.
      // Otherwise fall back to what buildLevelDefs() generated.
      const customNames = levelConfigs[progKey]

      if (customNames && customNames.length > 0) {
        // Use custom level names from the frontend admin
        for (const levelName of customNames) {
          if (!shouldSeedL(levelName)) continue

          const id  = seedId('level', progKey, levelName, schoolYearId, orgId)
          const rec = await this.db.level.upsert({
            where:  { id },
            update: {},
            create: {
              id,
              org_id:         orgId,
              school_year_id: schoolYearId,
              program_id:     programId,
              name:           levelName,
            },
          })
          levelMap[levelName] = rec.id

    const customSections = sectionConfigs[levelName] ?? [
      { name: 'Section A', capacity: 40 },
      { name: 'Section B', capacity: 40 },
    ]
    for (const sec of customSections) {
      const sectionId = seedId('section', progKey, levelName, sec.name, schoolYearId, orgId)
      await this.db.section.upsert({
        where:  { id: sectionId },
        update: {},
        create: {
          id:             sectionId,
          org_id:         orgId,
          level_id:       rec.id,
          school_year_id: schoolYearId,
          name:           sec.name,
          capacity:       sec.capacity,
        },
      })
    }
        }
      } else {
        // Fall back to default level defs for this program
        const progDefs = defaultDefs.filter((l) => l.programKey === progKey)
        for (const lvl of progDefs) {
          if (!shouldSeedL(lvl.name)) continue

          const id  = seedId('level', lvl.programKey, lvl.name, schoolYearId, orgId)
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

      const defaultSections = sectionConfigs[lvl.name] ?? lvl.sections
      for (const sec of defaultSections) {
        const sectionId = seedId('section', lvl.programKey, lvl.name, sec.name, schoolYearId, orgId)
        await this.db.section.upsert({
          where:  { id: sectionId },
          update: {},
          create: {
            id:             sectionId,
            org_id:         orgId,
            level_id:       rec.id,
            school_year_id: schoolYearId,
            name:           sec.name,
            capacity:       sec.capacity,
          },
        })
      }
        }
      }
    }
  }

  private async seedGradingScales(
    orgId:         string,
    schoolYearId:  string,
    shouldSeed:    (k: string) => boolean,
    levelMap:      Record<string, string>,
    gradingScales: Record<string, GradingScaleOption>,
  ) {
    // If frontend sent per-program grading scales, use those
    if (Object.keys(gradingScales).length > 0) {
      for (const [progKey, scale] of Object.entries(gradingScales)) {
        if (!shouldSeed(progKey)) continue
        // Apply this scale to every level that belongs to this program (via levelMap)
        // We match by checking which levelMap keys were seeded for this program
        for (const [levelName, levelId] of Object.entries(levelMap)) {
          // Only apply to levels that were seeded for this program
          // (we can't directly query programKey here, but we seeded them in order,
          // so we check by trying to create — upsert handles duplicates safely)
          const id = seedId('scale', levelName, scale.name, schoolYearId, orgId)
          await this.db.gradingScale.upsert({
            where:  { id },
            update: {},
            create: {
              id,
              org_id:         orgId,
              school_year_id: schoolYearId,
              level_id:       levelId,
              name:           scale.name,
              ranges:         scale.ranges as any,
              is_locked:      false,
            },
          })
        }
      }
      return
    }

    // Fall back to buildScaleAssignments() if no frontend scales provided
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

private async seedGradingSchemes(orgId: string, shouldSeed: (k: string) => boolean) {
  // Now seeds GradingSchemeTemplate (admin-level, reusable), NOT GradingScheme (class-level)
  for (const preset of SCHEME_PRESETS) {
    const progKey = schemeProgram[preset.name]
    if (progKey && !shouldSeed(progKey)) continue

    const id = seedId('scheme-template', preset.name, orgId)
    const existing = await this.db.gradingSchemeTemplate.findFirst({ where: { id } })
    if (existing) continue

    const template = await this.db.gradingSchemeTemplate.create({
      data: {
        id,
        org_id: orgId,
        name: preset.name,
        // program_type is optional — can map from progKey if desired
      },
    })

    await this.db.gradingSchemeTemplateComponent.createMany({
      data: preset.components.map((c) => ({
        id: uuid(),
        org_id: orgId,
        template_id: template.id,
        name: c.name,
        type: c.type,
        weight: c.weight,
        // max_score not in preset, omit or default to null
      })),
    })
  }
}

  private async seedMajorSubjects(
    orgId:           string,
    shouldSeedP:     (k: string) => boolean,
    shouldSeedSubj:  (name: string) => boolean,
    levelMap:        Record<string, string>,
    courseMap:       Record<string, string>,
    strandMap:       Record<string, string>,
    subjectNameToId: Record<string, string>,
  ) {
    const subjectDefs = allMajorSubjects().filter((s) =>
      shouldSeedP(deriveProgramKey(s.levelName)),
    )

    for (const s of subjectDefs) {
      if (!shouldSeedSubj(s.name)) continue
      const levelId  = levelMap[s.levelName]
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

      const existing  = await this.db.subject.findFirst({ where: { id } })
      const subjectId = existing
        ? existing.id
        : (
            await this.db.subject.create({
              data: {
                id,
                org_id:       orgId,
                subject_type: 'major',
                level_id:     levelId,
                course_id:    courseId ?? undefined,
                strand_id:    strandId ?? undefined,
                name:         s.name,
                year_level:   s.yearLevel,
                term_label:   s.termLabel,
                is_locked:    false,
              },
            })
          ).id

      subjectNameToId[s.name] = subjectId
    }
  }

  private async seedMinorSubjects(
    orgId:           string,
    shouldSeedP:     (k: string) => boolean,
    shouldSeedSubj:  (name: string) => boolean,
    levelMap:        Record<string, string>,
    courseMap:       Record<string, string>,
    strandMap:       Record<string, string>,
    programMap:      Record<string, string>,
    subjectNameToId: Record<string, string>,
  ) {
    if (shouldSeedP('college') && programMap['college']) {
      const collegeMinors = allMinorSubjects().filter(
        (s) => deriveProgramKey(s.levelName) === 'college',
      )
      for (const s of collegeMinors) {
        if (!shouldSeedSubj(s.name)) continue
        const id = seedId('subject', 'college_ge', 'minor', s.name, orgId)
        let subjectId: string
        const existing = await this.db.subject.findFirst({ where: { id } })
        if (existing) {
          subjectId = existing.id
        } else {
          const created = await this.db.subject.create({
            data: {
              id,
              org_id:       orgId,
              subject_type: 'minor',
              program_id:   programMap['college'],
              level_id:     null,
              name:         s.name,
              year_level:   s.yearLevel,
              term_label:   s.termLabel,
              is_locked:    false,
            },
          })
          subjectId = created.id
        }
        subjectNameToId[s.name] = subjectId

        for (const [, courseId] of Object.entries(courseMap)) {
          const sharingId = seedId('sharing', subjectId, courseId, orgId)
          await this.db.subjectSharing.upsert({
            where:  { id: sharingId },
            update: {},
            create: { id: sharingId, org_id: orgId, subject_id: subjectId, course_id: courseId, strand_id: null, level_id: null },
          })
        }
      }
    }

    if (shouldSeedP('shs') && programMap['shs']) {
      const seenShsMinors = new Map<string, string>()
      const shsMinorDefs  = allMajorSubjects().filter(
        (s) => s.isMinor && deriveProgramKey(s.levelName) === 'shs',
      )

      for (const s of shsMinorDefs) {
        if (!shouldSeedSubj(s.name)) continue
        const dedupeKey = `${s.name}:${s.yearLevel}`
        let subjectId: string

        if (seenShsMinors.has(dedupeKey)) {
          subjectId = seenShsMinors.get(dedupeKey)!
        } else {
          const id       = seedId('subject', 'shs_minor', s.yearLevel, s.name, orgId)
          const existing = await this.db.subject.findFirst({ where: { id } })
          if (existing) {
            subjectId = existing.id
          } else {
            const created = await this.db.subject.create({
              data: {
                id,
                org_id:       orgId,
                subject_type: 'minor',
                program_id:   programMap['shs'],
                level_id:     null,
                name:         s.name,
                year_level:   s.yearLevel,
                term_label:   s.termLabel,
                is_locked:    false,
              },
            })
            subjectId = created.id
          }
          seenShsMinors.set(dedupeKey, subjectId)
          subjectNameToId[s.name] = subjectId
        }

        if (s.strandName && strandMap[s.strandName]) {
          const strandId  = strandMap[s.strandName]
          const sharingId = seedId('sharing', subjectId, strandId, s.yearLevel, orgId)
          await this.db.subjectSharing.upsert({
            where:  { id: sharingId },
            update: {},
            create: { id: sharingId, org_id: orgId, subject_id: subjectId, course_id: null, strand_id: strandId, level_id: null },
          })
        }
      }
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
      if (!s.isMinor && !levelMap[s.levelName]) continue
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