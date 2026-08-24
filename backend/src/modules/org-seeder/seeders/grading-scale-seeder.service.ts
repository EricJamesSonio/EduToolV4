import { Injectable } from '@nestjs/common';
import { GradingScaleRepository } from '@/modules/grading-scale/grading-scale.repository';
import { DatabaseService } from '@/core/database/database.provider';
import { buildScaleAssignments } from '../data/grading-scale.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class GradingScaleSeederService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gradingScaleRepository: GradingScaleRepository,
  ) {}

  async seed(ctx: SeedContext): Promise<void> {
    const assignments =
      Object.keys(ctx.gradingScales).length > 0
        ? Object.entries(ctx.gradingScales)
            .filter(
              ([progKey]) =>
                ctx.shouldSeedProgram(progKey) && ctx.programMap[progKey],
            )
            .map(([progKey, scale]) => ({
              programKey: progKey,
              programId: ctx.programMap[progKey],
              scaleName: scale.name,
              ranges: scale.ranges as object,
            }))
        : buildScaleAssignments()
            .filter(
              (sa) =>
                ctx.shouldSeedProgram(sa.programKey) &&
                ctx.programMap[sa.programKey],
            )
            .map((sa) => ({
              programKey: sa.programKey,
              programId: ctx.programMap[sa.programKey],
              scaleName: sa.scaleName,
              ranges: sa.ranges,
            }));

    for (const { programKey, programId, scaleName, ranges } of assignments) {
      // Single source of truth for uniqueness — same lookup the manual
      // Create Grading Scale flow uses. A name match, regardless of how or
      // when it was created, is treated as "already exists" — never a
      // second row with the same name.
      const existing = await this.gradingScaleRepository.findByName(
        ctx.orgId,
        scaleName,
      );

      let scale: { id: string };

      if (existing) {
        scale = existing;
        ctx.result.gradingScales.already_exists++;
      } else {
        scale = await this.gradingScaleRepository.create({
          orgId: ctx.orgId,
          name: scaleName,
          programType: programKey,
          ranges,
        });
        ctx.result.gradingScales.seeded++;
      }

      const assignmentId = seedId(
        'assign',
        programKey,
        scaleName,
        ctx.schoolYearId,
        programId,
        ctx.orgId,
      );
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
