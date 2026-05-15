import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { v4 as uuid, v5 as uuidv5 } from 'uuid';
import { PROGRAMS } from './data/programs.data';
import { COLLEGE_COURSES, BSED_MAJORS } from './data/courses.data';
import { SHS_STRAND_DEFS } from './data/strands.data';
import { buildLevelDefs } from './data/levels.data';
import { buildScaleAssignments } from './data/grading-scale.data';
import { SCHEME_PRESETS } from './data/grading-schemes.data';
import { SEMESTER_TEMPLATES } from './data/semester-templates.data';
import {
  allMajorSubjects,
  allMinorSubjects,
  allSubjects,
  deriveProgramKey,
} from './data/subjects';
import { computeTermDates } from './utils/date-calculator.util';

const SEED_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

function seedId(...parts: string[]): string {
  return uuidv5(parts.join(':'), SEED_NAMESPACE);
}

function emptyCount() {
  return { seeded: 0, already_exists: 0, skipped: 0 };
}

export interface SeedCount {
  seeded: number;
  already_exists: number;
  skipped: number;
}

export interface SeedResult {
  programs: SeedCount;
  courses: SeedCount;
  strands: SeedCount;
  levels: SeedCount;
  sections: SeedCount;
  subjects: SeedCount;
  gradingScales: SeedCount;
  gradingSchemeTemplates: SeedCount;
  semesterTemplates: SeedCount;
}

export interface GradingScaleRangeOption {
  label: string;
  minScore: number;
  maxScore: number;
  gradeValue: string;
}

export interface GradingScaleOption {
  presetKey: string;
  name: string;
  ranges: GradingScaleRangeOption[];
}

export interface OrgSeedOptions {
  orgId: string;
  schoolYearId: string;
  programs: string[];
  courses?: string[];
  strands?: string[];
  excludedLevels?: string[];
  excludedSubjects?: string[];
  excludedLevelSubjects?: Record<string, string[]>;
  levelConfigs?: Record<string, string[]>;
  /** 🔥 FIX: sectionConfigs now expects scoped keys like "BSCS|1st Year" or "STEM|Grade 11" */
  sectionConfigs?: Record<string, { name: string; capacity: number }[]>;
  gradingScales?: Record<string, GradingScaleOption>;
}

@Injectable()
export class OrgSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seedOrg(options: OrgSeedOptions): Promise<SeedResult> {
    const {
      orgId,
      schoolYearId,
      programs,
      courses = [],
      strands = [],
      excludedLevels = [],
      excludedSubjects = [],
      excludedLevelSubjects = {} as Record<string, string[]>,
      levelConfigs = {},
      sectionConfigs = {},
      gradingScales = {},
    } = options;

    const selectedPrograms = new Set(programs);
    const selectedCourses = new Set(courses);
    const selectedStrands = new Set(strands);
    const excludedLevelSet = new Set(excludedLevels);
    const excludedSubjSet = new Set(excludedSubjects);

    const shouldSeedProgram = (key: string) => selectedPrograms.has(key);
    const shouldSeedCourse = (code: string) =>
      courses.length === 0 || selectedCourses.has(code);
    const shouldSeedStrand = (name: string) =>
      strands.length === 0 || selectedStrands.has(name);
    const shouldSeedLevel = (name: string) => !excludedLevelSet.has(name);
    const shouldSeedSubject = (name: string, levelName?: string) => {
      if (excludedSubjSet.has(name)) return false;
      if (levelName && excludedLevelSubjects[levelName]?.includes(name))
        return false;
      return true;
    };

    const programMap: Record<string, string> = {};
    const courseMap: Record<string, string> = {};
    const strandMap: Record<string, string> = {};
    const levelMap: Record<string, string> = {};
    const subjectNameToId: Record<string, string> = {};

    const result: SeedResult = {
      programs: emptyCount(),
      courses: emptyCount(),
      strands: emptyCount(),
      levels: emptyCount(),
      sections: emptyCount(),
      subjects: emptyCount(),
      gradingScales: emptyCount(),
      gradingSchemeTemplates: emptyCount(),
      semesterTemplates: emptyCount(),
    };

    await this.db.orgEnrollmentSetting.upsert({
      where: { org_id: orgId },
      update: {},
      create: {
        id: seedId('org-enrollment-setting', orgId),
        org_id: orgId,
        require_semester_reenrollment: false,
        auto_unenroll_on_year_end: true,
      },
    });

