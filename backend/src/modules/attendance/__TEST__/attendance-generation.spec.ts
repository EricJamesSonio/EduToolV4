import { AttendanceService } from '../attendance.service';
import { AttendanceRepository } from '../attendance.repository';
import { calendarDateToUtc } from '@/commons/utils/datetime.util';

/**
 * TICK-INFRA-017 (Step 4.5) — attendance generation is Manila-day based and
 * idempotent. October 2026 Mondays used throughout: 5, 12, 19, 26.
 * Deterministic under every process TZ.
 */
describe('attendance generation (TICK-INFRA-017)', () => {
  const orgId = 'org-1';
  const classId = 'c1';

  function termRange() {
    return [
      {
        term_id: 't1',
        start_date: calendarDateToUtc('2026-10-01'),
        end_date: calendarDateToUtc('2026-10-31'),
      },
    ];
  }

  function makeService(existingSessions: Array<{ date: Date; sub_index: number }> = []) {
    const created: Array<{ date: Date; week_number: number; sub_index: number }> = [];
    const db = {
      class: {
        findUnique: jest.fn().mockResolvedValue({
          id: classId,
          schedules: [{ weekday: 1 }],
          subject_id: 'sub-1',
          semester_id: null,
        }),
      },
      subject: {
        findFirst: jest.fn().mockResolvedValue({ program_id: 'prog-1' }),
      },
      programSemesterAssignment: {
        findFirst: jest.fn().mockResolvedValue({
          template: { semesters: [{ terms: [{ id: 't1' }] }] },
          termDates: termRange(),
        }),
      },
      semester: { findUnique: jest.fn() },
      academicCalendar: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const attendanceRepo = {
      findSessionsByClass: jest.fn().mockResolvedValue(existingSessions),
      createManySessions: jest.fn().mockImplementation((rows) => {
        created.push(...rows);
        return Promise.resolve({ count: rows.length });
      }),
    };
    const service = new AttendanceService(
      db as any,
      attendanceRepo as any,
      {} as any,
      { syncLessonsFromAttendance: jest.fn() } as any,
    );
    return { service, attendanceRepo, created };
  }

  const isoDays = (rows: Array<{ date: Date }>) =>
    rows.map((r) => r.date.toISOString().slice(0, 10));

  it('generates Monday UTC-midnight sessions with stable week numbers', async () => {
    const { service, created } = makeService();
    await service.generateSessionsForClass(classId, orgId);
    expect(isoDays(created)).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
    for (const row of created) {
      expect(row.date.toISOString()).toMatch(/T00:00:00\.000Z$/);
    }
    expect(created.map((r) => r.week_number)).toEqual([1, 2, 3, 4]);
  });

  it('a rerun creates nothing (idempotent)', async () => {
    const stored = ['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26'].map(
      (d, i) => ({ date: calendarDateToUtc(d), sub_index: 1, week_number: i + 1 }),
    );
    const { service, attendanceRepo } = makeService(stored);
    await service.generateSessionsForClass(classId, orgId);
    expect(attendanceRepo.createManySessions).not.toHaveBeenCalled();
  });

  it('does not duplicate a date stored by the old math (legacy 16:00Z row)', async () => {
    const legacyOct12 = new Date('2026-10-11T16:00:00.000Z');
    const { service, created } = makeService([
      { date: calendarDateToUtc('2026-10-05'), sub_index: 1 },
      { date: legacyOct12, sub_index: 1 },
    ]);
    await service.generateSessionsForClass(classId, orgId);
    // Oct 5 and Oct 12 already have sessions (either row convention) —
    // only Oct 19/26 are born, keeping their original week numbers.
    expect(isoDays(created)).toEqual(['2026-10-19', '2026-10-26']);
    expect(created.map((r) => r.week_number)).toEqual([3, 4]);
  });

  it('blocked days consume no week number', async () => {
    const { service, created } = makeService();
    // Holiday on Oct 12 via the events query.
    const svc = service as unknown as {
      db: { academicCalendar: { findMany: jest.Mock } };
    };
    svc.db.academicCalendar.findMany.mockResolvedValue([
      {
        start_date: calendarDateToUtc('2026-10-12'),
        end_date: calendarDateToUtc('2026-10-12'),
      },
    ]);
    await service.generateSessionsForClass(classId, orgId);
    expect(isoDays(created)).toEqual(['2026-10-05', '2026-10-19', '2026-10-26']);
    expect(created.map((r) => r.week_number)).toEqual([1, 2, 3]);
  });
});

describe('markPresentFromSubmission day window (TICK-INFRA-017)', () => {
  it('matches the submission Manila day regardless of server TZ', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const repo = new AttendanceRepository({
      attendanceSession: { findFirst },
    } as any);
    // 23:30 Manila on Oct 6 == 15:30Z Oct 6.
    await repo.markPresentFromSubmission({
      org_id: 'org-1',
      class_id: 'c1',
      student_id: 's1',
      date: new Date('2026-10-06T15:30:00.000Z'),
    });
    const where = findFirst.mock.calls[0][0].where as {
      date: { gte: Date; lte: Date };
    };
    expect(where.date.gte.toISOString()).toBe('2026-10-05T16:00:00.000Z');
    expect(where.date.lte.toISOString()).toBe('2026-10-06T15:59:59.999Z');
  });
});
