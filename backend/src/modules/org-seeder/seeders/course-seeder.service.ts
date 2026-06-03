import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { COLLEGE_COURSES, BSED_MAJORS } from '../data/courses.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class CourseSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    if (!ctx.shouldSeedProgram('college') || !ctx.programMap['college']) return;

    for (const c of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
      if (!ctx.shouldSeedCourse(c.code)) {
        ctx.result.courses.skipped++;
        continue;
      }

      const id = seedId('course', c.code, ctx.schoolYearId, ctx.orgId);
      const existing = await this.db.course.findFirst({ where: { id } });

      if (existing) {
        ctx.courseMap[c.code] = existing.id;
        ctx.result.courses.already_exists++;
      } else {
        const rec = await this.db.course.create({
          data: {
            id,
            org_id: ctx.orgId,
            school_year_id: ctx.schoolYearId,
            program_id: ctx.programMap['college'],
            name: c.name,
            code: c.code,
          },
        });
        ctx.courseMap[c.code] = rec.id;
        ctx.result.courses.seeded++;
      }
    }
  }
}
