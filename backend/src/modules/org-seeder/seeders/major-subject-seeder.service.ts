import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { allMajorSubjects, deriveProgramKey } from '../data/subjects';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class MajorSubjectSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const subjectDefs = allMajorSubjects().filter((s) =>
      ctx.shouldSeedProgram(deriveProgramKey(s.levelName)),
    );

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

      const id = seedId(
        'subject',
        s.levelName,
        s.courseCode ?? 'none',
        s.strandName ?? 'none',
        s.name,
        ctx.orgId,
      );
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
}
