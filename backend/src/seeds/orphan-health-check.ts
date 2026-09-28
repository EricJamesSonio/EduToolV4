/**
 * orphan-health-check.ts — run on EVERY environment.
 *
 *   npm run check:orphans        (from backend/)
 *
 * Historical context: Level.course_id / Level.strand_id and Section.course_id /
 * Section.strand_id are optional relations. Before they carried an explicit
 * `onDelete: Restrict`, Prisma's default for optional relations was `SetNull`,
 * so hard-deleting a course/strand silently nulled its levels/sections instead
 * of failing — that is exactly how orphaned levels (e.g. a college program with
 * levels but no course) appeared. The soft-delete flow added alongside
 * `deleted_at` prevents NEW orphans, but it does not repair rows that were
 * already nulled by past deletes. This script is the detector for those.
 *
 * Run it: after deploying the migration, on a schedule (cron/CI), and whenever
 * a seed or bulk delete touches Level/Strand/Course/Section.
 *
 * Exit code 1 when any inconsistency is found (CI/cron friendly), 0 when clean.
 * It REPORTS only — repair is a deliberate human/data task, never automatic.
 */
import { db } from './domain/db';

interface Issue {
  code: string;
  label: string;
  count: number;
  sample: string[];
}

const SAMPLE_CAP = 10;

function toIssue(
  code: string,
  label: string,
  rows: Array<{ id: string; name?: string | null }>,
): Issue | null {
  if (rows.length === 0) return null;
  return {
    code,
    label,
    count: rows.length,
    sample: rows
      .slice(0, SAMPLE_CAP)
      .map((r) => `${r.name ?? '(unnamed)'} (${r.id})`),
  };
}

async function main(): Promise<void> {
  const issues: Array<Issue | null> = [];

  // 1. Live college levels with no course — the classic SetNull orphan.
  issues.push(
    toIssue(
      'college_level_missing_course',
      'Live college level has course_id = NULL (college levels must belong to a course)',
      await db.level.findMany({
        where: {
          deleted_at: null,
          course_id: null,
          program: { type: 'college' },
        },
        select: { id: true, name: true },
      }),
    ),
  );

  // 2. Live senior-high levels with no strand — same shape, SHS side.
  issues.push(
    toIssue(
      'senior_high_level_missing_strand',
      'Live senior_high level has strand_id = NULL (SHS levels must belong to a strand)',
      await db.level.findMany({
        where: {
          deleted_at: null,
          strand_id: null,
          program: { type: 'senior_high' },
        },
        select: { id: true, name: true },
      }),
    ),
  );

  // 3. Live level whose course/strand was archived — child must be hidden with
  //    its parent (the archive flow does this; finding one means a hole).
  issues.push(
    toIssue(
      'level_parent_archived',
      'Live level points at an ARCHIVED course/strand (should be archived too)',
      await db.level.findMany({
        where: {
          deleted_at: null,
          OR: [
            { course: { deleted_at: { not: null } } },
            { strand: { deleted_at: { not: null } } },
          ],
        },
        select: { id: true, name: true },
      }),
    ),
  );

  // 4. Live section whose level was archived — section must be hidden with its
  //    level (the archive flow does this; finding one means a hole).
  issues.push(
    toIssue(
      'section_level_archived',
      'Live section belongs to an ARCHIVED level (should be archived too)',
      await db.section.findMany({
        where: { deleted_at: null, level: { deleted_at: { not: null } } },
        select: { id: true, name: true },
      }),
    ),
  );

  // 5. Live section whose course/strand was archived directly.
  issues.push(
    toIssue(
      'section_scope_parent_archived',
      'Live section points at an ARCHIVED course/strand (should be archived too)',
      await db.section.findMany({
        where: {
          deleted_at: null,
          OR: [
            { course: { deleted_at: { not: null } } },
            { strand: { deleted_at: { not: null } } },
          ],
        },
        select: { id: true, name: true },
      }),
    ),
  );

  const found = issues.filter((i): i is Issue => i !== null);

  if (found.length === 0) {
    console.log('[orphan-health-check] OK — no orphaned or half-hidden rows.');
    return;
  }

  console.error(`[orphan-health-check] ${found.length} problem shape(s) found:\n`);
  let total = 0;
  for (const issue of found) {
    total += issue.count;
    console.error(`  ✗ ${issue.code} — ${issue.count} row(s)`);
    console.error(`      ${issue.label}`);
    for (const s of issue.sample) console.error(`      • ${s}`);
    if (issue.count > issue.sample.length) {
      console.error(
        `      … and ${issue.count - issue.sample.length} more (query by the code above)`,
      );
    }
    console.error('');
  }
  console.error(
    `Total: ${total} row(s). This script only REPORTS — repair is a separate, deliberate task.`,
  );
  process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error('[orphan-health-check] failed to run:', err);
    process.exitCode = 2;
  })
  .finally(async () => {
    await db.$disconnect();
  });