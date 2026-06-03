import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { buildScaleAssignments } from '../data/grading-scale.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class GradingScaleSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const assignments =
      Object.keys(ctx.gradingScales).length > 0
        ? Object.entries(ctx.gradingScales)
            .filter(([progKey]) => ctx.shouldSeedProgram(progKey) && ctx.programMap[progKey])
            .map(([progKey, scale]) => ({
              programKey: progKey,
              programId: ctx.programMap[progKey],
              scaleName: scale.name,
              ranges: scale.ranges as any,
            }))
        : buildScaleAssignments()
            .filter(
              (sa) => ctx.shouldSeedProgram(sa.programKey) && ctx.programMap[sa.programKey],
            )
            .map((sa) => ({
              programKey: sa.programKey,
              programId: ctx.programMap[sa.programKey],
              scaleName: sa.scaleName,
              ranges: sa.ranges,
            }));

    for (const { programKey, programId, scaleName, ranges } of assignments) {
      const scaleId = seedId('scale', programKey, scaleName, ctx.orgId);
      let scale = await this.db.gradingScale.findFirst({ where: { id: scaleId } });

      if (!scale) {
        scale = await this.db.gradingScale.create({
          data: {
            id: scaleId,
            org_id: ctx.orgId,
            name: scaleName,
            program_type: programKey,
            ranges,
            is_locked: false,
          },
        });
        ctx.result.gradingScales.seeded++;
      } else {
        ctx.result.gradingScales.already_exists++;
      }

      const assignmentId = seedId('assign', programKey, scaleName, ctx.schoolYearId, programId, ctx.orgId);
      const existingAssign = await this.db.gradingScaleAssignment.findFirst({
        where: { id: assignmentId },
      });

      if (!existingAssign) {
        await this.db.gradingScaleAssignment.create({
          data: {
            id: assignmentId,
            org_id: ctx.orgId,
            grading_scale_id: scale.id,
            program_id: programId,
            school_year_id: ctx.schoolYearId,
          },
        });
      }
    }
  }
}
