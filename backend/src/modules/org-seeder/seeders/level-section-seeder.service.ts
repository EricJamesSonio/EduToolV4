import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { buildLevelDefs } from '../data/levels.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class LevelSectionSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const defaultDefs = buildLevelDefs().filter((l) =>
      ctx.shouldSeedProgram(l.programKey),
    );
    const programKeys = [...new Set(defaultDefs.map((l) => l.programKey))];

    for (const progKey of programKeys) {
      const programId = ctx.programMap[progKey];
      if (!programId) continue;

      const customNames = ctx.levelConfigs[progKey];
      const levelNames = customNames?.length
        ? customNames
        : defaultDefs
            .filter((l) => l.programKey === progKey)
            .map((l) => l.name);

      if (progKey === 'college') {
        await this.seedCollegeLevelsSections(ctx, progKey, programId, defaultDefs, levelNames);
      } else if (progKey === 'shs') {
        await this.seedShsLevelsSections(ctx, progKey, programId, defaultDefs, levelNames);
      } else {
        await this.seedOtherLevelsSections(ctx, progKey, programId, defaultDefs, levelNames);
      }
    }
  }

  private async seedCollegeLevelsSections(
    ctx: SeedContext,
    progKey: string,
    programId: string,
    defaultDefs: { programKey: string; courseCode?: string; name: string; sections?: { name: string; capacity: number }[] }[],
    customNames: string[],
  ) {
    for (const courseCode of Object.keys(ctx.courseMap)) {
      const courseId = ctx.courseMap[courseCode];
      if (!courseId) continue;

      const courseCustom = ctx.levelConfigs[courseCode];
      const courseLevelNames = courseCustom?.length
        ? courseCustom
        : customNames?.length
          ? customNames
          : defaultDefs
              .filter((l) => l.programKey === progKey && l.courseCode === courseCode)
              .map((l) => l.name);

      for (const levelName of courseLevelNames) {
        if (!ctx.shouldSeedLevel(levelName)) {
          ctx.result.levels.skipped++;
          continue;
        }

        const id = seedId('level', progKey, courseCode, levelName, ctx.schoolYearId, ctx.orgId);
        const existing = await this.db.level.findFirst({ where: { id } });

        let levelId: string;
        if (existing) {
          levelId = existing.id;
          ctx.result.levels.already_exists++;
        } else {
          const rec = await this.db.level.create({
            data: {
              id,
              org_id: ctx.orgId,
              school_year_id: ctx.schoolYearId,
              program_id: programId,
              course_id: courseId,
              name: levelName,
            },
          });
          levelId = rec.id;
          ctx.result.levels.seeded++;
        }

        ctx.levelMap[`${courseCode}|${levelName}`] = levelId;

        const defaultSections = defaultDefs.find(
          (l) => l.programKey === progKey && l.courseCode === courseCode && l.name === levelName,
        )?.sections ?? [
          { name: 'Section A', capacity: 40 },
          { name: 'Section B', capacity: 40 },
        ];
        const sections = ctx.sectionConfigs[`${courseCode}|${levelName}`] ?? defaultSections;

        for (const sec of sections) {
          const sectionId = seedId('section', progKey, courseCode, levelName, sec.name, ctx.schoolYearId, ctx.orgId);
          const existingSec = await this.db.section.findFirst({ where: { id: sectionId } });

          if (existingSec) {
            ctx.result.sections.already_exists++;
          } else {
            await this.db.section.create({
              data: {
                id: sectionId,
                org_id: ctx.orgId,
                level_id: levelId,
                course_id: courseId,
                school_year_id: ctx.schoolYearId,
                name: sec.name,
                capacity: sec.capacity,
              },
            });
            ctx.result.sections.seeded++;
          }
        }
      }
    }
  }

  private async seedShsLevelsSections(
    ctx: SeedContext,
    progKey: string,
    programId: string,
    defaultDefs: { programKey: string; name: string; sections?: { name: string; capacity: number }[] }[],
    customNames: string[],
  ) {
    for (const strandName of Object.keys(ctx.strandMap)) {
      const strandId = ctx.strandMap[strandName];
      if (!strandId) continue;

      const strandCustom = ctx.levelConfigs[strandName];
      const strandLevelNames = strandCustom?.length
        ? strandCustom
        : customNames?.length
          ? customNames
          : defaultDefs
              .filter((l) => l.programKey === progKey)
              .map((l) => l.name);

      for (const levelName of strandLevelNames) {
        if (!ctx.shouldSeedLevel(levelName)) {
          ctx.result.levels.skipped++;
          continue;
        }

        const id = seedId('level', progKey, strandName, levelName, ctx.schoolYearId, ctx.orgId);
        const existing = await this.db.level.findFirst({ where: { id } });

        let levelId: string;
        if (existing) {
          levelId = existing.id;
          ctx.result.levels.already_exists++;
        } else {
          const rec = await this.db.level.create({
            data: {
              id,
              org_id: ctx.orgId,
              school_year_id: ctx.schoolYearId,
              program_id: programId,
              strand_id: strandId,
              name: levelName,
            },
          });
          levelId = rec.id;
          ctx.result.levels.seeded++;
        }

        ctx.levelMap[`${strandName}|${levelName}`] = levelId;

        const defaultSections = defaultDefs.find(
          (l) => l.programKey === progKey && l.name === levelName,
        )?.sections ?? [
          { name: 'Section A', capacity: 40 },
          { name: 'Section B', capacity: 40 },
        ];
        const sections = ctx.sectionConfigs[`${strandName}|${levelName}`] ?? defaultSections;

        for (const sec of sections) {
          const sectionId = seedId('section', progKey, strandName, levelName, sec.name, ctx.schoolYearId, ctx.orgId);
          const existingSec = await this.db.section.findFirst({ where: { id: sectionId } });

          if (existingSec) {
            ctx.result.sections.already_exists++;
          } else {
            await this.db.section.create({
              data: {
                id: sectionId,
                org_id: ctx.orgId,
                level_id: levelId,
                strand_id: strandId,
                school_year_id: ctx.schoolYearId,
                name: sec.name,
                capacity: sec.capacity,
              },
            });
            ctx.result.sections.seeded++;
          }
        }
      }
    }
  }

  private async seedOtherLevelsSections(
    ctx: SeedContext,
    progKey: string,
    programId: string,
    defaultDefs: { programKey: string; name: string; sections?: { name: string; capacity: number }[] }[],
    levelNames: string[],
  ) {
    for (const levelName of levelNames) {
      if (!ctx.shouldSeedLevel(levelName)) {
        ctx.result.levels.skipped++;
        continue;
      }

      const id = seedId('level', progKey, levelName, ctx.schoolYearId, ctx.orgId);
      const existing = await this.db.level.findFirst({ where: { id } });

      let levelId: string;
      if (existing) {
        levelId = existing.id;
        ctx.result.levels.already_exists++;
      } else {
        const rec = await this.db.level.create({
          data: {
            id,
            org_id: ctx.orgId,
            school_year_id: ctx.schoolYearId,
            program_id: programId,
            name: levelName,
          },
        });
        levelId = rec.id;
        ctx.result.levels.seeded++;
      }

      ctx.levelMap[levelName] = levelId;

      const defaultSections = defaultDefs.find(
        (l) => l.programKey === progKey && l.name === levelName,
      )?.sections ?? [
        { name: 'Section A', capacity: 40 },
        { name: 'Section B', capacity: 40 },
      ];
      const sections = ctx.sectionConfigs[levelName] ?? defaultSections;

      for (const sec of sections) {
        const sectionId = seedId('section', progKey, levelName, sec.name, ctx.schoolYearId, ctx.orgId);
        const existingSec = await this.db.section.findFirst({ where: { id: sectionId } });

        if (existingSec) {
          ctx.result.sections.already_exists++;
        } else {
          await this.db.section.create({
            data: {
              id: sectionId,
              org_id: ctx.orgId,
              level_id: levelId,
              school_year_id: ctx.schoolYearId,
              name: sec.name,
              capacity: sec.capacity,
            },
          });
          ctx.result.sections.seeded++;
        }
      }
    }
  }
}
