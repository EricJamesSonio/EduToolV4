import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { DatabaseService } from '@/core/database/database.provider';
import { AttendanceRepository } from './attendance.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  BulkSetAttendanceDto,
  UpdateAttendanceRecordDto,
} from './dto/attendance.dto';
import { LessonService } from '../lesson/lesson.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly attendanceRepo: AttendanceRepository,
    private readonly auditLog: AuditLogService,
    private readonly lessonService: LessonService,
  ) {}

  // =========================================================
  // 🔥 MAIN FIXED GENERATOR (SYNCED WITH LESSON LOGIC)
  // =========================================================
  async generateSessionsForClass(classId: string, orgId: string): Promise<void> {
    const cls = await this.db.class.findUnique({
      where: { id: classId },
      include: { schedules: true },
    });

    if (!cls || !cls.schedules.length) return;

    const subject = await this.db.subject.findFirst({
      where: { id: cls.subject_id },
      select: { program_id: true },
    });

    if (!subject?.program_id) return;

    const assignment = await this.db.programSemesterAssignment.findFirst({
      where: {
        program_id: subject.program_id,
        org_id: orgId,
      },
      include: {
        template: {
          include: {
            semesters: {
              include: {
                terms: true,
              },
            },
          },
        },
        termDates: true,
      },
    });

    if (!assignment) return;

    // -------------------------------
    // term date map (source of truth)
    // -------------------------------
    const termDatesMap = new Map<string, { start: Date; end: Date }>();

    for (const td of assignment.termDates ?? []) {
      termDatesMap.set(td.term_id, {
        start: new Date(td.start_date),
        end: new Date(td.end_date),
      });
    }

    // -------------------------------
    // blocked dates (holidays, etc.)
    // -------------------------------
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

    const scheduleWeekdays = cls.schedules
      .map((s) => s.weekday)
      .sort((a, b) => a - b);

    const sessions: {
      org_id: string;
      class_id: string;
      date: Date;
      week_number: number;
      sub_index: number;
    }[] = [];

    let globalWeek = 1;

    const semesters = assignment.template.semesters ?? [];

    // =========================================================
    // 🔥 CORE LOOP (SYNCED WITH LESSON SYSTEM)
    // =========================================================
    for (const sem of semesters) {
      const terms = sem.terms ?? [];

      for (const term of terms) {
        const dates = termDatesMap.get(term.id);
        if (!dates) continue;

        for (const weekday of scheduleWeekdays) {
          const occurrences = this.getWeekdayOccurrences(
            dates.start,
            dates.end,
            weekday,
          );

          for (const date of occurrences) {
            if (isBlockedDate(date)) continue;

            sessions.push({
              org_id: orgId,
              class_id: classId,
              date,
              week_number: globalWeek,
              sub_index: scheduleWeekdays.indexOf(weekday) + 1,
            });

            globalWeek++;
          }
        }
      }
    }

    if (sessions.length > 0) {
      await this.attendanceRepo.createManySessions(sessions);
      await this.lessonService.syncLessonsFromAttendance(classId, orgId);
      
    }
    
  }

  // =========================================================
  // GET SESSIONS
  // =========================================================
  async getSessions(classId: string, orgId: string, weekNumber?: number) {
    await this.assertClassExists(classId, orgId);

    const sessions = await this.attendanceRepo.findSessionsByClass(
      classId,
      weekNumber,
    );

    const grouped: Record<number, typeof sessions> = {};

    for (const session of sessions) {
      if (!grouped[session.week_number]) {
        grouped[session.week_number] = [];
      }
      grouped[session.week_number].push(session);
    }

    return Object.entries(grouped).map(([week, items]) => ({
      week_number: Number(week),
      sessions: items,
    }));
  }

  // =========================================================
  // SINGLE SESSION
  // =========================================================
  async getSession(classId: string, sessionId: string, orgId: string) {
    await this.assertClassExists(classId, orgId);

    const session = await this.attendanceRepo.findSessionById(sessionId);

    if (!session || session.class_id !== classId) {
      throw new NotFoundException('Session not found.');
    }

    const records = await this.attendanceRepo.findRecordsBySession(sessionId);

    const enrollments = await this.db.enrollment.findMany({
      where: { class_id: classId, status: 'active' },
      select: { student_id: true },
    });

    const studentIds = enrollments.map((e) => e.student_id);

    const accounts = await this.db.account.findMany({
      where: { id: { in: studentIds } },
      include: {
        profile: { select: { full_name: true } },
      },
    });

    const accountsMap = new Map(accounts.map((a) => [a.id, a]));

    const students = enrollments.map((e) => {
      const acc = accountsMap.get(e.student_id);
      return {
        id: e.student_id,
        name: acc?.profile?.full_name ?? acc?.email?.split('@')[0] ?? 'Unknown',
        code: acc?.email?.split('@')[0] ?? e.student_id.slice(0, 8),
      };
    });

    return { ...session, records, students };
  }

  // =========================================================
  // BULK ATTENDANCE
  // =========================================================
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

    return {
      message: 'Attendance saved.',
      count: dto.records.length,
    };
  }

  // =========================================================
  // UPDATE RECORD
  // =========================================================
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

    const updated = await this.attendanceRepo.updateRecord(
      recordId,
      dto.status,
    );

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

  // =========================================================
  // AUTO MARK FROM SUBMISSION
  // =========================================================
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

  // =========================================================
  // HELPERS
  // =========================================================
  private async assertClassExists(classId: string, orgId: string) {
    const cls = await this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
    });

    if (!cls) throw new NotFoundException('Class not found.');
    return cls;
  }

  private getWeekdayOccurrences(
    start: Date,
    end: Date,
    weekday: number,
  ): Date[] {
    const dates: Date[] = [];

    const current = new Date(start);

    const diff = (weekday - current.getDay() + 7) % 7;
    current.setDate(current.getDate() + diff);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }

    return dates;
  }
}