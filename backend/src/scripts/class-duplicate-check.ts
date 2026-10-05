/**
 * class-duplicate-check.ts — REPORT ONLY. Deletes nothing, ever.
 *
 *   npm run check:class-duplicates        (from backend/)
 *
 * WHY THIS EXISTS
 * The class generator's persist step does a read-then-write duplicate check
 * (ClassService.assertNoDuplicateSubjectInSection) OUTSIDE any transaction,
 * with no advisory lock and no DB constraint on `Class`. Two concurrent
 * commits can both pass the check for the same (section, subject, semester)
 * pair and both insert.
 *
 * That race is reachable in practice because the HTTP client aborts at 30s
 * (frontend/src/api/client.ts) while a full generation runs ~2 minutes. The
 * admin sees a timeout, clicks again, and request #1 is still writing.
 *
 * This script answers the question that decides whether a partial UNIQUE index
 * is safe to add: does the data ALREADY contain a duplicate that would make
 * CREATE UNIQUE INDEX fail?
 *
 * Mirrors check:orphans conventions:
 *   - exit 0 = clean, exit 1 = duplicates found (CI/cron), exit 2 = failure
 *   - REPORTS only. Repair is a deliberate human/data task, never automatic.
 *
 * WHY THIS INDEX KEY
 * (org_id, section_id, subject_id, semester_id) is exactly what the service
 * already treats as unique. Two details are handled explicitly:
 *   - deleted_at IS NULL  -> an archived class must NOT block a fresh one.
 *   - section_id NOT NULL -> Class.section_id is OPTIONAL and a class with no
 *     section is legitimate (capacity 0 = "no cap"), so those rows are exempt
 *     from both the index and this report.
 */
import { db } from '../seeds/domain/db';

const SAMPLE_CAP = 10;
const REPORT_CAP = 25;

interface DuplicateGroup {
  classIds: string[];
  sectionName: string | null;
  subjectName: string | null;
  semesterName: string | null;
  schoolYearName: string | null;
  educatorNames: string[];
}

/** Active classes sharing (org, section, subject, semester) — the index key. */
async function findActiveDuplicates(): Promise<DuplicateGroup[]> {
  return db.$queryRaw<DuplicateGroup[]>`
    SELECT
      ARRAY_AGG(c.id)::text[]                                 AS "classIds",
      MAX(s.name)                                              AS "sectionName",
      MAX(sj.name)                                             AS "subjectName",
      MAX(sm.name)                                             AS "semesterName",
      MAX(sy.name)                                             AS "schoolYearName",
      ARRAY_AGG(DISTINCT COALESCE(pr.full_name, '(unnamed)')) AS "educatorNames"
    FROM "Class" c
    LEFT JOIN "Section"    s  ON s.id  = c.section_id
    LEFT JOIN "Subject"    sj ON sj.id = c.subject_id
    LEFT JOIN "Semester"   sm ON sm.id = c.semester_id
    LEFT JOIN "SchoolYear" sy ON sy.id = c.school_year_id
    LEFT JOIN "Account"    a  ON a.id  = c.educator_id
    LEFT JOIN "Profile"    pr ON pr.account_id = a.id
    WHERE c.deleted_at IS NULL
      AND c.section_id IS NOT NULL
    GROUP BY c.org_id, c.section_id, c.subject_id, c.semester_id
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `;
}

/**
 * Archived duplicates. Visibility only — the index predicate excludes deleted
 * rows, so they can never block it.
 */
async function findArchivedDuplicateKeys(): Promise<number> {
  const rows = await db.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count FROM (
      SELECT 1
      FROM "Class"
      WHERE deleted_at IS NOT NULL AND section_id IS NOT NULL
      GROUP BY org_id, section_id, subject_id, semester_id
      HAVING COUNT(*) > 1
    ) d
  `;
  return rows[0]?.count ?? 0;
}

/** Inventory, so the operator can judge how risky the index migration is. */
async function countClasses(): Promise<{
  active: number;
  archived: number;
  sectionless: number;
}> {
  const rows = await db.$queryRaw<
    Array<{ active: number; archived: number; sectionless: number }>
  >`
    SELECT
      COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS active,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS archived,
      COUNT(*) FILTER (WHERE deleted_at IS NULL AND section_id IS NULL)::int AS sectionless
    FROM "Class"
  `;
  return rows[0] ?? { active: 0, archived: 0, sectionless: 0 };
}

function describe(g: DuplicateGroup): string {
  const ids = g.classIds.slice(0, SAMPLE_CAP).join(', ');
  const more =
    g.classIds.length > SAMPLE_CAP ? `, +${g.classIds.length - SAMPLE_CAP} more` : '';
  return [
    `section "${g.sectionName ?? '?'}"`,
    `subject "${g.subjectName ?? '?'}"`,
    `semester "${g.semesterName ?? '?'}"`,
    `year "${g.schoolYearName ?? '?'}"`,
    `educators [${g.educatorNames.join(', ')}]`,
    `-> ${g.classIds.length} active classes: ${ids}${more}`,
  ].join('\n        ');
}

async function main(): Promise<void> {
  console.log('[class-duplicate-check] REPORT ONLY — nothing is modified.\n');

  const totals = await countClasses();
  console.log('Inventory');
  console.log(`  active classes     : ${totals.active}`);
  console.log(`  archived classes   : ${totals.archived}`);
  console.log(`  active, no section : ${totals.sectionless}  (exempt from the index)\n`);

  const dupes = await findActiveDuplicates();

  if (dupes.length === 0) {
    console.log(
      '[class-duplicate-check] OK — no active (section, subject, semester) duplicates.',
    );
    console.log('  A partial UNIQUE index on Class is SAFE to apply.\n');
  } else {
    const surplus = dupes.reduce((n, g) => n + (g.classIds.length - 1), 0);
    console.error(
      `[class-duplicate-check] ${dupes.length} duplicated key(s) found ` +
        `(${surplus} surplus class row(s)).\n`,
    );
    console.error(
      '  A partial UNIQUE index CANNOT be applied until these are resolved.\n',
    );
    for (const g of dupes.slice(0, REPORT_CAP)) {
      console.error(`  x ${describe(g)}\n`);
    }
    if (dupes.length > REPORT_CAP) {
      console.error(`  ... and ${dupes.length - REPORT_CAP} more duplicate key(s).\n`);
    }
    console.error(
      '  Decide per group which class survives (usually the oldest created_at, or\n' +
        '  the one with enrollments) and archive the others by SETTING deleted_at.\n' +
        '  Never DELETE — that would cascade to enrollments and grades.\n',
    );
  }

  const archived = await findArchivedDuplicateKeys();
  if (archived > 0) {
    console.log(
      `[advisory] ${archived} key(s) also have archived duplicates. Harmless — they\n` +
        '  cannot block the index, since the predicate excludes deleted rows.\n',
    );
  }

  process.exitCode = dupes.length === 0 ? 0 : 1;
}

main()
  .catch((err) => {
    console.error('[class-duplicate-check] failed to run:', err);
    process.exitCode = 2;
  })
  .finally(async () => {
    await db.$disconnect();
  });