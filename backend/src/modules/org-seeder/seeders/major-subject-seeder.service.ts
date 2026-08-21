import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { allMajorSubjects, deriveProgramKey } from '../data/subjects';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class MajorSubjectSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    for (const progKey of ['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college']) {
      if (!ctx.shouldSeedProgram(progKey) || !ctx.programMap[progKey]) continue;

      const profile = ctx.profileDepartments[progKey];
      if (profile) {
        await this.seedFromProfile(ctx, progKey, profile);
      }
    }

    // Static fallback — only processes program keys that have NO profile,
    // since profile-backed program keys were already fully handled above.
    const subjectDefs = allMajorSubjects().filter((s) => {
      const progKey = deriveProgramKey(s.levelName);
      return ctx.shouldSeedProgram(progKey) && !ctx.profileDepartments[progKey];
    });

    for (const s of subjectDefs) {
      if (
        !ctx.shouldSeedSubject(
          s.name,
          s.levelName,
          s.strandName ?? undefined,
          s.courseCode ?? undefined,
        )
      ) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const progKey = deriveProgramKey(s.levelName);
      const programId = ctx.programMap[progKey];
      if (!programId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const levelKey = s.courseCode
        ? `${s.courseCode}|${s.levelName}`
        : s.strandName
          ? `${s.strandName}|${s.levelName}`
          : s.levelName;
      const levelId = ctx.levelMap[levelKey];
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const courseId = s.courseCode ? ctx.courseMap[s.courseCode] : null;
      const strandId = s.strandName ? ctx.strandMap[s.strandName] : null;

      if (s.courseCode && !courseId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      if (s.strandName && !strandId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const id = seedId('subject', s.levelName, s.courseCode ?? 'none', s.strandName ?? 'none', s.name, ctx.orgId);
      const existing = await this.db.subject.findFirst({ where: { id } });

      if (existing) {
        ctx.subjectNameToId[s.name] = existing.id;
        ctx.result.subjects.already_exists++;
      } else {
        const created = await this.db.subject.create({
          data: {
            id,
            org_id: ctx.orgId,
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
        ctx.subjectNameToId[s.name] = created.id;
        ctx.result.subjects.seeded++;
      }
    }
  }

  private async seedFromProfile(
    ctx: SeedContext,
    progKey: string,
    profile: NonNullable<SeedContext['profileDepartments'][string]>,
  ): Promise<void> {
    const allLevels = [
      ...profile.courses.flatMap((c) => c.levels.map((l) => ({ level: l, courseCode: c.code ?? c.name, strandName: null as string | null }))),
      ...profile.strands.flatMap((s) => s.levels.map((l) => ({ level: l, courseCode: null as string | null, strandName: s.name }))),
      ...profile.levels.map((l) => ({ level: l, courseCode: null as string | null, strandName: null as string | null })),
    ];

    for (const { level, courseCode, strandName } of allLevels) {
      const levelKey = courseCode ? `${courseCode}|${level.name}` : strandName ? `${strandName}|${level.name}` : level.name;
      const levelId = ctx.levelMap[levelKey];
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const courseId = courseCode ? ctx.courseMap[courseCode] : null;
      const strandId = strandName ? ctx.strandMap[strandName] : null;

      for (const subj of level.subjects.filter((s) => s.subjectType === 'major')) {
        if (!ctx.shouldSeedSubject(subj.name, level.name, strandName ?? undefined, courseCode ?? undefined)) {
          ctx.result.subjects.skipped++;
          continue;
        }

        const id = seedId('subject', level.name, courseCode ?? 'none', strandName ?? 'none', subj.name, ctx.orgId);
        const existing = await this.db.subject.findFirst({ where: { id } });

        if (existing) {
          ctx.subjectNameToId[subj.name] = existing.id;
          ctx.result.subjects.already_exists++;
        } else {
          const created = await this.db.subject.create({
            data: {
              id,
              org_id: ctx.orgId,
              subject_type: 'major',
              program_id: ctx.programMap[progKey],
              level_id: levelId,
              course_id: courseId ?? undefined,
              strand_id: strandId ?? undefined,
              name: subj.name,
              year_level: level.name,
              term_label: null,
              is_locked: false,
            },
          });
          ctx.subjectNameToId[subj.name] = created.id;
          ctx.result.subjects.seeded++;
        }
      }
    }
  }
}