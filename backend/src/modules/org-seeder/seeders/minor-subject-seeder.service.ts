import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { allMajorSubjects, allMinorSubjects, deriveProgramKey } from '../data/subjects';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class MinorSubjectSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    if (ctx.shouldSeedProgram('college') && ctx.programMap['college']) {
      const profile = ctx.profileDepartments['college'];
      if (profile) {
        await this.seedCollegeMinorsFromProfile(ctx, profile);
      } else {
        await this.seedCollegeMinors(ctx);
      }
    }

    if (ctx.shouldSeedProgram('shs') && ctx.programMap['shs']) {
      const profile = ctx.profileDepartments['shs'];
      if (profile) {
        await this.seedShsMinorsFromProfile(ctx, profile);
      } else {
        await this.seedShsMinors(ctx);
      }
    }
  }

  private async seedCollegeMinorsFromProfile(
    ctx: SeedContext,
    profile: NonNullable<SeedContext['profileDepartments'][string]>,
  ): Promise<void> {
    const minors = profile.subjects.filter((s) => s.subjectType === 'minor');
    const courseCodes = Object.keys(ctx.courseMap);

    for (const s of minors) {
      const excludedFromAll =
        courseCodes.length > 0 && courseCodes.every((code) => ctx.excludedLevelSubjects[code]?.includes(s.name));
      if (excludedFromAll) {
        ctx.result.subjects.skipped++;
        continue;
      }

      // No specific level to anchor a department-level minor subject to —
      // use the first course's first level as a stand-in, matching the
      // static path's existing "firstCourseCode" convention.
      const firstCourse = profile.courses[0];
      const levelId = firstCourse ? ctx.levelMap[`${firstCourse.code ?? firstCourse.name}|${firstCourse.levels[0]?.name}`] : null;
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const id = seedId('subject', 'college_ge', 'minor', s.name, ctx.orgId);
      const existing = await this.db.subject.findFirst({ where: { id } });

      let subjectId: string;
      if (existing) {
        subjectId = existing.id;
        ctx.result.subjects.already_exists++;
      } else {
        const created = await this.db.subject.create({
          data: {
            id,
            org_id: ctx.orgId,
            subject_type: 'minor',
            program_id: ctx.programMap['college'],
            level_id: levelId,
            name: s.name,
            year_level: null,
            term_label: null,
            is_locked: false,
          },
        });
        subjectId = created.id;
        ctx.result.subjects.seeded++;
      }

      ctx.subjectNameToId[s.name] = subjectId;

      for (const [code, courseId] of Object.entries(ctx.courseMap)) {
        if (ctx.excludedLevelSubjects[code]?.includes(s.name)) continue;
        const sharingId = seedId('sharing', subjectId, courseId, ctx.orgId);
        await this.db.subjectSharing.upsert({
          where: { id: sharingId },
          update: {},
          create: { id: sharingId, org_id: ctx.orgId, subject_id: subjectId, course_id: courseId, strand_id: null, level_id: null },
        });
      }
    }
  }

  private async seedShsMinorsFromProfile(
    ctx: SeedContext,
    profile: NonNullable<SeedContext['profileDepartments'][string]>,
  ): Promise<void> {
    const minors = profile.subjects.filter((s) => s.subjectType === 'minor');

    for (const s of minors) {
      const strandCodes = Object.keys(ctx.strandMap);
      const firstStrand = profile.strands[0];
      const levelId = firstStrand ? ctx.levelMap[`${firstStrand.name}|${firstStrand.levels[0]?.name}`] : null;
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const id = seedId('subject', 'shs_minor', 'profile', s.name, ctx.orgId);
      const existing = await this.db.subject.findFirst({ where: { id } });

      let subjectId: string;
      if (existing) {
        subjectId = existing.id;
        ctx.result.subjects.already_exists++;
      } else {
        const created = await this.db.subject.create({
          data: {
            id,
            org_id: ctx.orgId,
            subject_type: 'minor',
            program_id: ctx.programMap['shs'],
            level_id: levelId,
            name: s.name,
            year_level: null,
            term_label: null,
            is_locked: false,
          },
        });
        subjectId = created.id;
        ctx.result.subjects.seeded++;
      }

      ctx.subjectNameToId[s.name] = subjectId;

      for (const strandName of strandCodes) {
        if (ctx.excludedLevelSubjects[strandName]?.includes(s.name)) continue;
        const strandId = ctx.strandMap[strandName];
        const sharingId = seedId('sharing', subjectId, strandId, 'profile', ctx.orgId);
        await this.db.subjectSharing.upsert({
          where: { id: sharingId },
          update: {},
          create: { id: sharingId, org_id: ctx.orgId, subject_id: subjectId, course_id: null, strand_id: strandId, level_id: null },
        });
      }
    }
  }

  private async seedCollegeMinors(ctx: SeedContext): Promise<void> {
    const collegeMinors = allMinorSubjects().filter(
      (s) => deriveProgramKey(s.levelName) === 'college',
    );

    for (const s of collegeMinors) {
      const courseCodes = Object.keys(ctx.courseMap);
      const excludedFromAllCourses =
        courseCodes.length > 0
          ? courseCodes.every((code) =>
              ctx.excludedLevelSubjects[code]?.includes(s.name),
            )
          : false;

      if (excludedFromAllCourses) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const firstCourseCode = Object.keys(ctx.courseMap)[0];
      const levelId =
        s.yearLevel && firstCourseCode
          ? ctx.levelMap[`${firstCourseCode}|${s.yearLevel}`]
          : null;
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const id = seedId('subject', 'college_ge', 'minor', s.name, ctx.orgId);
      const existing = await this.db.subject.findFirst({ where: { id } });

      let subjectId: string;
      if (existing) {
        subjectId = existing.id;
        ctx.result.subjects.already_exists++;
      } else {
        const created = await this.db.subject.create({
          data: {
            id,
            org_id: ctx.orgId,
            subject_type: 'minor',
            program_id: ctx.programMap['college'],
            level_id: levelId,
            name: s.name,
            year_level: s.yearLevel,
            term_label: s.termLabel,
            is_locked: false,
          },
        });
        subjectId = created.id;
        ctx.result.subjects.seeded++;
      }

      ctx.subjectNameToId[s.name] = subjectId;

      for (const [code, courseId] of Object.entries(ctx.courseMap)) {
        const isExcluded = ctx.excludedLevelSubjects[code]?.includes(s.name);
        if (isExcluded) continue;

        const sharingId = seedId('sharing', subjectId, courseId, ctx.orgId);
        await this.db.subjectSharing.upsert({
          where: { id: sharingId },
          update: {},
          create: {
            id: sharingId,
            org_id: ctx.orgId,
            subject_id: subjectId,
            course_id: courseId,
            strand_id: null,
            level_id: null,
          },
        });
      }
    }
  }

  private async seedShsMinors(ctx: SeedContext): Promise<void> {
    const shsMinorDefs = allMajorSubjects().filter(
      (s) => s.isMinor && deriveProgramKey(s.levelName) === 'shs',
    );

    // Pre‑compute which dedupeKeys have at least one strand that selected them
    const strandSelections = new Map<string, Set<string>>();
    for (const s of shsMinorDefs) {
      const dedupeKey = `${s.name}:${s.yearLevel}`;
      if (!strandSelections.has(dedupeKey)) {
        strandSelections.set(dedupeKey, new Set());
      }
      if (s.strandName && ctx.strandMap[s.strandName]) {
        const isExcluded = ctx.excludedLevelSubjects[s.strandName]?.includes(
          s.name,
        );
        if (!isExcluded) {
          strandSelections.get(dedupeKey)!.add(s.strandName);
        }
      }
    }

    const seenShsMinors = new Map<string, string>();

    for (const s of shsMinorDefs) {
      const dedupeKey = `${s.name}:${s.yearLevel}`;
      const selectedStrands = strandSelections.get(dedupeKey);
      if (!selectedStrands || selectedStrands.size === 0) {
        ctx.result.subjects.skipped++;
        continue;
      }

      let subjectId: string;

      if (seenShsMinors.has(dedupeKey)) {
        subjectId = seenShsMinors.get(dedupeKey)!;
        ctx.result.subjects.already_exists++;
      } else {
        const firstStrandName = Object.keys(ctx.strandMap)[0];
        const levelId =
          s.levelName && firstStrandName
            ? ctx.levelMap[`${firstStrandName}|${s.levelName}`]
            : null;
        if (!levelId) {
          ctx.result.subjects.skipped++;
          continue;
        }

        const id = seedId(
          'subject',
          'shs_minor',
          s.yearLevel,
          s.name,
          ctx.orgId,
        );
        const existing = await this.db.subject.findFirst({ where: { id } });

        if (existing) {
          subjectId = existing.id;
          ctx.result.subjects.already_exists++;
        } else {
          const created = await this.db.subject.create({
            data: {
              id,
              org_id: ctx.orgId,
              subject_type: 'minor',
              program_id: ctx.programMap['shs'],
              level_id: levelId,
              name: s.name,
              year_level: s.yearLevel,
              term_label: s.termLabel,
              is_locked: false,
            },
          });
          subjectId = created.id;
          ctx.result.subjects.seeded++;
        }

        seenShsMinors.set(dedupeKey, subjectId);
        ctx.subjectNameToId[s.name] = subjectId;
      }

      if (
        s.strandName &&
        ctx.strandMap[s.strandName] &&
        selectedStrands.has(s.strandName)
      ) {
        const strandId = ctx.strandMap[s.strandName];
        const sharingId = seedId(
          'sharing',
          subjectId,
          strandId,
          s.yearLevel,
          ctx.orgId,
        );
        await this.db.subjectSharing.upsert({
          where: { id: sharingId },
          update: {},
          create: {
            id: sharingId,
            org_id: ctx.orgId,
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
