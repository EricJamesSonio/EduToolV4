import { DatabaseService } from '@/core/database/database.provider';

const DAY_MS = 24 * 60 * 60 * 1000;

export function hasSemesterStarted(
  startDate: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= startDate.getTime();
}

// end_date is the last day of the semester (inclusive), so the semester is
// still running until the end of that day.
export function hasSemesterEnded(
  endDate: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= endDate.getTime() + DAY_MS;
}

export function isSemesterInProgress(
  startDate: Date,
  endDate: Date,
  now: Date = new Date(),
): boolean {
  return hasSemesterStarted(startDate, now) && !hasSemesterEnded(endDate, now);
}

export interface ClassSemesterInfo {
  started: boolean;
  semesterName: string | null;
  startDate: Date | null;
}

export async function getClassSemesterInfo(
  db: DatabaseService,
  orgId: string,
  classId: string,
): Promise<ClassSemesterInfo> {
  const none: ClassSemesterInfo = {
    started: false,
    semesterName: null,
    startDate: null,
  };

  const cls = await db.class.findFirst({
    where: { id: classId, org_id: orgId },
    select: { semester_id: true },
  });
  if (!cls) return none;

  const semester = await db.semester.findFirst({
    where: { id: cls.semester_id, org_id: orgId },
    select: { name: true, start_date: true },
  });
  if (!semester) return none;

  return {
    started: hasSemesterStarted(semester.start_date),
    semesterName: semester.name,
    startDate: semester.start_date,
  };
}

async function loadClassSemesters(
  db: DatabaseService,
  orgId: string,
  classIds: string[],
): Promise<Map<string, { startDate: Date; endDate: Date }>> {
  const result = new Map<string, { startDate: Date; endDate: Date }>();
  if (classIds.length === 0) return result;

  const classes = await db.class.findMany({
    where: { id: { in: classIds }, org_id: orgId },
    select: { id: true, semester_id: true },
  });
  const semesterIds = [...new Set(classes.map((c) => c.semester_id))];
  if (semesterIds.length === 0) return result;

  const semesters = await db.semester.findMany({
    where: { id: { in: semesterIds }, org_id: orgId },
    select: { id: true, start_date: true, end_date: true },
  });
  const bySemester = new Map(semesters.map((s) => [s.id, s]));

  for (const cls of classes) {
    const sem = bySemester.get(cls.semester_id);
    if (sem) {
      result.set(cls.id, { startDate: sem.start_date, endDate: sem.end_date });
    }
  }
  return result;
}

/** Class ids whose semester has already started (2 queries total). */
export async function findStartedSemesterClassIds(
  db: DatabaseService,
  orgId: string,
  classIds: string[],
): Promise<Set<string>> {
  const map = await loadClassSemesters(db, orgId, classIds);
  const started = new Set<string>();
  for (const [classId, sem] of map) {
    if (hasSemesterStarted(sem.startDate)) started.add(classId);
  }
  return started;
}

/** Class ids whose semester has already ended (2 queries total). */
export async function findEndedSemesterClassIds(
  db: DatabaseService,
  orgId: string,
  classIds: string[],
): Promise<Set<string>> {
  const map = await loadClassSemesters(db, orgId, classIds);
  const ended = new Set<string>();
  for (const [classId, sem] of map) {
    if (hasSemesterEnded(sem.endDate)) ended.add(classId);
  }
  return ended;
}