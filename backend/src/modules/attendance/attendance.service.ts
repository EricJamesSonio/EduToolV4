// src/modules/attendance/attendance.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';
import { AttendanceRepository } from './attendance.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  BulkSetAttendanceDto,
  UpdateAttendanceRecordDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  // ─── Auto-generate sessions when class is created ────────────

  async generateSessionsForClass(classId: string, orgId: string): Promise<void> {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
      include: { schedules: true },
    });

    if (!cls || !cls.schedules.length) return;

    const semester = await this.db.semester.findUnique({
      where: { id: cls.semester_id },
      include: { terms: { orderBy: { order_index: 'asc' } } },
    });

    if (!semester) return;

    const semesterStart = new Date(semester.start_date);
    const semesterEnd = new Date(semester.end_date);

    // Fetch all holidays + no_class_day events for this school year
    const calendarEvents = await this.db.academicCalendar.findMany({
      where: {
        org_id: orgId,
        school_year_id: cls.school_year_id,
        type: { in: ['holiday', 'no_class_day'] },
      },
    });

    const isBlockedDate = (date: Date): boolean => {
      return calendarEvents.some((event) => {
        const start = new Date(event.start_date);
        const end = new Date(event.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      });
    };

    const scheduleWeekdays = cls.schedules.map((s) => s.weekday).sort((a, b) => a - b);

    const sessions: {
      org_id: string;
      class_id: string;
      date: Date;
      week_number: number;
      sub_index: number;
    }[] = [];

    let weekNumber = 1;
    let currentWeekBoundary = this.getWeekStart(semesterStart);

    const current = new Date(semesterStart);
    current.setHours(0, 0, 0, 0);

    while (current <= semesterEnd) {
      const thisWeekStart = this.getWeekStart(current);

      if (thisWeekStart > currentWeekBoundary) {
        weekNumber++;
        currentWeekBoundary = thisWeekStart;
      }

      const dayOfWeek = current.getDay();

      if (scheduleWeekdays.includes(dayOfWeek) && !isBlockedDate(current)) {
        // sub_index = position of this weekday among the scheduled weekdays (1-based)
        const sub_index = scheduleWeekdays.indexOf(dayOfWeek) + 1;

        sessions.push({
          org_id: orgId,
          class_id: classId,
          date: new Date(current),
          week_number: weekNumber,
          sub_index,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    if (sessions.length > 0) {
      await this.attendanceRepo.createManySessions(sessions);
    }
  }

  // ─── Get sessions grouped by week ────────────────────────────

  async getSessions(classId: string, orgId: string, weekNumber?: number) {
    await this.assertClassExists(classId, orgId);

    const sessions = await this.attendanceRepo.findSessionsByClass(
      classId,
      weekNumber,
    );

    // Group by week_number
    const grouped: Record<number, typeof sessions> = {};
    for (const session of sessions) {
      if (!grouped[session.week_number]) grouped[session.week_number] = [];
      grouped[session.week_number].push(session);
    }

    return Object.entries(grouped).map(([week, items]) => ({
      week_number: Number(week),
      sessions: items,
    }));
  }

  // ─── Get single session + records ────────────────────────────

  async getSession(classId: string, sessionId: string, orgId: string) {
    await this.assertClassExists(classId, orgId);

    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session || session.class_id !== classId) {
      throw new NotFoundException('Session not found.');
    }

    const records = await this.attendanceRepo.findRecordsBySession(sessionId);
    return { ...session, records };
  }

  // ─── Bulk set attendance ──────────────────────────────────────

  async bulkSetAttendance(
    classId: string,
    sessionId: string,
    orgId: string,
    actorId: string,
    dto: BulkSetAttendanceDto,
  ) {
    await this.assertClassExists(classId, orgId);

    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session || session.class_id !== classId) {
      throw new NotFoundException('Session not found.');
    }

    // Validate all students are actively enrolled
    const enrollments = await this.db.enrollment.findMany({
      where: { class_id: classId, status: 'active' },
      select: { student_id: true },
    });
    const enrolledIds = new Set(enrollments.map((e) => e.student_id));

    for (const entry of dto.records) {
      if (!enrolledIds.has(entry.studentId)) {
        throw new BadRequestException(
          `Student ${entry.studentId} is not actively enrolled in this class.`,
        );
      }
    }

    await Promise.all(
      dto.records.map((entry) =>
        this.attendanceRepo.upsertRecord({
          org_id: orgId,
          session_id: sessionId,
          student_id: entry.studentId,
          status: entry.status,
        }),
      ),
    );

    await this.auditLog.logActivityEvent({
      orgId,
      actorId,
      action: 'attendance_bulk_set',
      entityType: 'AttendanceSession',
      entityId: sessionId,
      metadata: { classId, count: dto.records.length },
    });

    return { message: 'Attendance saved.', count: dto.records.length };
  }

  // ─── Override single record ───────────────────────────────────

  async updateRecord(
    classId: string,
    sessionId: string,
    recordId: string,
    orgId: string,
    actorId: string,
    dto: UpdateAttendanceRecordDto,
  ) {
    await this.assertClassExists(classId, orgId);

    const session = await this.attendanceRepo.findSessionById(sessionId);
    if (!session || session.class_id !== classId) {
      throw new NotFoundException('Session not found.');
    }

    const record = await this.attendanceRepo.findRecordById(recordId);
    if (!record || record.session_id !== sessionId) {
      throw new NotFoundException('Attendance record not found.');
    }

    const updated = await this.attendanceRepo.updateRecord(recordId, dto.status);

    await this.auditLog.logActivityEvent({
      orgId,
      actorId,
      action: 'attendance_record_updated',
      entityType: 'AttendanceRecord',
      entityId: recordId,
      metadata: { status: dto.status, sessionId, classId },
    });

    return updated;
  }

  // ─── Called by AssessmentService on submission finish ─────────

  async markPresentFromSubmission(data: {
    orgId: string;
    classId: string;
    studentId: string;
    submittedAt: Date;
  }) {
    await this.attendanceRepo.markPresentFromSubmission({
      org_id: data.orgId,
      class_id: data.classId,
      student_id: data.studentId,
      date: data.submittedAt,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async assertClassExists(classId: string, orgId: string) {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
    });
    if (!cls) throw new NotFoundException('Class not found.');
    return cls;
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // ISO week: Monday = start
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}