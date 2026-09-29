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

      const progKey = deriveProgramKey(s.levelName);
      // Own scope: its course/strand (major), or the shared bucket (minor).
      const scopeKey = s.isMinor ? `shared:${progKey}` : (s.courseCode ?? s.strandName ?? progKey);
      // Fallback scope for prereq names not found in the subject's own
      // scope — covers a major subject's prereq pointing at a shared minor
      // (e.g. BSBA's "Business Statistics" → "Mathematics in the Modern World").
      const fallbackScope = `shared:${progKey}`;

      const subjectId = ctx.getSubjectId(scopeKey, s.name, fallbackScope);
      if (!subjectId) continue;

      for (const prereqName of s.prereqNames) {
        const cleanName = prereqName.replace(/\s*\(.*?\)\s*$/, '').trim();
        const prereqId = ctx.getSubjectId(scopeKey, cleanName, fallbackScope);
        if (!prereqId) continue;

        await this.db.subjectPrerequisite.upsert({
          where: {
            org_id_subject_id_prerequisite_id: {
              org_id: ctx.orgId,
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