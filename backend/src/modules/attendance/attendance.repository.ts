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

  /**
   * Batched variant for student views: all of one student's records across
   * many sessions in one query instead of one findFirst per session.
   */
  async findRecordsByStudentInSessions(
    sessionIds: string[],
    studentId: string,
  ) {
    if (sessionIds.length === 0) return [];
    return this.db.attendanceRecord.findMany({
      where: { session_id: { in: sessionIds }, student_id: studentId },
    });
  }

  /**
   * Bulk-save a whole session's attendance: one SELECT for existing rows,
   * then a single $transaction of per-status updateMany + one createMany
   * (skipDuplicates) instead of 2 queries per record. Last entry wins per
   * student, matching sequential upsert order.
   */
  async saveRecordsBulk(args: {
    orgId: string;
    sessionId: string;
    entries: Array<{ studentId: string; status: string }>;
  }): Promise<{ updated: number; created: number }> {
    if (args.entries.length === 0) return { updated: 0, created: 0 };

    const existing = await this.db.attendanceRecord.findMany({
      where: {
        session_id: args.sessionId,
        student_id: {
          in: [...new Set(args.entries.map((e) => e.studentId))],
        },
      },
      select: { student_id: true },
    });
    const existingIds = new Set(existing.map((r) => r.student_id));

    const statusByStudent = new Map<string, string>();
    for (const entry of args.entries) {
      statusByStudent.set(entry.studentId, entry.status);
    }

    const idsByStatus = new Map<string, string[]>();
    const toCreate: string[] = [];
    for (const [studentId, status] of statusByStudent) {
      if (existingIds.has(studentId)) {
        const ids = idsByStatus.get(status);
        if (ids) ids.push(studentId);
        else idsByStatus.set(status, [studentId]);
      } else {
        toCreate.push(studentId);
      }
    }

    const ops: unknown[] = [
      ...[...idsByStatus.entries()].map(([status, ids]) =>
        this.db.attendanceRecord.updateMany({
          where: { session_id: args.sessionId, student_id: { in: ids } },
          data: { status: status as AttendanceStatus },
        }),
      ),
    ];
    if (toCreate.length > 0) {
      ops.push(
        this.db.attendanceRecord.createMany({
          data: toCreate.map((studentId) => ({
            org_id: args.orgId,
            session_id: args.sessionId,
            student_id: studentId,
            status: statusByStudent.get(studentId) as AttendanceStatus,
          })),
          skipDuplicates: true,
        }),
      );
    }
    await this.db.$transaction(ops as any);

    return { updated: statusByStudent.size - toCreate.length, created: toCreate.length };
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

    return this.db.attendanceRecord.create({
      data: { ...data, status: data.status as any },
    });
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
