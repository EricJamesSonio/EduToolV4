/**
 * classes.seeder.ts
 *
 * Deterministic pass: for every level, pair each of its subjects with each
 * of its sections (cycling the shorter list) so every subject AND every
 * section under that level ends up with at least one class — satisfying
 * both the "subject has classes" and "section has classes" readiness
 * requirements without a full N×M combinatorial blow-up. Each new class
 * also gets a grading scheme copied from that program's grading scheme
 * template, satisfying "class has a grading scheme."
 */

import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { PROGRAM_SCHEME_PRESET_NAME } from '../constants';
import { randInt } from '../utils/random.util';
import {
  UsedMap,
  allocateScheduleSlot,
  scheduleDate,
  scheduleKey,
  timeOnly,
  usedAdd,
} from '../utils/schedule.util';

export async function seedClasses(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
  subjectIds: string[],
  educatorIds: string[],
  levelMap: Record<string, string>,
): Promise<void> {
  if (educatorIds.length === 0 || subjectIds.length === 0) return;
  const sy = await db.schoolYear.findUnique({ where: { id: schoolYearId }, select: { start_date: true, end_date: true } });
  const syStart = sy?.start_date ?? new Date();
  const syEnd = sy?.end_date ?? new Date(syStart.getTime() + 365 * 24 * 60 * 60 * 1000);

  // Get semester IDs for each program
  const semesterMap: Record<string, string> = {};
  for (const progKey of programKeys) {
    const programId = programMap[progKey];
    if (!programId) continue;

    const assignment = await db.programSemesterAssignment.findFirst({
      where: { program_id: programId },
      include: { template: { include: { semesters: true } } },
    });
    if (!assignment) continue;

    const firstSem = assignment.template.semesters.find(
      (s) => s.order_index === 0,
    );
    if (!firstSem) continue;

    const semesterId = seedId(
      'semester',
      progKey,
      'Sem 1',
      schoolYearId,
      orgId,
    );
    const existingSem = await db.semester.findFirst({
      where: { id: semesterId },
    });
    if (!existingSem) {
      await db.semester.create({
        data: {
          id: semesterId,
          org_id: orgId,
          school_year_id: schoolYearId,
          name: firstSem.name,
          start_date: syStart,
          end_date: new Date(
            syStart.getTime() + (syEnd.getTime() - syStart.getTime()) / 2,
          ),
        },
      });
    }
    semesterMap[progKey] = semesterId;
  }

  // Reverse map: programId -> progKey, so a Level record can tell us which
  // program config it belongs to.
  const programIdToKey: Record<string, string> = {};
  for (const [key, id] of Object.entries(programMap)) programIdToKey[id] = key;

  // Grading scheme template cache, keyed by progKey, loaded lazily.
  const schemeTemplateCache = new Map<
    string,
    {
      templateId: string;
      components: {
        name: string;
        type: string;
        weight: number;
        max_score: number | null;
      }[];
    } | null
  >();

  async function getSchemeTemplateForProgKey(progKey: string) {
    if (schemeTemplateCache.has(progKey))
      return schemeTemplateCache.get(progKey)!;

    const presetName = PROGRAM_SCHEME_PRESET_NAME[progKey];
    if (!presetName) {
      schemeTemplateCache.set(progKey, null);
      return null;
    }

    const templateId = seedId('scheme-template', presetName, orgId);
    const template = await db.gradingSchemeTemplate.findFirst({
      where: { id: templateId },
      include: { components: true },
    });
    if (!template) {
      schemeTemplateCache.set(progKey, null);
      return null;
    }

    const result = {
      templateId: template.id,
      components: template.components.map((c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        max_score: c.max_score,
      })),
    };
    schemeTemplateCache.set(progKey, result);
    return result;
  }

  async function ensureClassGradingScheme(
    classId: string,
    progKey: string,
  ): Promise<void> {
    const tpl = await getSchemeTemplateForProgKey(progKey);
    if (!tpl) return;

    const existing = await db.gradingScheme.findFirst({
      where: { class_id: classId, org_id: orgId },
    });
    if (existing) return;

    const scheme = await db.gradingScheme.create({
      data: {
        id: uuid(),
        org_id: orgId,
        class_id: classId,
        template_id: tpl.templateId,
        name: 'Default Grading Scheme',
        is_default: true,
      },
    });

    await db.gradingSchemeComponent.createMany({
      data: tpl.components.map((c) => ({
        id: uuid(),
        org_id: orgId,
        grading_scheme_id: scheme.id,
        name: c.name,
        type: c.type,
        weight: c.weight,
        max_score: c.max_score,
        is_optional: false,
      })),
    });
  }

  // Pre-load already-seeded classes so re-runs never double-book an educator or
  // section (keeps the seed conflict-free and idempotent).
  const educatorUsed: UsedMap = new Map();
  const sectionUsed: UsedMap = new Map();
  const existingClasses = await db.class.findMany({
    where: { org_id: orgId, school_year_id: schoolYearId, deleted_at: null },
    include: { schedules: true },
  });
  for (const cls of existingClasses) {
    for (const s of cls.schedules) {
      const key = scheduleKey(
        s.weekday,
        timeOnly(s.start_time),
        timeOnly(s.end_time),
      );
      usedAdd(educatorUsed, cls.educator_id, key);
      if (cls.section_id) usedAdd(sectionUsed, cls.section_id, key);
    }
  }

  const uniqueLevelIds = [...new Set(Object.values(levelMap))];
  const levels = await db.level.findMany({
    where: {
      id: { in: uniqueLevelIds },
      org_id: orgId,
      school_year_id: schoolYearId,
    },
    select: { id: true, name: true, program_id: true },
  });

  const allSubjects = await db.subject.findMany({
    where: { id: { in: subjectIds }, org_id: orgId },
  });

  for (const level of levels) {
    const progKey = programIdToKey[level.program_id];
    if (!progKey || !programKeys.includes(progKey)) continue;

    const semesterId = semesterMap[progKey];
    if (!semesterId) continue;

    const levelSubjects = allSubjects.filter((s) => s.level_id === level.id);
    const levelSections = await db.section.findMany({
      where: {
        level_id: level.id,
        org_id: orgId,
        school_year_id: schoolYearId,
        deleted_at: null,
      },
    });

    if (levelSubjects.length === 0 || levelSections.length === 0) {
      console.warn(
        `  ⚠ Level "${level.name}" has ${levelSubjects.length} subject(s) and ${levelSections.length} section(s); cannot seed classes for it.`,
      );
      continue;
    }

    const pairCount = Math.max(levelSubjects.length, levelSections.length);
    for (let i = 0; i < pairCount; i++) {
      const subject = levelSubjects[i % levelSubjects.length];
      const section = levelSections[i % levelSections.length];

      const classId = seedId(
        'class',
        progKey,
        level.id,
        subject.id,
        section.id,
        schoolYearId,
        orgId,
      );
      const existingClass = await db.class.findFirst({
        where: { id: classId },
      });
      if (existingClass) {
        await ensureClassGradingScheme(existingClass.id, progKey);
        continue;
      }

      const allocation = allocateScheduleSlot(
        educatorIds,
        section.id,
        educatorUsed,
        sectionUsed,
      );
      if (!allocation) {
        console.warn(
          `  ⚠ No free schedule slot left for class ${classId}; skipping.`,
        );
        continue;
      }
      const { educator, slot } = allocation;

      const created = await db.class.create({
        data: {
          id: classId,
          org_id: orgId,
          subject_id: subject.id,
          educator_id: educator,
          section_id: section.id,
          school_year_id: schoolYearId,
          semester_id: semesterId,
          capacity: randInt(30, 50),
          schedules: {
            create: [
              {
                id: uuid(),
                org_id: orgId,
                weekday: slot.weekday,
                start_time: scheduleDate(slot.start, syStart),
                end_time: scheduleDate(slot.end, syStart),
              },
            ],
          },
        },
      });

      usedAdd(educatorUsed, educator, slot.key);
      usedAdd(sectionUsed, section.id, slot.key);

      await ensureClassGradingScheme(created.id, progKey);
    }
  }
}
