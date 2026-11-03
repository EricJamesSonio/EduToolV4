import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { buildLevelDefs, type LevelDef } from '../data/levels.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

interface SectionPlan {
  id: string;
  name: string;
  capacity: number;
}

interface LevelPlan {
  id: string;
  mapKey: string;
  name: string;
  courseId: string | null;
  strandId: string | null;
  sections: SectionPlan[];
}

type SectionDef = { name: string; capacity: number };

const FALLBACK_SECTIONS: SectionDef[] = [
  { name: 'A', capacity: 40 },
  { name: 'B', capacity: 40 },
];

const PROGRAM_KEYS = ['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college'];

function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

@Injectable()
export class LevelSectionSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const keys = PROGRAM_KEYS.filter(
      (key) => ctx.shouldSeedProgram(key) && ctx.programMap[key],
    );
    await Promise.all(keys.map((progKey) => this.seedProgram(ctx, progKey)));
  }

  private async seedProgram(ctx: SeedContext, progKey: string): Promise<void> {
    const programId = ctx.programMap[progKey];
    const profile = ctx.profileDepartments[progKey];

    const defaultDefs: LevelDef[] = profile
      ? this.levelDefsFromProfile(profile, progKey)
      : buildLevelDefs().filter((l) => l.programKey === progKey);

    const customNames = ctx.levelConfigs[progKey];
    const levelNames = customNames?.length
      ? customNames
      : defaultDefs.filter((l) => l.programKey === progKey).map((l) => l.name);

    const planned =
      progKey === 'college'
        ? this.planCollege(ctx, progKey, defaultDefs, levelNames)
        : progKey === 'shs'
          ? this.planShs(ctx, progKey, defaultDefs, levelNames)
          : this.planOther(ctx, progKey, defaultDefs, levelNames);

    await this.persist(ctx, programId, planned);
  }

  private levelDefsFromProfile(
    profile: SeedContext['profileDepartments'][string],
    progKey: string,
  ): LevelDef[] {
    if (!profile) return [];
    const defs: LevelDef[] = [];

    for (const course of profile.courses) {
      for (const level of course.levels) {
        defs.push({
          programKey: progKey,
          courseCode: course.code ?? course.name,
          name: level.name,
          sections: level.sections.map((s) => ({ name: s.name, capacity: s.capacity })),
        });
      }
    }

    for (const strand of profile.strands) {
      for (const level of strand.levels) {
        defs.push({
          programKey: progKey,
          strandCode: strand.name,
          name: level.name,
          sections: level.sections.map((s) => ({ name: s.name, capacity: s.capacity })),
        });
      }
    }

    for (const level of profile.levels) {
      defs.push({
        programKey: progKey,
        name: level.name,
        sections: level.sections.map((s) => ({ name: s.name, capacity: s.capacity })),
      });
    }

    return defs;
  }

  private planCollege(
    ctx: SeedContext,
    progKey: string,
    defaultDefs: LevelDef[],
    customNames: string[],
  ): LevelPlan[] {
    const out: LevelPlan[] = [];

    for (const courseCode of Object.keys(ctx.courseMap)) {
      const courseId = ctx.courseMap[courseCode];
      if (!courseId) continue;

      const courseCustom = ctx.levelConfigs[courseCode];
      const courseLevelNames = uniq(
        courseCustom?.length
          ? courseCustom
          : customNames?.length
            ? customNames
            : defaultDefs
                .filter(
                  (l) => l.programKey === progKey && l.courseCode === courseCode,
                )
                .map((l) => l.name),
      );

      for (const levelName of courseLevelNames) {
        if (!ctx.shouldSeedLevel(levelName)) {
          ctx.result.levels.skipped++;
          continue;
        }

        const defaultSections =
          defaultDefs.find(
            (l) =>
              l.programKey === progKey &&
              l.courseCode === courseCode &&
              l.name === levelName,
          )?.sections ?? FALLBACK_SECTIONS;
        const sections =
          ctx.sectionConfigs[`${courseCode}|${levelName}`] ?? defaultSections;

        out.push({
          id: seedId('level', progKey, courseCode, levelName, ctx.schoolYearId, ctx.orgId),
          mapKey: `${courseCode}|${levelName}`,
          name: levelName,
          courseId,
          strandId: null,
          sections: sections.map((sec) => ({
            id: seedId(
              'section',
              progKey,
              courseCode,
              levelName,
              sec.name,
              ctx.schoolYearId,
              ctx.orgId,
            ),
            name: sec.name,
            capacity: sec.capacity,
          })),
        });
      }
    }

    return out;
  }

  private planShs(
    ctx: SeedContext,
    progKey: string,
    defaultDefs: LevelDef[],
    customNames: string[],
  ): LevelPlan[] {
    const out: LevelPlan[] = [];

    for (const strandName of Object.keys(ctx.strandMap)) {
      const strandId = ctx.strandMap[strandName];
      if (!strandId) continue;

      const strandCustom = ctx.levelConfigs[strandName];
      const strandLevelNames = uniq(
        strandCustom?.length
          ? strandCustom
          : customNames?.length
            ? customNames
            : defaultDefs.filter((l) => l.programKey === progKey).map((l) => l.name),
      );

      for (const levelName of strandLevelNames) {
        if (!ctx.shouldSeedLevel(levelName)) {
          ctx.result.levels.skipped++;
          continue;
        }

        const defaultSections =
          defaultDefs.find(
            (l) => l.programKey === progKey && l.name === levelName,
          )?.sections ?? FALLBACK_SECTIONS;
        const sections =
          ctx.sectionConfigs[`${strandName}|${levelName}`] ?? defaultSections;

        out.push({
          id: seedId('level', progKey, strandName, levelName, ctx.schoolYearId, ctx.orgId),
          mapKey: `${strandName}|${levelName}`,
          name: levelName,
          courseId: null,
          strandId,
          sections: sections.map((sec) => ({
            id: seedId(
              'section',
              progKey,
              strandName,
              levelName,
              sec.name,
              ctx.schoolYearId,
              ctx.orgId,
            ),
            name: sec.name,
            capacity: sec.capacity,
          })),
        });
      }
    }

    return out;
  }

  private planOther(
    ctx: SeedContext,
    progKey: string,
    defaultDefs: LevelDef[],
    levelNames: string[],
  ): LevelPlan[] {
    const out: LevelPlan[] = [];

    for (const levelName of uniq(levelNames)) {
      if (!ctx.shouldSeedLevel(levelName)) {
        ctx.result.levels.skipped++;
        continue;
      }

      const defaultSections =
        defaultDefs.find((l) => l.programKey === progKey && l.name === levelName)
          ?.sections ?? FALLBACK_SECTIONS;
      const sections = ctx.sectionConfigs[levelName] ?? defaultSections;

      out.push({
        id: seedId('level', progKey, levelName, ctx.schoolYearId, ctx.orgId),
        mapKey: levelName,
        name: levelName,
        courseId: null,
        strandId: null,
        sections: sections.map((sec) => ({
          id: seedId(
            'section',
            progKey,
            levelName,
            sec.name,
            ctx.schoolYearId,
            ctx.orgId,
          ),
          name: sec.name,
          capacity: sec.capacity,
        })),
      });
    }

    return out;
  }

  /**
   * Writes a whole department in two round trips per table (one read of what
   * already exists, one batch insert) instead of a read + write per row.
   * An archived row found by id is restored rather than duplicated.
   */
  private async persist(
    ctx: SeedContext,
    programId: string,
    planned: LevelPlan[],
  ): Promise<void> {
    if (planned.length === 0) return;

    const levelById = new Map<string, LevelPlan>();
    for (const plan of planned) {
      ctx.levelMap[plan.mapKey] = plan.id;
      if (levelById.has(plan.id)) {
        ctx.result.levels.already_exists++;
      } else {
        levelById.set(plan.id, plan);
      }
    }

    const existingLevels = await this.db.level.findMany({
      where: { id: { in: Array.from(levelById.keys()) } },
      select: { id: true, deleted_at: true },
    });
    const levelState = new Map(existingLevels.map((l) => [l.id, l.deleted_at]));

    const levelsToCreate: LevelPlan[] = [];
    const levelsToRestore: string[] = [];
    for (const plan of levelById.values()) {
      if (!levelState.has(plan.id)) {
        levelsToCreate.push(plan);
      } else if (levelState.get(plan.id)) {
        levelsToRestore.push(plan.id);
      } else {
        ctx.result.levels.already_exists++;
      }
    }

    const levelWrites: Promise<unknown>[] = [];
    if (levelsToCreate.length > 0) {
      levelWrites.push(
        this.db.level.createMany({
          data: levelsToCreate.map((plan) => ({
            id: plan.id,
            org_id: ctx.orgId,
            school_year_id: ctx.schoolYearId,
            program_id: programId,
            course_id: plan.courseId,
            strand_id: plan.strandId,
            name: plan.name,
          })),
          skipDuplicates: true,
        }),
      );
    }
    if (levelsToRestore.length > 0) {
      levelWrites.push(
        this.db.level.updateMany({
          where: { id: { in: levelsToRestore } },
          data: { deleted_at: null },
        }),
      );
    }
    await Promise.all(levelWrites);
    ctx.result.levels.seeded += levelsToCreate.length + levelsToRestore.length;

    // Sections (levels must exist first because of the foreign key).
    const sectionById = new Map<
      string,
      { plan: LevelPlan; section: SectionPlan }
    >();
    for (const plan of levelById.values()) {
      for (const section of plan.sections) {
        if (sectionById.has(section.id)) {
          ctx.result.sections.already_exists++;
        } else {
          sectionById.set(section.id, { plan, section });
        }
      }
    }
    if (sectionById.size === 0) return;

    const existingSections = await this.db.section.findMany({
      where: { id: { in: Array.from(sectionById.keys()) } },
      select: { id: true, deleted_at: true },
    });
    const sectionState = new Map(
      existingSections.map((s) => [s.id, s.deleted_at]),
    );

    const sectionsToCreate: { plan: LevelPlan; section: SectionPlan }[] = [];
    const sectionsToRestore: string[] = [];
    for (const entry of sectionById.values()) {
      if (!sectionState.has(entry.section.id)) {
        sectionsToCreate.push(entry);
      } else if (sectionState.get(entry.section.id)) {
        sectionsToRestore.push(entry.section.id);
      } else {
        ctx.result.sections.already_exists++;
      }
    }

    const sectionWrites: Promise<unknown>[] = [];
    if (sectionsToCreate.length > 0) {
      sectionWrites.push(
        this.db.section.createMany({
          data: sectionsToCreate.map(({ plan, section }) => ({
            id: section.id,
            org_id: ctx.orgId,
            level_id: plan.id,
            course_id: plan.courseId,
            strand_id: plan.strandId,
            school_year_id: ctx.schoolYearId,
            name: section.name,
            capacity: section.capacity,
          })),
          skipDuplicates: true,
        }),
      );
    }
    if (sectionsToRestore.length > 0) {
      sectionWrites.push(
        this.db.section.updateMany({
          where: { id: { in: sectionsToRestore } },
          data: { deleted_at: null },
        }),
      );
    }
    await Promise.all(sectionWrites);
    ctx.result.sections.seeded +=
      sectionsToCreate.length + sectionsToRestore.length;
  }
}