    await this.seedPrograms(
      orgId,
      schoolYearId,
      shouldSeedProgram,
      programMap,
      result,
    );
    await this.seedCourses(
      orgId,
      schoolYearId,
      shouldSeedProgram,
      shouldSeedCourse,
      programMap,
      courseMap,
      result,
    );
    await this.seedStrands(
      orgId,
      schoolYearId,
      shouldSeedProgram,
      shouldSeedStrand,
      programMap,
      strandMap,
      result,
    );
    console.log('courseMap keys:', Object.keys(courseMap));
    console.log('strandMap keys:', Object.keys(strandMap));
    console.log('sectionConfigs keys:', Object.keys(sectionConfigs));
    await this.seedLevelsAndSections(
      orgId,
      schoolYearId,
      shouldSeedProgram,
      shouldSeedLevel,
      programMap,
      courseMap,
      strandMap,
      levelMap,
      levelConfigs,
      sectionConfigs,
      result,
    );
    await this.seedGradingScales(
      orgId,
      schoolYearId,
      shouldSeedProgram,
      programMap,
      gradingScales,
      result,
    );
    await this.seedGradingSchemes(orgId, shouldSeedProgram, result);
    await this.seedSemesterTemplates(
      orgId,
      shouldSeedProgram,
      programMap,
      result,
      schoolYearId,
    );
    await this.seedMajorSubjects(
      orgId,
      shouldSeedProgram,
      shouldSeedSubject,
      levelMap,
      courseMap,
      strandMap,
      programMap,
      subjectNameToId,
      result,
    );
    await this.seedMinorSubjects(
      orgId,
      shouldSeedProgram,
      shouldSeedSubject,
      levelMap,
      courseMap,
      strandMap,
      programMap,
      subjectNameToId,
      result,
    );
    await this.seedPrerequisites(
      orgId,
      shouldSeedProgram,
      levelMap,
      subjectNameToId,
    );

