import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { startOfDayInZone } from '@/commons/utils/datetime.util';

export interface SemesterWindow {
  id: string;
  programId: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface SemesterEnrollmentVerdict {
  open: boolean;
  reason: string | null;
}

const SEMESTER_SELECT = {
  id: true,
  program_id: true,
  school_year_id: true,
  name: true,
  start_date: true,
  end_date: true,
} as const;

type SemesterRow = {
  id: string;
  program_id: string;
  school_year_id: string;
  name: string;
  start_date: Date;
  end_date: Date;
};

function toWindow(row: SemesterRow): SemesterWindow {
  return {
    id: row.id,
    programId: row.program_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
  };
}

export function evaluateSemesterEnrollment(
  target: SemesterWindow,
  all: SemesterWindow[],
  now: Date = new Date(),
): SemesterEnrollmentVerdict {
  const cutoff = startOfDayInZone(now).getTime();

  if (target.endDate.getTime() < cutoff) {
    return {
      open: false,
      reason: `${target.name} has already ended. Its classes are read-only and cannot take new enrollments.`,
    };
  }

  const blocking = all.filter(
    (s) =>
      s.id !== target.id &&
      s.programId === target.programId &&
      s.startDate.getTime() < target.startDate.getTime() &&
      s.endDate.getTime() >= cutoff,
  );
  if (blocking.length > 0) {
    return {
      open: false,
      reason: `Enrollment in ${target.name} is locked until ${blocking
        .map((s) => s.name)
        .join(', ')} has ended.`,
    };
  }

  return { open: true, reason: null };
}

export async function assertSemestersOpenForEnrollment(
  db: DatabaseService,
  orgId: string,
  semesterIds: string[],
  now: Date = new Date(),
): Promise<void> {
  const ids = [...new Set(semesterIds)];
  if (ids.length === 0) return;

  const targets = await db.semester.findMany({
    where: { id: { in: ids }, org_id: orgId },
    select: SEMESTER_SELECT,
  });
  if (targets.length !== ids.length) {
    throw new BadRequestException(
      'The semester of this class no longer exists, so enrollment is blocked.',
    );
  }

  const siblings = await db.semester.findMany({
    where: {
      org_id: orgId,
      school_year_id: { in: [...new Set(targets.map((t) => t.school_year_id))] },
    },
    select: SEMESTER_SELECT,
  });
  const windows = siblings.map(toWindow);

  for (const target of targets) {
    const verdict = evaluateSemesterEnrollment(toWindow(target), windows, now);
    if (!verdict.open) {
      throw new BadRequestException(
        verdict.reason ?? 'Enrollment is locked for this semester.',
      );
    }
  }
}

export async function assertSemesterOpenForEnrollment(
  db: DatabaseService,
  orgId: string,
  semesterId: string,
  now: Date = new Date(),
): Promise<void> {
  await assertSemestersOpenForEnrollment(db, orgId, [semesterId], now);
}