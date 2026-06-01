import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceService } from '../attendance.service';

describe('AttendanceService (High-Value Tests)', () => {
  let service: AttendanceService;

  const db = {
    class: { findUnique: jest.fn(), findFirst: jest.fn() },
    subject: { findFirst: jest.fn() },
    programSemesterAssignment: { findFirst: jest.fn() },
    academicCalendar: { findMany: jest.fn() },
    semester: { findUnique: jest.fn() },
    enrollment: { findMany: jest.fn() },
    account: { findMany: jest.fn() },
  };

  const attendanceRepo = {
    createManySessions: jest.fn(),
    findSessionsByClass: jest.fn(),
    findSessionById: jest.fn(),
    findRecordsBySession: jest.fn(),
    findRecordById: jest.fn(),
    updateRecord: jest.fn(),
    upsertRecord: jest.fn(),
    markPresentFromSubmission: jest.fn(),
  };

  const auditLog = {
    logActivityEvent: jest.fn(),
  };

  const lessonService = {
    syncLessonsFromAttendance: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AttendanceService(
      db as any,
      attendanceRepo as any,
      auditLog as any,
      lessonService as any,
    );
  });

  // ─────────────────────────────────────────────
  // 1. SESSION GENERATION SAFETY
  // ─────────────────────────────────────────────

  it('does nothing when class has no schedules', async () => {
    db.class.findUnique.mockResolvedValue({
      schedules: [],
    });

    await service.generateSessionsForClass('c1', 'org1');

    expect(attendanceRepo.createManySessions).not.toHaveBeenCalled();
    expect(lessonService.syncLessonsFromAttendance).not.toHaveBeenCalled();
  });

  it('does nothing when subject has no program', async () => {
    db.class.findUnique.mockResolvedValue({
      schedules: [{ weekday: 1 }],
    });

    db.subject.findFirst.mockResolvedValue(null);

    await service.generateSessionsForClass('c1', 'org1');

    expect(attendanceRepo.createManySessions).not.toHaveBeenCalled();
  });

  it('creates sessions and syncs lessons when valid data exists', async () => {
    db.class.findUnique.mockResolvedValue({
      id: 'c1',
      schedules: [{ weekday: 1 }],
      subject_id: 's1',
      school_year_id: 'sy1',
    });

    db.subject.findFirst.mockResolvedValue({
      program_id: 'p1',
    });

    db.programSemesterAssignment.findFirst.mockResolvedValue({
      template: {
        semesters: [
          {
            terms: [{ id: 't1' }],
          },
        ],
      },
      termDates: [
        {
          term_id: 't1',
          start_date: new Date('2025-01-01'),
          end_date: new Date('2025-01-10'),
        },
      ],
    });

    db.academicCalendar.findMany.mockResolvedValue([]);

    db.semester.findUnique.mockResolvedValue({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-02-01'),
    });

    await service.generateSessionsForClass('c1', 'org1');

    expect(attendanceRepo.createManySessions).toHaveBeenCalled();
    expect(lessonService.syncLessonsFromAttendance).toHaveBeenCalledWith(
      'c1',
      'org1',
    );
  });

  // ─────────────────────────────────────────────
  // 2. BLOCKED DATE LOGIC (FIXED)
  // ─────────────────────────────────────────────

  it('does not create sessions on blocked calendar dates', async () => {
    db.class.findUnique.mockResolvedValue({
      id: 'c1',
      schedules: [{ weekday: 1 }],
      subject_id: 's1',
      school_year_id: 'sy1',
    });

    db.subject.findFirst.mockResolvedValue({
      program_id: 'p1',
    });

    db.programSemesterAssignment.findFirst.mockResolvedValue({
      template: { semesters: [{ terms: [{ id: 't1' }] }] },
      termDates: [
        {
          term_id: 't1',
          start_date: new Date('2025-01-01'),
          end_date: new Date('2025-01-10'),
        },
      ],
    });

    // BLOCK EVERYTHING
    db.academicCalendar.findMany.mockResolvedValue([
      {
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-01-10'),
        type: 'holiday',
      },
    ]);

    db.semester.findUnique.mockResolvedValue({
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-02-01'),
    });

    await service.generateSessionsForClass('c1', 'org1');

    // ✅ FIX: function is NOT called when sessions.length === 0
    expect(attendanceRepo.createManySessions).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // 3. CLASS SECURITY GUARD
  // ─────────────────────────────────────────────

  it('throws when class does not exist', async () => {
    db.class.findFirst.mockResolvedValue(null);

    await expect(
      service.getSessions('c1', 'org1'),
    ).rejects.toThrow(NotFoundException);
  });

  // ─────────────────────────────────────────────
  // 4. SESSION ACCESS CONTROL
  // ─────────────────────────────────────────────

  it('throws when session does not belong to class', async () => {
    db.class.findFirst.mockResolvedValue({ id: 'c1' });

    attendanceRepo.findSessionById.mockResolvedValue({
      id: 's1',
      class_id: 'other-class',
    });

    await expect(
      service.getSession('c1', 's1', 'org1'),
    ).rejects.toThrow(NotFoundException);
  });

  // ─────────────────────────────────────────────
  // 5. BULK ATTENDANCE VALIDATION
  // ─────────────────────────────────────────────

  it('rejects bulk update if student is not enrolled', async () => {
    db.class.findFirst.mockResolvedValue({ id: 'c1' });

    attendanceRepo.findSessionById.mockResolvedValue({
      id: 's1',
      class_id: 'c1',
    });

    db.enrollment.findMany.mockResolvedValue([
      { student_id: 's1' },
    ]);

    await expect(
      service.bulkSetAttendance(
        'c1',
        's1',
        'org1',
        'actor1',
        {
          records: [{ studentId: 'bad-student', status: 'P' }],
        } as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('writes attendance records when all students valid', async () => {
    db.class.findFirst.mockResolvedValue({ id: 'c1' });

    attendanceRepo.findSessionById.mockResolvedValue({
      id: 's1',
      class_id: 'c1',
    });

    db.enrollment.findMany.mockResolvedValue([
      { student_id: 's1' },
    ]);

    await service.bulkSetAttendance(
      'c1',
      's1',
      'org1',
      'actor1',
      {
        records: [{ studentId: 's1', status: 'P' }],
      } as any,
    );

    expect(attendanceRepo.upsertRecord).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // 6. UPDATE RECORD SAFETY
  // ─────────────────────────────────────────────

  it('rejects update when record does not belong to session', async () => {
    db.class.findFirst.mockResolvedValue({ id: 'c1' });

    attendanceRepo.findSessionById.mockResolvedValue({
      id: 's1',
      class_id: 'c1',
    });

    attendanceRepo.findRecordById.mockResolvedValue({
      id: 'r1',
      session_id: 'other-session',
    });

    await expect(
      service.updateRecord(
        'c1',
        's1',
        'r1',
        'org1',
        'actor1',
        { status: 'P' } as any,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates record when valid', async () => {
    db.class.findFirst.mockResolvedValue({ id: 'c1' });

    attendanceRepo.findSessionById.mockResolvedValue({
      id: 's1',
      class_id: 'c1',
    });

    attendanceRepo.findRecordById.mockResolvedValue({
      id: 'r1',
      session_id: 's1',
    });

    attendanceRepo.updateRecord.mockResolvedValue({
      id: 'r1',
      status: 'P',
    });

    const result = await service.updateRecord(
      'c1',
      's1',
      'r1',
      'org1',
      'actor1',
      { status: 'P' } as any,
    );

    expect(result.status).toBe('P');
  });

  // ─────────────────────────────────────────────
  // 7. AUTO MARK ATTENDANCE
  // ─────────────────────────────────────────────

  it('calls repo when marking present from submission', async () => {
    await service.markPresentFromSubmission({
      orgId: 'org1',
      classId: 'c1',
      studentId: 's1',
      submittedAt: new Date('2025-01-01'),
    });

    expect(attendanceRepo.markPresentFromSubmission).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────
  // 8. SESSION GROUPING LOGIC
  // ─────────────────────────────────────────────

  it('groups sessions by week number', async () => {
    db.class.findFirst.mockResolvedValue({ id: 'c1' });

    attendanceRepo.findSessionsByClass.mockResolvedValue([
      { week_number: 1 },
      { week_number: 1 },
      { week_number: 2 },
    ]);

    const result = await service.getSessions('c1', 'org1');

    expect(result.length).toBe(2);
  });
});