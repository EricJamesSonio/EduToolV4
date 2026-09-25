import { AttendanceStudentService } from '../student/attendance-student.service';
import { AttendanceRepository } from '../attendance.repository';

// Perf Phase 3: student attendance view uses one batched records query;
// bulk saves use one lock-check + one transaction.

describe('AttendanceStudentService.getMyAttendance — batched records', () => {
  const sessions = [
    { id: 'sess-1', date: new Date('2026-01-05'), week_number: 1, sub_index: 0 },
    { id: 'sess-2', date: new Date('2026-01-06'), week_number: 1, sub_index: 1 },
    { id: 'sess-3', date: new Date('2026-01-07'), week_number: 2, sub_index: 0 },
  ];

  const makeService = (records: any[]) => {
    const attendanceRepo = {
      findSessionsByClass: jest.fn().mockResolvedValue(sessions),
      findRecordsByStudentInSessions: jest.fn().mockResolvedValue(records),
      findRecordBySessionAndStudent: jest.fn(),
    };
    const enrollmentRepo = {
      findOneByStudentAndClass: jest.fn().mockResolvedValue({ id: 'enr-1' }),
    };
    const service = new AttendanceStudentService(
      attendanceRepo as any,
      enrollmentRepo as any,
    );
    return { service, attendanceRepo };
  };

  it('zips sessions with records from a single batched query', async () => {
    const { service, attendanceRepo } = makeService([
      { session_id: 'sess-1', student_id: 'stu-1', status: 'present' },
      { session_id: 'sess-3', student_id: 'stu-1', status: 'late' },
    ]);

    const res = await service.getMyAttendance('class-1', 'stu-1', 'org-1');

    expect(
      attendanceRepo.findRecordsByStudentInSessions,
    ).toHaveBeenCalledTimes(1);
    expect(
      attendanceRepo.findRecordsByStudentInSessions,
    ).toHaveBeenCalledWith(['sess-1', 'sess-2', 'sess-3'], 'stu-1');
    expect(attendanceRepo.findRecordBySessionAndStudent).not.toHaveBeenCalled();

    expect(res.sessions).toEqual([
      expect.objectContaining({ sessionId: 'sess-1', status: 'present' }),
      expect.objectContaining({ sessionId: 'sess-2', status: null }),
      expect.objectContaining({ sessionId: 'sess-3', status: 'late' }),
    ]);
    expect(res.summary).toEqual({
      total: 3,
      present: 1,
      absent: 0,
      late: 1,
      excused: 0,
      unrecorded: 1,
    });
  });
});

describe('AttendanceRepository.saveRecordsBulk', () => {
  const makeRepo = (existing: Array<{ student_id: string }>) => {
    const txOps: unknown[][] = [];
    const db = {
      attendanceRecord: {
        findMany: jest.fn().mockResolvedValue(existing),
        updateMany: jest.fn((args: unknown) => ({ __updateMany: args })),
        createMany: jest.fn((args: unknown) => ({ __createMany: args })),
      },
      $transaction: jest.fn(async (ops: unknown[]) => {
        txOps.push(ops);
        return ops;
      }),
    };
    return { repo: new AttendanceRepository(db as never), db, txOps };
  };

  it('partitions into per-status updates + one createMany in a single transaction', async () => {
    const { repo, db, txOps } = makeRepo([
      { student_id: 's-1' },
      { student_id: 's-2' },
    ]);

    const res = await repo.saveRecordsBulk({
      orgId: 'org-1',
      sessionId: 'sess-1',
      entries: [
        { studentId: 's-1', status: 'present' },
        { studentId: 's-2', status: 'absent' },
        { studentId: 's-3', status: 'present' },
      ],
    });

    expect(res).toEqual({ updated: 2, created: 1 });
    expect(db.attendanceRecord.findMany).toHaveBeenCalledTimes(1);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    // 2 per-status updateMany + 1 createMany in the single transaction.
    expect(txOps[0]).toHaveLength(3);
    expect(db.attendanceRecord.createMany).toHaveBeenCalledTimes(1);
  });

  it('last entry wins on duplicate student ids; empty input issues no queries', async () => {
    const { repo, db } = makeRepo([]);
    const res = await repo.saveRecordsBulk({
      orgId: 'org-1',
      sessionId: 'sess-1',
      entries: [
        { studentId: 's-1', status: 'absent' },
        { studentId: 's-1', status: 'present' },
      ],
    });
    expect(res).toEqual({ updated: 0, created: 1 });
    expect(db.attendanceRecord.createMany).toHaveBeenCalledWith({
      data: [
        {
          org_id: 'org-1',
          session_id: 'sess-1',
          student_id: 's-1',
          status: 'present',
        },
      ],
      skipDuplicates: true,
    });

    const empty = await repo.saveRecordsBulk({
      orgId: 'org-1',
      sessionId: 'sess-1',
      entries: [],
    });
    expect(empty).toEqual({ updated: 0, created: 0 });
    expect(db.attendanceRecord.findMany).toHaveBeenCalledTimes(1);
  });
});
