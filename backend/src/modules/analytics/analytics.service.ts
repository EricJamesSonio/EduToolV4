import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnalyticsDateRange,
  AnalyticsRepository,
} from './analytics.repository';
import {
  AnalyticsRangeQueryDto,
  GradeAnalyticsQueryDto,
} from './dto/analytics.dto';

type TimelineInterval = 'day' | 'week' | 'month';

interface TimelinePoint {
  bucket: string;
  active: number;
  pending: number;
  unenrolled: number;
  total: number;
}

interface DonutSlice {
  key: string;
  label: string;
  value: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  unenrolled: 'Unenrolled',
};

const STATUS_ORDER = ['active', 'pending', 'unenrolled'];

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfBucket(date: Date, interval: TimelineInterval): Date {
  const day = startOfUtcDay(date);
  if (interval === 'day') return day;
  if (interval === 'week') {
    const offsetFromMonday = (day.getUTCDay() + 6) % 7;
    return new Date(day.getTime() - offsetFromMonday * DAY_MS);
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function nextBucket(date: Date, interval: TimelineInterval): Date {
  if (interval === 'day') return new Date(date.getTime() + DAY_MS);
  if (interval === 'week') return new Date(date.getTime() + 7 * DAY_MS);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function bucketKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pickInterval(start: Date, end: Date): TimelineInterval {
  const spanDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY_MS));
  if (spanDays <= 45) return 'day';
  if (spanDays <= 200) return 'week';
  return 'month';
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  private async resolveSchoolYear(
    orgId: string,
    schoolYearId?: string,
  ): Promise<string> {
    if (schoolYearId) return schoolYearId;
    const active = await this.repo.getActiveSchoolYear(orgId);
    if (!active) throw new NotFoundException('No active school year found.');
    return active.id;
  }

  private parseRange(
    query: AnalyticsRangeQueryDto,
  ): AnalyticsDateRange | undefined {
    const { startDate, endDate } = query;
    if (!startDate && !endDate) return undefined;
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Both startDate and endDate are required when filtering by date.',
      );
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date range.');
    }
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException('startDate must not be after endDate.');
    }
    return { start, end };
  }

  async getOverview(orgId: string, schoolYearId?: string) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);

    const [totalStudents, pendingStudents, totalEducators, totalClasses] =
      await Promise.all([
        this.repo.countStudents(orgId, syId),
        this.repo.countPendingStudents(orgId, syId),
        this.repo.countEducators(orgId),
        this.repo.countClasses(orgId, syId),
      ]);

    return {
      totalStudents,
      pendingStudents,
      totalEducators,
      totalClasses,
      schoolYearId: syId,
    };
  }

  async getEnrollmentBreakdown(
    orgId: string,
    schoolYearId?: string,
    page = 1,
    limit = 20,
  ) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    return this.repo.getEnrollmentBreakdown(orgId, syId, page, limit);
  }

  async getEnrollmentTimeline(orgId: string, query: AnalyticsRangeQueryDto) {
    const syId = await this.resolveSchoolYear(orgId, query.schoolYearId);
    const range = this.parseRange(query);
    const rows = await this.repo.getEnrollmentRows(orgId, syId, range);

    const totals = { active: 0, pending: 0, unenrolled: 0, total: 0 };

    if (rows.length === 0 && !range) {
      return { interval: 'month' as TimelineInterval, points: [], totals };
    }

    const start = range?.start ?? rows[0].enrolled_at;
    const end = range?.end ?? rows[rows.length - 1].enrolled_at;
    const interval = pickInterval(start, end);

    const buckets = new Map<string, TimelinePoint>();
    let cursor = startOfBucket(start, interval);
    let guard = 0;
    while (cursor.getTime() <= end.getTime() && guard < 400) {
      const key = bucketKey(cursor);
      buckets.set(key, {
        bucket: key,
        active: 0,
        pending: 0,
        unenrolled: 0,
        total: 0,
      });
      cursor = nextBucket(cursor, interval);
      guard += 1;
    }

    for (const row of rows) {
      const point = buckets.get(
        bucketKey(startOfBucket(row.enrolled_at, interval)),
      );
      if (!point) continue;
      if (row.status === 'active') {
        point.active += 1;
        totals.active += 1;
      } else if (row.status === 'pending') {
        point.pending += 1;
        totals.pending += 1;
      } else {
        point.unenrolled += 1;
        totals.unenrolled += 1;
      }
      point.total += 1;
      totals.total += 1;
    }

    return { interval, points: Array.from(buckets.values()), totals };
  }

  async getEnrollmentDistribution(
    orgId: string,
    query: AnalyticsRangeQueryDto,
  ) {
    const syId = await this.resolveSchoolYear(orgId, query.schoolYearId);
    const range = this.parseRange(query);
    const raw = await this.repo.getEnrollmentDistribution(orgId, syId, range);

    const statusCounts = new Map(
      raw.statusGroups.map((group) => [String(group.status), group.count]),
    );
    const studentStatus: DonutSlice[] = STATUS_ORDER.map((key) => ({
      key,
      label: STATUS_LABELS[key],
      value: statusCounts.get(key) ?? 0,
    }));

    const programs: DonutSlice[] = raw.programGroups
      .map((group) => ({
        key: group.programId,
        label: group.name,
        value: group.count,
      }))
      .sort((a, b) => b.value - a.value);

    const sectionAssignment: DonutSlice[] = [
      { key: 'assigned', label: 'Assigned to a section', value: raw.assigned },
      { key: 'unassigned', label: 'No section yet', value: raw.unassigned },
    ];

    return { studentStatus, programs, sectionAssignment };
  }

  async getGradeAnalytics(
    orgId: string,
    query: GradeAnalyticsQueryDto,
    schoolYearId?: string,
  ) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    // Perf Phase 4: stats come from SQL groupBy/aggregate (no row transfer).
    const stats = await this.repo.getGradeStats(orgId, syId, query);

    if (!stats.total) return { passingRate: 0, distribution: {} };

    return {
      passingRate: stats.passCount / stats.total,
      distribution: stats.distribution,
    };
  }

  async getEducatorLoad(orgId: string, schoolYearId?: string) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    return this.repo.getEducatorLoad(orgId, syId);
  }

  async getAlerts(orgId: string, schoolYearId?: string) {
    const syId = await this.resolveSchoolYear(orgId, schoolYearId);
    const [pendingStudents, unlockedClasses] = await Promise.all([
      this.repo.countPendingStudents(orgId, syId),
      this.repo.countUnlockedClasses(orgId, syId),
    ]);
    return { pendingStudents, unlockedClasses };
  }
}