import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '@/core/database/database.provider';
import { violatesLowerLevelRule } from '@/modules/subject-prerequisite/subject-prerequisite.utils';
import { allSubjects, deriveProgramKey } from '../data/subjects';
import { SeedContext } from '../seed-context';

/** Only a trailing LEVEL label is a qualifier; other parentheses belong to the subject name. */
const LEVEL_SUFFIX =
  /\s*\((Daycare \d+|Kinder \d+|Grade \d+|\d+(?:st|nd|rd|th) Year)\)\s*$/;

function parsePrereq(raw: string): { name: string; level?: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(LEVEL_SUFFIX);
  return match
    ? { name: trimmed.replace(LEVEL_SUFFIX, '').trim(), level: match[1] }
    : { name: trimmed };
}

@Injectable()
export class PrerequisiteSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const subjectDefs = allSubjects().filter((s) =>
      ctx.shouldSeedProgram(deriveProgramKey(s.levelName)),
    );

    let rejected = 0;
    const links = new Map<
      string,
      { id: string; org_id: string; subject_id: string; prerequisite_id: string }
    >();

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
      const scopeKey = s.isMinor
        ? `shared:${progKey}`
        : (s.courseCode ?? s.strandName ?? progKey);
      const fallbackScope = `shared:${progKey}`;

      // Minors carry their level in yearLevel; levelName is only a marker.
      const ownLevel = s.isMinor ? s.yearLevel : s.levelName;

      const subjectId =
        ctx.getSubjectId(scopeKey, s.name, fallbackScope, ownLevel) ??
        (s.isMinor ? ctx.getSubjectId(scopeKey, s.name, fallbackScope) : undefined);
      if (!subjectId) continue;

      for (const raw of s.prereqNames) {
        const { name, level } = parsePrereq(raw);

        // An explicit level must match exactly; otherwise names are unique per scope.
        const prereqId = level
          ? ctx.getSubjectId(scopeKey, name, fallbackScope, level)
          : ctx.getSubjectId(scopeKey, name, fallbackScope);

        if (!prereqId || prereqId === subjectId) continue;

        const prereqLevel = level ?? ctx.subjectLevelById[prereqId];
        if (violatesLowerLevelRule({ level: prereqLevel }, { level: ownLevel })) {
          rejected++;
          continue;
        }

        const key = `${subjectId}|${prereqId}`;
        if (links.has(key)) continue;
        links.set(key, {
          id: uuid(),
          org_id: ctx.orgId,
          subject_id: subjectId,
          prerequisite_id: prereqId,
        });
      }
    }

    // One batch insert instead of an upsert per link; existing links are
    // skipped by the (org, subject, prerequisite) unique key.
    if (links.size > 0) {
      await this.db.subjectPrerequisite.createMany({
        data: Array.from(links.values()),
        skipDuplicates: true,
      });
    }

    if (rejected > 0) {
      ctx.result.warnings.push(
        `${rejected} prerequisite link(s) skipped: a prerequisite must come from a strictly lower year level.`,
      );
    }
  }
}