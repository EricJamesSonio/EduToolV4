import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '@/core/database/database.provider';
import { allSubjects, deriveProgramKey } from '../data/subjects';
import { SeedContext } from '../seed-context';

@Injectable()
export class PrerequisiteSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const subjectDefs = allSubjects().filter((s) =>
      ctx.shouldSeedProgram(deriveProgramKey(s.levelName)),
    );

    for (const s of subjectDefs) {
      if (s.prereqNames.length === 0) continue;
      if (!s.isMinor) {
        const levelKey = s.courseCode
          ? `${s.courseCode}|${s.levelName}`
          : s.strandName
            ? `${s.strandName}|${s.levelName}`
            : s.levelName;
        if (!ctx.levelMap[levelKey]) continue;
      }

      const subjectId = ctx.subjectNameToId[s.name];
      if (!subjectId) continue;

      for (const prereqName of s.prereqNames) {
        const cleanName = prereqName.replace(/\s*\(.*?\)\s*$/, '').trim();
        const prereqId = ctx.subjectNameToId[cleanName];
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
            org_id: ctx.orgId,
            subject_id: subjectId,
            prerequisite_id: prereqId,
          },
        });
      }
    }
  }
}
