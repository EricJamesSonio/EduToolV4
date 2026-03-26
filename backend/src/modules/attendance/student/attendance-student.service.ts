// @/modules/attendance/student/attendance-student.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { AttendanceRepository } from '../attendance.repository';
import { ClassRepository } from '@/modules/class/class.repository';

@Injectable()
export class AttendanceStudentService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository,
    private readonly classRepo: ClassRepository,
  ) {}

  async getMyAttendance(classId: string, studentId: string, orgId: string) {
    // Guard: student must be enrolled
    const enrollment = await this.classRepo.findEnrolledClassByStudent(
      classId,
      studentId,
      orgId,
    );
    if (!enrollment) throw new ForbiddenException('Not enrolled in this class.');

    // Fetch all sessions for the class
    const sessions = await this.attendanceRepo.findSessionsByClass(classId);

    // Fetch all records for this student across all sessions
    const allRecords = await Promise.all(
      sessions.map((s) =>
        this.attendanceRepo.findRecordBySessionAndStudent(s.id, studentId),
      ),
    );

    // Zip sessions + their record for this student
    const sessionRows = sessions.map((session, i) => ({
      sessionId: session.id,
      date: session.date,
      weekNumber: session.week_number,
      subIndex: session.sub_index,
      status: allRecords[i]?.status ?? null, // null = not yet recorded
    }));

    // Summary counts
    const recorded = allRecords.filter(Boolean);
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