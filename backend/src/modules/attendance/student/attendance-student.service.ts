// @/modules/attendance/student/attendance-student.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { AttendanceRepository } from '../attendance.repository';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository'; // ✅ changed

@Injectable()
export class AttendanceStudentService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly enrollmentRepo: EnrollmentRepository, // ✅ changed
  ) {}

  async getMyAttendance(classId: string, studentId: string, orgId: string) {
    // Guard: student must be enrolled
    const enrollment = await this.enrollmentRepo.findOneByStudentAndClass(
      classId,
      studentId,
      orgId,
    );

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this class.');
    }

    // Fetch all sessions for the class
    const sessions = await this.attendanceRepo.findSessionsByClass(classId);

    // Perf Phase 3: one batched query for this student's records across all
    // sessions instead of one findFirst per session.
    const records =
      await this.attendanceRepo.findRecordsByStudentInSessions(
        sessions.map((s) => s.id),
        studentId,
      );
    // First row wins per session, matching the previous findFirst semantics.
    const recordBySession = new Map<string, (typeof records)[number]>();
    for (const record of records) {
      if (!recordBySession.has(record.session_id)) {
        recordBySession.set(record.session_id, record);
      }
    }

    // Zip sessions + their record for this student
    const sessionRows = sessions.map((session) => ({
      sessionId: session.id,
      date: session.date,
      weekNumber: session.week_number,
      subIndex: session.sub_index,
      status: recordBySession.get(session.id)?.status ?? null, // null = not yet recorded
    }));

    // Summary counts
    const recorded = [...recordBySession.values()];

    const summary = {
      total: sessions.length,
      present: recorded.filter((r) => r!.status === 'present').length,
      absent: recorded.filter((r) => r!.status === 'absent').length,
      late: recorded.filter((r) => r!.status === 'late').length,
      excused: recorded.filter((r) => r!.status === 'excused').length,
      unrecorded: sessions.length - recorded.length,
    };

    return { summary, sessions: sessionRows };
  }
}
