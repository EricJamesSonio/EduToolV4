import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import {
  allMajorSubjects,
  allMinorSubjects,
  deriveProgramKey,
} from '../data/subjects';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';
import { findExistingSubject } from '../utils/find-existing-subject.util';

const COLLEGE_MINOR_SCOPE = 'shared:college';
const SHS_MINOR_SCOPE = 'shared:shs';

interface MinorTarget {
  courseId: string | null;
  strandId: string | null;
}

interface MinorRow {
  id: string;
  name: string;
  levelId: string;
  levelName: string | null;
  targets: MinorTarget[];
}

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

  /**
   * Batched write for profile-driven minors: one read of what exists, one
   * insert for new subjects, one insert for their course/strand sharing rows.
   */
  private async persistMinors(
    ctx: SeedContext,
    programId: string,
    rows: MinorRow[],
    scope: string,
    sharingIdOf: (subjectId: string, target: MinorTarget) => string,
  ): Promise<void> {
    if (rows.length === 0) return;

    const unique = new Map<string, MinorRow>();
    for (const row of rows) {
      if (!unique.has(row.id)) unique.set(row.id, row);
    }

    const names = Array.from(new Set(rows.map((r) => r.name)));
    const existing = await this.db.subject.findMany({
      where: {
        org_id: ctx.orgId,
        OR: [
          { id: { in: Array.from(unique.keys()) } },
          { subject_type: 'minor', program_id: programId, name: { in: names } },
        ],
      },
      select: { id: true, name: true },
    });

    const existingIds = new Set(existing.map((e) => e.id));
    const existingByName = new Map<string, string>();
    for (const e of existing) {
      if (!existingByName.has(e.name)) existingByName.set(e.name, e.id);
    }

    const resolved = new Map<string, string>();
    const toCreate: MinorRow[] = [];

    for (const row of unique.values()) {
      // Level-scoped minors only match by their own id; unscoped ones also
      // match an existing minor of the same name.
      const foundId = existingIds.has(row.id)
        ? row.id
        : row.levelName
          ? undefined
          : existingByName.get(row.name);
      if (foundId) {
        resolved.set(row.id, foundId);
        ctx.result.subjects.already_exists++;
      } else {
        resolved.set(row.id, row.id);
        toCreate.push(row);
      }
    }

    if (toCreate.length > 0) {
      await this.db.subject.createMany({
        data: toCreate.map((row) => ({
          id: row.id,
          org_id: ctx.orgId,
          subject_type: 'minor',
          program_id: programId,
          level_id: row.levelId,
          name: row.name,
          year_level: row.levelName,
          term_label: null,
          is_locked: false,
        })),
        skipDuplicates: true,
      });
      ctx.result.subjects.seeded += toCreate.length;
    }

    ctx.result.subjects.already_exists += rows.length - unique.size;

    const sharings = new Map<
      string,
      {
        id: string;
        org_id: string;
        subject_id: string;
        course_id: string | null;
        strand_id: string | null;
        level_id: null;
      }
    >();
    for (const row of unique.values()) {
      const subjectId = resolved.get(row.id);
      if (!subjectId) continue;
      for (const target of row.targets) {
        const id = sharingIdOf(subjectId, target);
        if (sharings.has(id)) continue;
        sharings.set(id, {
          id,
          org_id: ctx.orgId,
          subject_id: subjectId,
          course_id: target.courseId,
          strand_id: target.strandId,
          level_id: null,
        });
      }
    }
    if (sharings.size > 0) {
      await this.db.subjectSharing.createMany({
        data: Array.from(sharings.values()),
        skipDuplicates: true,
      });
    }

    for (const row of rows) {
      const subjectId = resolved.get(row.id);
      if (!subjectId) continue;
      ctx.registerSubjectId(scope, row.name, subjectId, row.levelName ?? undefined);
    }
  }

  private async seedCollegeMinorsFromProfile(
    ctx: SeedContext,
    profile: NonNullable<SeedContext['profileDepartments'][string]>,
  ): Promise<void> {
    const minors = profile.subjects.filter((s) => s.subjectType === 'minor');
    const courseCodes = Object.keys(ctx.courseMap);
    const rows: MinorRow[] = [];

    for (const s of minors) {
      const levelName = s.levelName ?? null;

      const excludedFromAll =
        courseCodes.length > 0 &&
        courseCodes.every((code) =>
          ctx.excludedLevelSubjects[code]?.includes(s.name),
        );
      if (excludedFromAll) {
        ctx.result.subjects.skipped++;
        continue;
      }

      // A level-scoped minor is shared only with the courses that actually
      // have that level; an unscoped (legacy) minor is shared with every course.
      const sharedCodes = courseCodes.filter((code) => {
        if (ctx.excludedLevelSubjects[code]?.includes(s.name)) return false;
        if (levelName && !ctx.levelMap[`${code}|${levelName}`]) return false;
        return true;
      });

      let levelId: string | null | undefined = null;
      if (levelName) {
        const anchor = sharedCodes[0];
        levelId = anchor ? ctx.levelMap[`${anchor}|${levelName}`] : null;
      } else {
        const firstCourse = profile.courses[0];
        levelId = firstCourse
          ? ctx.levelMap[
              `${firstCourse.code ?? firstCourse.name}|${firstCourse.levels[0]?.name}`
            ]
          : null;
      }
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      rows.push({
        id: seedId(
          'subject',
          'college_ge',
          levelName ? `minor:${levelName}` : 'minor',
          s.name,
          ctx.schoolYearId,
          ctx.orgId,
        ),
        name: s.name,
        levelId,
        levelName,
        targets: sharedCodes.map((code) => ({
          courseId: ctx.courseMap[code],
          strandId: null,
        })),
      });
    }

    await this.persistMinors(
      ctx,
      ctx.programMap['college'],
      rows,
      COLLEGE_MINOR_SCOPE,
      (subjectId, target) =>
        seedId('sharing', subjectId, target.courseId as string, ctx.orgId),
    );
  }

  private async seedShsMinorsFromProfile(
    ctx: SeedContext,
    profile: NonNullable<SeedContext['profileDepartments'][string]>,
  ): Promise<void> {
    const minors = profile.subjects.filter((s) => s.subjectType === 'minor');
    const strandNames = Object.keys(ctx.strandMap);
    const rows: MinorRow[] = [];

    for (const s of minors) {
      const levelName = s.levelName ?? null;

      // A level-scoped minor is shared only with the strands that actually
      // have that level; an unscoped (legacy) minor is shared with every strand.
      const sharedStrands = strandNames.filter((strandName) => {
        if (ctx.excludedLevelSubjects[strandName]?.includes(s.name)) {
          return false;
        }
        if (levelName && !ctx.levelMap[`${strandName}|${levelName}`]) {
          return false;
        }
        return true;
      });

      let levelId: string | null | undefined = null;
      if (levelName) {
        const anchor = sharedStrands[0];
        levelId = anchor ? ctx.levelMap[`${anchor}|${levelName}`] : null;
      } else {
        const firstStrand = profile.strands[0];
        levelId = firstStrand
          ? ctx.levelMap[`${firstStrand.name}|${firstStrand.levels[0]?.name}`]
          : null;
      }
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      rows.push({
        id: seedId(
          'subject',
          'shs_minor',
          levelName ? `profile:${levelName}` : 'profile',
          s.name,
          ctx.schoolYearId,
          ctx.orgId,
        ),
        name: s.name,
        levelId,
        levelName,
        targets: sharedStrands.map((strandName) => ({
          courseId: null,
          strandId: ctx.strandMap[strandName],
        })),
      });
    }

    await this.persistMinors(
      ctx,
      ctx.programMap['shs'],
      rows,
      SHS_MINOR_SCOPE,
      (subjectId, target) =>
        seedId('sharing', subjectId, target.strandId as string, 'profile', ctx.orgId),
    );
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

      const id = seedId(
        'subject',
        'college_ge',
        'minor',
        s.name,
        ctx.schoolYearId,
        ctx.orgId,
      );
      const existing = await findExistingSubject(this.db, id, {
        orgId: ctx.orgId,
        subjectType: 'minor',
        programId: ctx.programMap['college'],
        name: s.name,
      });

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

      ctx.registerSubjectId(COLLEGE_MINOR_SCOPE, s.name, subjectId, s.yearLevel);

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
          ctx.schoolYearId,
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
        ctx.registerSubjectId(SHS_MINOR_SCOPE, s.name, subjectId, s.yearLevel);
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