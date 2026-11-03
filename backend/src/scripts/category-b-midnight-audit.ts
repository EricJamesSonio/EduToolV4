/**
 * category-b-midnight-audit.ts — READ ONLY. Never writes, never migrates.
 *
 *   npm run check:catb-midnight        (from backend/)
 *
 * WHY
 * Category B values (term dates, semester, school year, holidays, attendance
 * session dates, enrollment periods) are intended to be DATE-ONLY. They are
 * stored in Postgres `timestamp(3)`, which always carries a time component, so
 * "is this midnight?" has to be answered by inspecting the data rather than
 * assumed from the schema.
 *
 * This answers the one question that gates the Category B work: for each
 * Category B column, how many rows are NOT exactly 00:00:00?
 *
 *   - all zero  -> already clean; B1 needs only code changes.
 *   - any non-zero -> values were written with a server-local time component and
 *     Category B needs a BACKFILL first, or comparisons will be off by a day.
 *
 * It deliberately reports MIN/MAX too: a column that is "not midnight" because
 * it holds a real clock time is a different problem from one holding 16:00 UTC
 * because a UTC+8 server wrote it, and the fix differs.
 *
 * Read-only by construction: a single SELECT per column, no DDL, no DML.
 */
import { db } from '../seeds/domain/db';

interface ColumnAudit {
  table: string;
  column: string;
  total: number;
  nulls: number;
  notMidnight: number;
  minTime: string | null;
  maxTime: string | null;
}

/**
 * Category B columns, from the agreed table. `table`/`column` are interpolated
 * into the SQL because they are literals in this file, never user input —
 * parameter binding does not work for identifiers in raw SQL.
 */
const TARGETS: Array<{ table: string; column: string }> = [
  { table: 'Semester', column: 'start_date' },
  { table: 'Semester', column: 'end_date' },
  { table: 'Term', column: 'start_date' },
  { table: 'Term', column: 'end_date' },
  { table: 'SchoolYear', column: 'start_date' },
  { table: 'SchoolYear', column: 'end_date' },
  { table: 'ProgramSemesterTermDate', column: 'start_date' },
  { table: 'ProgramSemesterTermDate', column: 'end_date' },
  { table: 'AcademicCalendar', column: 'start_date' },
  { table: 'AcademicCalendar', column: 'end_date' },
  { table: 'ProgramCalendar', column: 'start_date' },
  { table: 'ProgramCalendar', column: 'end_date' },
  { table: 'ProgramCalendarBreak', column: 'start_date' },
  { table: 'ProgramCalendarBreak', column: 'end_date' },
  { table: 'ProgramCalendarTerm', column: 'start_date' },
  { table: 'ProgramCalendarTerm', column: 'end_date' },
  { table: 'ProgramCalendarHoliday', column: 'date' },
  { table: 'AttendanceSession', column: 'date' },
  { table: 'EnrollmentPeriod', column: 'start_date' },
  { table: 'EnrollmentPeriod', column: 'end_date' },
  { table: 'EnrollmentPeriod', column: 'lock_date' },
];

async function auditColumn(t: {
  table: string;
  column: string;
}): Promise<ColumnAudit> {
  const rows = await db.$queryRawUnsafe<ColumnAudit[]>(
    `SELECT
       $1::text                                        AS table,
       $2::text                                        AS column,
       count(*)::int                                   AS total,
       count(*) FILTER (WHERE "${t.column}" IS NULL)::int AS nulls,
       count(*) FILTER (
         WHERE "${t.column}" IS NOT NULL
           AND "${t.column}"::time <> TIME '00:00:00'
       )::int                                          AS "notMidnight",
       to_char(min("${t.column}"::time), 'HH24:MI:SS') AS "minTime",
       to_char(max("${t.column}"::time), 'HH24:MI:SS') AS "maxTime"
     FROM "${t.table}"`,
    t.table,
    t.column,
  );
  return (
    rows[0] ?? {
      table: t.table,
      column: t.column,
      total: 0,
      nulls: 0,
      notMidnight: 0,
      minTime: null,
      maxTime: null,
    }
  );
}

async function main(): Promise<void> {
  console.log('[category-b-midnight-audit] READ ONLY — no data is modified.\n');

  const results: ColumnAudit[] = [];
  for (const t of TARGETS) {
    try {
      results.push(await auditColumn(t));
    } catch (err) {
      // A missing table must not abort the whole audit; report and continue.
      console.error(
        `  ! ${t.table}.${t.column}: could not read (${(err as Error).message})`,
      );
    }
  }

  const pad = (s: string, n: number): string => s.padEnd(n);
  console.log(
    `${pad('TABLE.COLUMN', 40)} ${pad('ROWS', 8)} ${pad('NULL', 8)} ${pad('NOT-MIDNIGHT', 14)} TIME RANGE`,
  );
  console.log('-'.repeat(96));
  for (const r of results) {
    console.log(
      `${pad(`${r.table}.${r.column}`, 40)} ${pad(String(r.total), 8)} ${pad(String(r.nulls), 8)} ${pad(String(r.notMidnight), 14)} ${
        r.minTime ?? '-'
      } .. ${r.maxTime ?? '-'}`,
    );
  }

  const dirty = results.filter((r) => r.notMidnight > 0);
  console.log('');
  if (dirty.length === 0) {
    console.log(
      '[category-b-midnight-audit] OK — every Category B column is exactly 00:00:00.',
    );
    console.log(
      '  Category B can adopt the UTC-midnight convention with code changes only;',
    );
    console.log('  no backfill is required.');
  } else {
    console.error(
      `[category-b-midnight-audit] ${dirty.length} column(s) carry a non-midnight time component.`,
    );
    console.error('');
    console.error('  Inspect the TIME RANGE above to tell the cases apart:');
    console.error(
      '   - a range that clusters late in the day (e.g. 16:00) usually means a',
    );
    console.error(
      '     UTC+8 server stamped a local time; those rows need a backfill that',
    );
    console.error(
      '     zeroes the time component BEFORE Category B code changes land.',
    );
    console.error(
      '   - a range that looks like a real clock time means the column was never',
    );
    console.error(
      '     meant to be midnight and must be handled as a true instant instead.',
    );
    console.error('');
    console.error('  No repair is proposed or run here. Report goes to a human.');
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('[category-b-midnight-audit] failed to run:', err);
    process.exitCode = 2;
  })
  .finally(async () => {
    await db.$disconnect();
  });