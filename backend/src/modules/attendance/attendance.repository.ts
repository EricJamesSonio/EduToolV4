// @/modules/attendance/attendance.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { AttendanceStatus } from './dto/attendance.dto';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly db: DatabaseService) {}

  // ─── Sessions ────────────────────────────────────────────────

  async createManySessions(
    sessions: {
      org_id: string;
      class_id: string;
      date: Date;
      week_number: number;
      sub_index: number;
    }[],
  ) {
    return this.db.attendanceSession.createMany({
      data: sessions,
      skipDuplicates: true,
    });
  }

  async findSessionsByClass(classId: string, weekNumber?: number) {
    return this.db.attendanceSession.findMany({
      where: {
        class_id: classId,
        ...(weekNumber ? { week_number: weekNumber } : {}),
      },
      orderBy: [{ week_number: 'asc' }, { sub_index: 'asc' }],
    });
  }

  async findSessionById(id: string) {
    return this.db.attendanceSession.findUnique({ where: { id } });
  }

  // ─── Records ─────────────────────────────────────────────────

  async findRecordsBySession(sessionId: string) {
    return this.db.attendanceRecord.findMany({
      where: { session_id: sessionId },
    });
  }

  async findRecordById(id: string) {
    return this.db.attendanceRecord.findUnique({ where: { id } });
  }

  async findRecordBySessionAndStudent(sessionId: string, studentId: string) {
    return this.db.attendanceRecord.findFirst({
      where: { session_id: sessionId, student_id: studentId },
    });
  }

  async updateRecord(id: string, status: AttendanceStatus) {
    return this.db.attendanceRecord.update({
      where: { id },
      data: { status },
    });
  }

  async upsertRecord(data: {
    org_id: string;
    session_id: string;
    student_id: string;
    status: string;
  }) {
    const existing = await this.findRecordBySessionAndStudent(
      data.session_id,
      data.student_id,
    );

    if (existing) {
      return this.db.attendanceRecord.update({
        where: { id: existing.id },
        data: { status: data.status as any },
      });
    }

    return this.db.attendanceRecord.create({ data: { ...data, status: data.status as any } });
  }

  async markPresentFromSubmission(data: {
    org_id: string;
    class_id: string;
    student_id: string;
    date: Date;
  }) {
    const dayStart = new Date(data.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(data.date);
    dayEnd.setHours(23, 59, 59, 999);

    const session = await this.db.attendanceSession.findFirst({
      where: {
        class_id: data.class_id,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (!session) return null;

    return this.upsertRecord({
      org_id: data.org_id,
      session_id: session.id,
      student_id: data.student_id,
      status: 'present',
    });
  }
}