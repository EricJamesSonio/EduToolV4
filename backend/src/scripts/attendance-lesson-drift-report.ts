/**
 * attendance-lesson-drift-report.ts — READ ONLY. Never writes, never migrates.
 *
 *   npm run check:attendance-drift        (from backend/)
 *
 * WHY
 * Attendance session generation used to expand schedule weekdays with
 * server-local getDay/setDate math, so sessions generated while the process
 * ran outside Asia/Manila (or from legacy Manila-midnight term rows) may sit
 * on the wrong weekday or carry a non-midnight time component. Lesson rows
 * inherit session (week_number, sub_index) keys via syncLessonsFromAttendance.
 *
 * TICK-INFRA-017 fixes generation for NEW sessions only — no backfill.
 * This script answers the ship-gating question: for every class with
 * schedules, it recomputes the expected Manila-day set with the NEW logic
 * and diffs it against the stored sessions:
 *
 *   - orphaned session days (stored, but the new logic would not generate
 *     them — e.g. wrong weekday under the old math),
 *   - missing days (the new logic generates them, no session stored),
 *   - non-midnight session rows (time component present),
 *   - lesson rows per class (blast-radius context; lessons follow sessions).
 *
 * Read-only by construction: findMany calls only, no DDL, no DML.
 * Run it against a populated copy and bring the numbers back before any
 * data conversation. Exit code 1 when any drift is found, 0 when clean.
 */
import { db } from '../seeds/domain/db';
import {
  calendarDateOf,
  weekdayOccurrencesInZone,
} from '../commons/utils/datetime.util';

interface ClassDrift {
  classId: string;
  sessions: number;
  lessons: number;
  orphanedDays: string[];
  missingDays: string[];
  nonMidnight: number;
}

function isMidnightUtc(value: Date): boolean {
  return (
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  );
}

async function main(): Promise<void> {
  const classes = await db.class.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      subject_id: true,
      schedules: { select: { weekday: true } },
    },
  });

  const report: ClassDrift[] = [];

  for (const cls of classes) {
    const weekdays = [...new Set(cls.schedules.map((s) => s.weekday))].sort(
      (a, b) => a - b,
    );
    if (weekdays.length === 0) continue;

    const subject = cls.subject_id
      ? await db.subject.findFirst({
          where: { id: cls.subject_id },
          select: { program_id: true },
        })
      : null;
    if (!subject?.program_id) continue;

    const assignment = await db.programSemesterAssignment.findFirst({
      where: { program_id: subject.program_id },
      include: { termDates: true },
    });
    if (!assignment) continue;

    // Expected Manila-day set under the NEW generation logic.
    const expected = new Set<string>();
    for (const td of assignment.termDates ?? []) {
      for (const weekday of weekdays) {
        for (const day of weekdayOccurrencesInZone(
          calendarDateOf(td.start_date),
          calendarDateOf(td.end_date),
          weekday,
        )) {
          expected.add(day);
        }
      }
    }

    const sessions = await db.attendanceSession.findMany({
      where: { class_id: cls.id },
      select: { date: true },
    });
    const stored = sessions.map((s) => calendarDateOf(s.date));
    const storedSet = new Set(stored);

    const lessons = await db.lesson.count({
      where: { class_id: cls.id },
    });

    report.push({
      classId: cls.id,
      sessions: sessions.length,
      lessons,
      orphanedDays: [...storedSet].filter((d) => !expected.has(d)).sort(),
      missingDays: [...expected].filter((d) => !storedSet.has(d)).sort(),
      nonMidnight: sessions.filter((s) => !isMidnightUtc(s.date)).length,
    });
  }

  const drifted = report.filter(
    (r) =>
      r.orphanedDays.length > 0 ||
      r.missingDays.length > 0 ||
      r.nonMidnight > 0,
  );

  console.log(
    `[attendance-drift-report] ${classes.length} class(es) scanned, ` +
      `${report.reduce((n, r) => n + r.sessions, 0)} session(s), ` +
      `${report.reduce((n, r) => n + r.lessons, 0)} lesson(s).`,
  );
  if (drifted.length === 0) {
    console.log(
      '[attendance-drift-report] OK — every stored session matches the new Manila-day generation.',
    );
    return;
  }

  console.error(
    `[attendance-drift-report] drift in ${drifted.length} class(es):`,
  );
  for (const r of drifted.slice(0, 50)) {
    console.error(
      `  class ${r.classId}: sessions=${r.sessions} lessons=${r.lessons} ` +
        `non-midnight=${r.nonMidnight} ` +
        `orphaned=[${r.orphanedDays.slice(0, 8).join(',')}${r.orphanedDays.length > 8 ? ',…' : ''}] ` +
        `missing=[${r.missingDays.slice(0, 8).join(',')}${r.missingDays.length > 8 ? ',…' : ''}]`,
    );
  }
  if (drifted.length > 50) {
    console.error(`  …and ${drifted.length - 50} more class(es).`);
  }
  console.error('');
  console.error('  No repair is proposed or run here. Report goes to a human.');
  process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error('[attendance-drift-report] failed to run:', err);
    process.exitCode = 2;
  })
  .finally(async () => {
    await db.$disconnect();
  });