    return result;
  }

  private async seedPrograms(
    orgId: string,
    schoolYearId: string,
    shouldSeed: (k: string) => boolean,
    programMap: Record<string, string>,
    result: SeedResult,
  ) {
    for (const p of PROGRAMS) {
      if (!shouldSeed(p.key)) {
        result.programs.skipped++;
        continue;
      }

      const id = seedId('prog', p.key, schoolYearId, orgId);
      const existing = await this.db.program.findFirst({ where: { id } });

      if (existing) {
        programMap[p.key] = existing.id;
        result.programs.already_exists++;
      } else {
        const rec = await this.db.program.create({
          data: {
            id,
            org_id: orgId,
            school_year_id: schoolYearId,
            name: p.name,
            type: p.type,
          },
        });
        programMap[p.key] = rec.id;
        result.programs.seeded++;
      }
    }
  }

  private async seedCourses(
    orgId: string,
    schoolYearId: string,
    shouldSeedP: (k: string) => boolean,
    shouldSeedC: (code: string) => boolean,
    programMap: Record<string, string>,
    courseMap: Record<string, string>,
    result: SeedResult,
  ) {
    if (!shouldSeedP('college') || !programMap['college']) return;

    for (const c of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
      if (!shouldSeedC(c.code)) {
        result.courses.skipped++;
        continue;
      }

      const id = seedId('course', c.code, schoolYearId, orgId);
      const existing = await this.db.course.findFirst({ where: { id } });

      if (existing) {
        courseMap[c.code] = existing.id;
        result.courses.already_exists++;
      } else {
        const rec = await this.db.course.create({
          data: {
            id,
            org_id: orgId,
            school_year_id: schoolYearId,
            program_id: programMap['college'],
            name: c.name,
            code: c.code,
          },
        });
        courseMap[c.code] = rec.id;
        result.courses.seeded++;
      }
    }
  }

  private async seedStrands(
    orgId: string,
    schoolYearId: string,
    shouldSeedP: (k: string) => boolean,
    shouldSeedS: (name: string) => boolean,
    programMap: Record<string, string>,
    strandMap: Record<string, string>,
    result: SeedResult,
  ) {
    if (!shouldSeedP('shs') || !programMap['shs']) return;

    for (const s of SHS_STRAND_DEFS) {
      if (!shouldSeedS(s.name)) {
        result.strands.skipped++;
        continue;
      }

      const id = seedId('strand', s.name, schoolYearId, orgId);
      const existing = await this.db.strand.findFirst({ where: { id } });

      if (existing) {
        strandMap[s.name] = existing.id;
        result.strands.already_exists++;
      } else {
        const rec = await this.db.strand.create({
          data: {
            id,
            org_id: orgId,
            school_year_id: schoolYearId,
            program_id: programMap['shs'],
            name: s.name,
          },
        });
        strandMap[s.name] = rec.id;
        result.strands.seeded++;
      }
    }
  }

  private async seedLevelsAndSections(
    orgId: string,
    schoolYearId: string,
    shouldSeedP: (k: string) => boolean,
    shouldSeedL: (name: string) => boolean,
    programMap: Record<string, string>,
    courseMap: Record<string, string>,
    strandMap: Record<string, string>,
    levelMap: Record<string, string>,
    levelConfigs: Record<string, string[]>,
    sectionConfigs: Record<string, { name: string; capacity: number }[]>,
    result: SeedResult,
  ) {
    const defaultDefs = buildLevelDefs().filter((l) =>
      shouldSeedP(l.programKey),
    );
    const programKeys = [...new Set(defaultDefs.map((l) => l.programKey))];

    for (const progKey of programKeys) {
      const programId = programMap[progKey];
      if (!programId) continue;

      const customNames = levelConfigs[progKey];
      const levelNames = customNames?.length
        ? customNames
        : defaultDefs
            .filter((l) => l.programKey === progKey)
            .map((l) => l.name);

      if (progKey === 'college') {
        // Step 1: Create levels once per program (shared across all courses)
        for (const levelName of levelNames) {
          if (!shouldSeedL(levelName)) {
            result.levels.skipped++;
            continue;
          }

          const id = seedId('level', progKey, levelName, schoolYearId, orgId);
          const existing = await this.db.level.findFirst({ where: { id } });

          let levelId: string;
          if (existing) {
            levelId = existing.id;
            result.levels.already_exists++;
          } else {
            const rec = await this.db.level.create({
              data: {
                id,
                org_id: orgId,
                school_year_id: schoolYearId,
                program_id: programId,
                name: levelName,
              },
            });
            levelId = rec.id;
            result.levels.seeded++;
          }

          levelMap[levelName] = levelId;
          // Also populate scoped keys so subject seeding (courseCode|levelName) still works
          for (const courseCode of Object.keys(courseMap)) {
            levelMap[`${courseCode}|${levelName}`] = levelId;
          }
        }

        // Step 2: Create sections per course × level
        for (const courseCode of Object.keys(courseMap)) {
          const courseId = courseMap[courseCode];
          if (!courseId) continue;

          for (const levelName of levelNames) {
            if (!shouldSeedL(levelName)) continue;

            const levelId = levelMap[levelName];
            if (!levelId) continue;

            const scopedKey = `${courseCode}|${levelName}`;
            const defaultSections = defaultDefs.find(
              (l) => l.programKey === progKey && l.name === levelName,
            )?.sections ?? [
              { name: 'Section A', capacity: 40 },
              { name: 'Section B', capacity: 40 },
            ];
            const sections = sectionConfigs[scopedKey] ?? defaultSections;

            for (const sec of sections) {
              const sectionId = seedId(
                'section',
                progKey,
                courseCode,
                levelName,
                sec.name,
                schoolYearId,
                orgId,
              );
              const existingSec = await this.db.section.findFirst({
                where: { id: sectionId },
              });

              if (existingSec) {
                result.sections.already_exists++;
              } else {
                await this.db.section.create({
                  data: {
                    id: sectionId,
                    org_id: orgId,
                    level_id: levelId,
                    course_id: courseId,
                    school_year_id: schoolYearId,
                    name: sec.name,
                    capacity: sec.capacity,
                  },
                });
                result.sections.seeded++;
              }
            }
          }
        }
      } else if (progKey === 'shs') {
        // Step 1: Create levels once per program (shared across all strands)
        for (const levelName of levelNames) {
          if (!shouldSeedL(levelName)) {
            result.levels.skipped++;
            continue;
          }

          const id = seedId('level', progKey, levelName, schoolYearId, orgId);
          const existing = await this.db.level.findFirst({ where: { id } });

          let levelId: string;
          if (existing) {
            levelId = existing.id;
            result.levels.already_exists++;
          } else {
            const rec = await this.db.level.create({
              data: {
                id,
                org_id: orgId,
                school_year_id: schoolYearId,
                program_id: programId,
                name: levelName,
              },
            });
            levelId = rec.id;
            result.levels.seeded++;
          }

          levelMap[levelName] = levelId;
          // Also populate scoped keys so subject seeding (strandName|levelName) still works
          for (const strandName of Object.keys(strandMap)) {
            levelMap[`${strandName}|${levelName}`] = levelId;
          }
        }

        // Step 2: Create sections per strand × level
        for (const strandName of Object.keys(strandMap)) {
          const strandId = strandMap[strandName];
          if (!strandId) continue;

          for (const levelName of levelNames) {
            if (!shouldSeedL(levelName)) continue;

            const levelId = levelMap[levelName];
            if (!levelId) continue;

            const scopedKey = `${strandName}|${levelName}`;
            const defaultSections = defaultDefs.find(
              (l) => l.programKey === progKey && l.name === levelName,
            )?.sections ?? [
              { name: 'Section A', capacity: 40 },
              { name: 'Section B', capacity: 40 },
            ];
            const sections = sectionConfigs[scopedKey] ?? defaultSections;

            for (const sec of sections) {
              const sectionId = seedId(
                'section',
                progKey,
                strandName,
                levelName,
                sec.name,
                schoolYearId,
                orgId,
              );
              const existingSec = await this.db.section.findFirst({
                where: { id: sectionId },
              });

              if (existingSec) {
                result.sections.already_exists++;
              } else {
                await this.db.section.create({
                  data: {
                    id: sectionId,
                    org_id: orgId,
                    level_id: levelId,
                    strand_id: strandId,
                    school_year_id: schoolYearId,
                    name: sec.name,
                    capacity: sec.capacity,
                  },
                });
                result.sections.seeded++;
              }
            }
          }
        }
      } else {
        for (const levelName of levelNames) {
          if (!shouldSeedL(levelName)) {
            result.levels.skipped++;
            continue;
          }

          const id = seedId('level', progKey, levelName, schoolYearId, orgId);
          const existing = await this.db.level.findFirst({ where: { id } });

          let levelId: string;
          if (existing) {
            levelId = existing.id;
            result.levels.already_exists++;
          } else {
            const rec = await this.db.level.create({
              data: {
                id,
                org_id: orgId,
                school_year_id: schoolYearId,
                program_id: programId,
                name: levelName,
              },
            });
            levelId = rec.id;
            result.levels.seeded++;
          }

          levelMap[levelName] = levelId;

          // No scoping needed for non-college/shs programs
          const defaultSections = defaultDefs.find(
            (l) => l.programKey === progKey && l.name === levelName,
          )?.sections ?? [
            { name: 'Section A', capacity: 40 },
            { name: 'Section B', capacity: 40 },
          ];
          const sections = sectionConfigs[levelName] ?? defaultSections;

          for (const sec of sections) {
            const sectionId = seedId(
              'section',
              progKey,
              levelName,
              sec.name,
              schoolYearId,
              orgId,
            );
            const existingSec = await this.db.section.findFirst({
              where: { id: sectionId },
            });

            if (existingSec) {
              result.sections.already_exists++;
            } else {
              await this.db.section.create({
                data: {
                  id: sectionId,
                  org_id: orgId,
                  level_id: levelId,
                  school_year_id: schoolYearId,
                  name: sec.name,
                  capacity: sec.capacity,
                },
              });
              result.sections.seeded++;
            }
          }
        }
      }
    }
  }

  private async seedGradingScales(
    orgId: string,
    schoolYearId: string,
    shouldSeed: (k: string) => boolean,
    programMap: Record<string, string>,
    gradingScales: Record<string, GradingScaleOption>,
    result: SeedResult,
  ) {
    const assignments =
      Object.keys(gradingScales).length > 0
        ? Object.entries(gradingScales)
            .filter(([progKey]) => shouldSeed(progKey) && programMap[progKey])
            .map(([progKey, scale]) => ({
              programKey: progKey,
              programId: programMap[progKey],
              scaleName: scale.name,
              ranges: scale.ranges as any,
            }))
        : buildScaleAssignments()
            .filter(
              (sa) => shouldSeed(sa.programKey) && programMap[sa.programKey],
            )
            .map((sa) => ({
              programKey: sa.programKey,
              programId: programMap[sa.programKey],
              scaleName: sa.scaleName,
              ranges: sa.ranges,
            }));

    for (const { programKey, programId, scaleName, ranges } of assignments) {
      const id = seedId('scale', programKey, scaleName, schoolYearId, orgId);
      const existing = await this.db.gradingScale.findFirst({ where: { id } });

      if (existing) {
        result.gradingScales.already_exists++;
      } else {
        await this.db.gradingScale.create({
          data: {
            id,
            org_id: orgId,
            school_year_id: schoolYearId,
            program_id: programId,
            name: scaleName,
            ranges,
            is_locked: false,
          },
        });
        result.gradingScales.seeded++;
      }
    }
  }

  private async seedGradingSchemes(
    orgId: string,
    shouldSeed: (k: string) => boolean,
    result: SeedResult,
  ) {
    const schemeProgram: Record<string, string> = {
      'Daycare Scheme': 'daycare',
      'Kindergarten Scheme': 'kinder',
      'Elementary Scheme': 'elementary',
      'High School Scheme': 'jhs',
      'Senior High School Scheme': 'shs',
      'College Scheme': 'college',
    };

    for (const preset of SCHEME_PRESETS) {
      const progKey = schemeProgram[preset.name];
      if (progKey && !shouldSeed(progKey)) {
        result.gradingSchemeTemplates.skipped++;
        continue;
      }

      const id = seedId('scheme-template', preset.name, orgId);
      const existing = await this.db.gradingSchemeTemplate.findFirst({
        where: { id },
      });

      if (existing) {
        result.gradingSchemeTemplates.already_exists++;
        continue;
      }

      const template = await this.db.gradingSchemeTemplate.create({
        data: {
          id,
          org_id: orgId,
          name: preset.name,
          program_type: progKey ?? null,
        },
      });

      await this.db.gradingSchemeTemplateComponent.createMany({
        data: preset.components.map((c) => ({
          id: uuid(),
          org_id: orgId,
          template_id: template.id,
          name: c.name,
          type: c.type,
          weight: c.weight,
          max_score: null,
        })),
      });

      result.gradingSchemeTemplates.seeded++;
    }
  }

  private async seedSemesterTemplates(
    orgId: string,
    shouldSeed: (k: string) => boolean,
    programMap: Record<string, string>,
    result: SeedResult,
    schoolYearId: string,
  ) {
    const schoolYear = await this.db.schoolYear.findFirst({
      where: { id: schoolYearId },
    });

    const syStart = schoolYear?.start_date ?? null;
    const syEnd = schoolYear?.end_date ?? null;
    const hasDates = syStart !== null && syEnd !== null;

    for (const tpl of SEMESTER_TEMPLATES) {
      if (!shouldSeed(tpl.programType)) {
        result.semesterTemplates.skipped++;
        continue;
      }

      const programId = programMap[tpl.programType];
      if (!programId) {
        result.semesterTemplates.skipped++;
        continue;
      }

      const templateId = seedId('sem-template', tpl.programType, orgId);
      const existing = await this.db.semesterTemplate.findFirst({
        where: { id: templateId },
      });

      if (existing) {
        result.semesterTemplates.already_exists++;
        await this.db.programSemesterAssignment.upsert({
          where: { program_id: programId },
          update: {},
          create: {
            id: seedId('sem-assignment', programId, orgId),
            org_id: orgId,
            program_id: programId,
            template_id: existing.id,
          },
        });
        continue;
      }

      const template = await this.db.semesterTemplate.create({
        data: {
          id: templateId,
          org_id: orgId,
          program_type: tpl.programType,
          name: tpl.name,
        },
      });

      const termIds: string[] = [];

      for (const sem of tpl.semesters) {
        const semItemId = seedId('sem-item', tpl.programType, sem.name, orgId);
        const semItem = await this.db.semesterTemplateItem.create({
          data: {
            id: semItemId,
            org_id: orgId,
            template_id: template.id,
            name: sem.name,
            order_index: sem.order_index,
          },
        });

        for (const term of sem.terms) {
          const termId = seedId(
            'sem-term',
            tpl.programType,
            sem.name,
            term.name,
            orgId,
          );
          await this.db.semesterTemplateTerm.create({
            data: {
              id: termId,
              org_id: orgId,
              semester_id: semItem.id,
              name: term.name,
              order_index: term.order_index,
            },
          });
          termIds.push(termId);
        }
      }

      const assignment = await this.db.programSemesterAssignment.create({
        data: {
          id: seedId('sem-assignment', programId, orgId),
          org_id: orgId,
          program_id: programId,
          template_id: template.id,
        },
      });

      const termDateData = hasDates
        ? computeTermDates(syStart!, syEnd!, tpl, termIds).map((td) => ({
            id: seedId('sem-term-date', assignment.id, td.termId),
            org_id: orgId,
            assignment_id: assignment.id,
            term_id: td.termId,
            start_date: td.startDate,
            end_date: td.endDate,
          }))
        : termIds.map((termId) => ({
            id: seedId('sem-term-date', assignment.id, termId),
            org_id: orgId,
            assignment_id: assignment.id,
            term_id: termId,
            start_date: new Date('1970-01-01'),
            end_date: new Date('1970-01-01'),
          }));

      await this.db.programSemesterTermDate.createMany({
        data: termDateData,
        skipDuplicates: true,
      });

      result.semesterTemplates.seeded++;
    }
  }

  private async seedMajorSubjects(
    orgId: string,
    shouldSeedP: (k: string) => boolean,
    shouldSeedSubj: (name: string, levelName?: string) => boolean,
    levelMap: Record<string, string>,
    courseMap: Record<string, string>,
    strandMap: Record<string, string>,
    programMap: Record<string, string>,
    subjectNameToId: Record<string, string>,
    result: SeedResult,
  ) {
    const subjectDefs = allMajorSubjects().filter((s) =>
      shouldSeedP(deriveProgramKey(s.levelName)),
    );

    for (const s of subjectDefs) {
      if (!shouldSeedSubj(s.name, s.levelName)) {
        result.subjects.skipped++;
        continue;
      }

      const progKey = deriveProgramKey(s.levelName);
      const programId = programMap[progKey];
      if (!programId) {
        result.subjects.skipped++;
        continue;
      }

      const levelId = levelMap[s.levelName];
      if (!levelId) {
        result.subjects.skipped++;
        continue;
      }

      const courseId = s.courseCode ? courseMap[s.courseCode] : null;
      const strandId = s.strandName ? strandMap[s.strandName] : null;

      if (s.courseCode && !courseId) {
        result.subjects.skipped++;
        continue;
      }

      if (s.strandName && !strandId) {
        result.subjects.skipped++;
        continue;
      }

      const id = seedId(
        'subject',
        s.levelName,
        s.courseCode ?? 'none',
        s.strandName ?? 'none',
        s.name,
        orgId,
      );
      const existing = await this.db.subject.findFirst({ where: { id } });

      if (existing) {
        subjectNameToId[s.name] = existing.id;
        result.subjects.already_exists++;
      } else {
        const created = await this.db.subject.create({
          data: {
            id,
            org_id: orgId,
            subject_type: 'major',
            program_id: programId,
            level_id: levelId,
            course_id: courseId ?? undefined,
            strand_id: strandId ?? undefined,
            name: s.name,
            year_level: s.yearLevel,
            term_label: s.termLabel,
            is_locked: false,
          },
        });
        subjectNameToId[s.name] = created.id;
        result.subjects.seeded++;
      }
    }
  }

  private async seedMinorSubjects(
    orgId: string,
    shouldSeedP: (k: string) => boolean,
    shouldSeedSubj: (name: string, levelName?: string) => boolean,
    levelMap: Record<string, string>,
    courseMap: Record<string, string>,
    strandMap: Record<string, string>,
    programMap: Record<string, string>,
    subjectNameToId: Record<string, string>,
    result: SeedResult,
  ) {
    if (shouldSeedP('college') && programMap['college']) {
      const collegeMinors = allMinorSubjects().filter(
        (s) => deriveProgramKey(s.levelName) === 'college',
      );

      for (const s of collegeMinors) {
        if (!shouldSeedSubj(s.name)) {
          result.subjects.skipped++;
          continue;
        }

        const id = seedId('subject', 'college_ge', 'minor', s.name, orgId);
        const existing = await this.db.subject.findFirst({ where: { id } });

        let subjectId: string;
        if (existing) {
          subjectId = existing.id;
          result.subjects.already_exists++;
        } else {
          const created = await this.db.subject.create({
            data: {
              id,
              org_id: orgId,
              subject_type: 'minor',
              program_id: programMap['college'],
              level_id: null,
              name: s.name,
              year_level: s.yearLevel,
              term_label: s.termLabel,
              is_locked: false,
            },
          });
          subjectId = created.id;
          result.subjects.seeded++;
        }

        subjectNameToId[s.name] = subjectId;

        for (const [, courseId] of Object.entries(courseMap)) {
          const sharingId = seedId('sharing', subjectId, courseId, orgId);
          await this.db.subjectSharing.upsert({
            where: { id: sharingId },
            update: {},
            create: {
              id: sharingId,
              org_id: orgId,
              subject_id: subjectId,
              course_id: courseId,
              strand_id: null,
              level_id: null,
            },
          });
        }
      }
    }

    if (shouldSeedP('shs') && programMap['shs']) {
      const seenShsMinors = new Map<string, string>();
      const shsMinorDefs = allMajorSubjects().filter(
        (s) => s.isMinor && deriveProgramKey(s.levelName) === 'shs',
      );

      for (const s of shsMinorDefs) {
        if (!shouldSeedSubj(s.name)) {
          result.subjects.skipped++;
          continue;
        }

        const dedupeKey = `${s.name}:${s.yearLevel}`;
        let subjectId: string;

        if (seenShsMinors.has(dedupeKey)) {
          subjectId = seenShsMinors.get(dedupeKey)!;
          result.subjects.already_exists++;
        } else {
          const id = seedId('subject', 'shs_minor', s.yearLevel, s.name, orgId);
          const existing = await this.db.subject.findFirst({ where: { id } });

          if (existing) {
            subjectId = existing.id;
            result.subjects.already_exists++;
          } else {
            const created = await this.db.subject.create({
              data: {
                id,
                org_id: orgId,
                subject_type: 'minor',
                program_id: programMap['shs'],
                level_id: null,
                name: s.name,
                year_level: s.yearLevel,
                term_label: s.termLabel,
                is_locked: false,
              },
            });
            subjectId = created.id;
            result.subjects.seeded++;
          }

          seenShsMinors.set(dedupeKey, subjectId);
          subjectNameToId[s.name] = subjectId;
        }

        if (s.strandName && strandMap[s.strandName]) {
          const strandId = strandMap[s.strandName];
          const sharingId = seedId(
            'sharing',
            subjectId,
            strandId,
            s.yearLevel,
            orgId,
          );
          await this.db.subjectSharing.upsert({
            where: { id: sharingId },
            update: {},
            create: {
              id: sharingId,
              org_id: orgId,
              subject_id: subjectId,
              course_id: null,
              strand_id: strandId,
              level_id: null,
            },
          });
        }
      }
    }
  }

  private async seedPrerequisites(
    orgId: string,
    shouldSeedP: (k: string) => boolean,
    levelMap: Record<string, string>,
    subjectNameToId: Record<string, string>,
  ) {
    const subjectDefs = allSubjects().filter((s) =>
      shouldSeedP(deriveProgramKey(s.levelName)),
    );

    for (const s of subjectDefs) {
      if (s.prereqNames.length === 0) continue;
      if (!s.isMinor && !levelMap[s.levelName]) continue;

      const subjectId = subjectNameToId[s.name];
      if (!subjectId) continue;

      for (const prereqName of s.prereqNames) {
        const cleanName = prereqName.replace(/\s*\(.*?\)\s*$/, '').trim();
        const prereqId = subjectNameToId[cleanName];
        if (!prereqId) continue;

        await this.db.subjectPrerequisite.upsert({
          where: {
            subject_id_prerequisite_id: {
              subject_id: subjectId,
              prerequisite_id: prereqId,
            },
          },
          update: {},
          create: {
            id: uuid(),
            org_id: orgId,
            subject_id: subjectId,
            prerequisite_id: prereqId,
          },
        });
      }
    }
  }
}
