import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { startOfDayInZone } from '@/commons/utils/datetime.util';

@Injectable()
export class SemesterEnrollmentService {
  private readonly logger = new Logger(SemesterEnrollmentService.name);

  constructor(private readonly db: DatabaseService) {}

  async closeEndedSemesterEnrollments(
    now: Date = new Date(),
  ): Promise<{ semesters: number; closed: number }> {
    const cutoff = startOfDayInZone(now);

    const ended = await this.db.semester.findMany({
      where: { end_date: { lt: cutoff } },
      select: { id: true },
    });
    if (ended.length === 0) return { semesters: 0, closed: 0 };

    const classFilter = { semester_id: { in: ended.map((s) => s.id) } };

    const completed = await this.db.enrollment.updateMany({
      where: { status: 'active', outcome: null, class: classFilter },
      data: {
        status: 'removed',
        outcome: 'completed',
        outcome_reason: 'Semester ended',
        outcome_set_at: now,
      },
    });

    const rest = await this.db.enrollment.updateMany({
      where: { status: { in: ['active', 'pending'] }, class: classFilter },
      data: { status: 'removed' },
    });

    const closed = completed.count + rest.count;
    if (closed > 0) {
      this.logger.log(
        `Closed ${closed} enrollment(s) from ${ended.length} ended semester(s). Records kept as read-only.`,
      );
    }
    return { semesters: ended.length, closed };
  }
}