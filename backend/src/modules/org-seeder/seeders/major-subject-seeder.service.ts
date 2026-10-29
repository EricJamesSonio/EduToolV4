import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { allMajorSubjects, deriveProgramKey } from '../data/subjects';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

interface MajorRow {
  id: string;
  programId: string;
  levelId: string;
  courseId: string | null;
  strandId: string | null;
  name: string;
  yearLevel: string | null;
  termLabel: string | null;
  scopeKey: string;
  levelName: string;
}

const PROGRAM_KEYS = ['daycare', 'kinder', 'elementary', 'jhs', 'shs', 'college'];

function naturalKey(
  levelId: string,
  courseId: string | null,
  strandId: string | null,
  name: string,
): string {
  return `${levelId}|${courseId ?? ''}|${strandId ?? ''}|${name}`;
}

@Injectable()
export class MajorSubjectSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const rows: MajorRow[] = [];

    for (const progKey of PROGRAM_KEYS) {
      if (!ctx.shouldSeedProgram(progKey) || !ctx.programMap[progKey]) continue;

      const profile = ctx.profileDepartments[progKey];
      if (profile) {
        this.collectFromProfile(ctx, progKey, profile, rows);
      }
    }

    this.collectFromDefaults(ctx, rows);

    await this.persist(ctx, rows);
  }

  private collectFromDefaults(ctx: SeedContext, rows: MajorRow[]): void {
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

      rows.push({
        id: seedId(
          'subject',
          s.levelName,
          s.courseCode ?? 'none',
          s.strandName ?? 'none',
          s.name,
          ctx.schoolYearId,
          ctx.orgId,
        ),
        programId,
        levelId,
        courseId: courseId ?? null,
        strandId: strandId ?? null,
        name: s.name,
        yearLevel: s.yearLevel,
        termLabel: s.termLabel,
        scopeKey: s.courseCode ?? s.strandName ?? progKey,
        levelName: s.levelName,
      });
    }
  }

  private collectFromProfile(
    ctx: SeedContext,
    progKey: string,
    profile: NonNullable<SeedContext['profileDepartments'][string]>,
    rows: MajorRow[],
  ): void {
    const allLevels = [
      ...profile.courses.flatMap((c) =>
        c.levels.map((l) => ({
          level: l,
          courseCode: c.code ?? c.name,
          strandName: null as string | null,
        })),
      ),
      ...profile.strands.flatMap((s) =>
        s.levels.map((l) => ({
          level: l,
          courseCode: null as string | null,
          strandName: s.name,
        })),
      ),
      ...profile.levels.map((l) => ({
        level: l,
        courseCode: null as string | null,
        strandName: null as string | null,
      })),
    ];

    const programId = ctx.programMap[progKey];

    for (const { level, courseCode, strandName } of allLevels) {
      const levelKey = courseCode
        ? `${courseCode}|${level.name}`
        : strandName
          ? `${strandName}|${level.name}`
          : level.name;
      const levelId = ctx.levelMap[levelKey];
      if (!levelId) {
        ctx.result.subjects.skipped++;
        continue;
      }

      const courseId = courseCode ? ctx.courseMap[courseCode] : null;
      const strandId = strandName ? ctx.strandMap[strandName] : null;
      const scopeKey = courseCode ?? strandName ?? progKey;

      for (const subj of level.subjects.filter(
        (s) => s.subjectType === 'major',
      )) {
        if (
          !ctx.shouldSeedSubject(
            subj.name,
            level.name,
            strandName ?? undefined,
            courseCode ?? undefined,
          )
        ) {
          ctx.result.subjects.skipped++;
          continue;
        }

        rows.push({
          id: seedId(
            'subject',
            level.name,
            courseCode ?? 'none',
            strandName ?? 'none',
            subj.name,
            ctx.schoolYearId,
            ctx.orgId,
          ),
          programId,
          levelId,
          courseId: courseId ?? null,
          strandId: strandId ?? null,
          name: subj.name,
          yearLevel: level.name,
          termLabel: null,
          scopeKey,
          levelName: level.name,
        });
      }
    }
  }

  /**
   * One read for everything that already exists, one batch insert for the
   * rest. A row counts as existing when its seed id matches OR when the same
   * subject (level + course/strand + name) is already there.
   */
  private async persist(ctx: SeedContext, rows: MajorRow[]): Promise<void> {
    if (rows.length === 0) return;

    const unique = new Map<string, MajorRow>();
    for (const row of rows) {
      if (!unique.has(row.id)) unique.set(row.id, row);
    }

    const programIds = Array.from(new Set(rows.map((r) => r.programId)));
    const levelIds = Array.from(new Set(rows.map((r) => r.levelId)));

    const existing = await this.db.subject.findMany({
      where: {
        org_id: ctx.orgId,
        OR: [
          { id: { in: Array.from(unique.keys()) } },
          {
            subject_type: 'major',
            program_id: { in: programIds },
            level_id: { in: levelIds },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        level_id: true,
        course_id: true,
        strand_id: true,
      },
    });

    const existingIds = new Set(existing.map((e) => e.id));
    const existingByKey = new Map<string, string>();
    for (const e of existing) {
      if (!e.level_id) continue;
      const key = naturalKey(e.level_id, e.course_id, e.strand_id, e.name);
      if (!existingByKey.has(key)) existingByKey.set(key, e.id);
    }

    const resolved = new Map<string, string>();
    const toCreate: MajorRow[] = [];

    for (const row of unique.values()) {
      const foundId = existingIds.has(row.id)
        ? row.id
        : existingByKey.get(
            naturalKey(row.levelId, row.courseId, row.strandId, row.name),
          );
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
          subject_type: 'major',
          program_id: row.programId,
          level_id: row.levelId,
          course_id: row.courseId,
          strand_id: row.strandId,
          name: row.name,
          year_level: row.yearLevel,
          term_label: row.termLabel,
          is_locked: false,
        })),
        skipDuplicates: true,
      });
      ctx.result.subjects.seeded += toCreate.length;
    }

    // Repeated rows resolve to the subject their first copy produced.
    ctx.result.subjects.already_exists += rows.length - unique.size;

    for (const row of rows) {
      const subjectId = resolved.get(row.id);
      if (!subjectId) continue;
      ctx.registerSubjectId(row.scopeKey, row.name, subjectId, row.levelName);
    }
  }
}