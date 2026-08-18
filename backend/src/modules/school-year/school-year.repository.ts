import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SchoolYearRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    name: string;
    start_date?: string;
    end_date?: string;
  }) {
    return this.db.schoolYear.create({
      data: {
        org_id: data.orgId,
        name: data.name,
        status: 'pending',
        start_date: data.start_date ? new Date(data.start_date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
      },
    });
  }

  async findAll(orgId: string) {
    return this.db.schoolYear.findMany({
      where: { org_id: orgId },
      orderBy: { name: 'desc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async findActive(orgId: string) {
    return this.db.schoolYear.findFirst({
      where: { org_id: orgId, status: 'active' },
    });
  }

  async countActive(orgId: string): Promise<number> {
    return this.db.schoolYear.count({
      where: { org_id: orgId, status: 'active' },
    });
  }

  async updateStatus(id: string, status: 'pending' | 'active' | 'ended') {
    return this.db.schoolYear.update({
      where: { id },
      data: { status },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      start_date?: string | null;
      end_date?: string | null;
    },
  ) {
    return this.db.schoolYear.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.start_date !== undefined && {
          start_date: data.start_date ? new Date(data.start_date) : null,
        }),
        ...(data.end_date !== undefined && {
          end_date: data.end_date ? new Date(data.end_date) : null,
        }),
      },
    });
  }

  /**
   * Counts, per school year, how many scoped child rows exist across the
   * models that reference SchoolYear via school_year_id. Used to determine
   * whether a school year is "in use" (i.e. not just created and unused).
   * Enrollment is intentionally omitted because it implies an existing Class,
   * which is already counted.
   */
  private usageModels() {
    return [
      'program',
      'course',
      'strand',
      'level',
      'section',
      'studentSchoolYear',
      'semester',
      'class',
      'academicCalendar',
      'programCalendar',
      'gradingScaleAssignment',
      'enrollmentPeriod',
      'enrollmentApplication',
    ] as const;
  }

  async usageCountsBySchoolYear(
    orgId: string,
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    const results = await Promise.all(
      this.usageModels().map(async (model) => {
        const groups = await (this.db[model] as any).groupBy({
          by: ['school_year_id'],
          where: { org_id: orgId },
          _count: { _all: true },
        });
        return groups.map(
          (g: { school_year_id: string; _count: { _all: number } }) => ({
            schoolYearId: g.school_year_id,
            count: g._count._all,
          }),
        );
      }),
    );

    for (const rows of results) {
      for (const row of rows) {
        counts[row.schoolYearId] = (counts[row.schoolYearId] ?? 0) + row.count;
      }
    }

    return counts;
  }

  async hasUsage(id: string): Promise<boolean> {
    const counts = await Promise.all(
      this.usageModels().map((model) =>
        (this.db[model] as any).count({
          where: { school_year_id: id },
        }),
      ),
    );
    return counts.some((count) => count > 0);
  }

  async delete(id: string) {
    return this.db.schoolYear.delete({ where: { id } });
  }

  /** Find all school years whose end_date has passed and are still active */
  async findExpiredActive(): Promise<{ id: string; org_id: string }[]> {
    return this.db.schoolYear.findMany({
      where: {
        status: 'active',
        end_date: { lt: new Date() },
      },
      select: { id: true, org_id: true },
    });
  }

  async unenrollAllStudents(schoolYearId: string, orgId: string) {
    const [classResult, studentResult] = await this.db.$transaction([
      this.db.enrollment.updateMany({
        where: {
          org_id: orgId,
          status: 'active',
          class: { school_year_id: schoolYearId, deleted_at: null },
        },
        data: { status: 'removed' },
      }),
      this.db.studentSchoolYear.updateMany({
        where: {
          org_id: orgId,
          school_year_id: schoolYearId,
          status: 'active',
        },
        data: {
          status: 'unenrolled',
          unenrolled_at: new Date(),
        },
      }),
    ]);

    return {
      classEnrollments: classResult.count,
      students: studentResult.count,
    };
  }
}
