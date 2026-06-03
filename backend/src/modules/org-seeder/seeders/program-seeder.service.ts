import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { PROGRAMS } from '../data/programs.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class ProgramSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    for (const p of PROGRAMS) {
      if (!ctx.shouldSeedProgram(p.key)) {
        ctx.result.programs.skipped++;
        continue;
      }

      const id = seedId('prog', p.key, ctx.schoolYearId, ctx.orgId);
      const existing = await this.db.program.findFirst({ where: { id } });

      if (existing) {
        ctx.programMap[p.key] = existing.id;
        ctx.result.programs.already_exists++;
      } else {
        const rec = await this.db.program.create({
          data: {
            id,
            org_id: ctx.orgId,
            school_year_id: ctx.schoolYearId,
            name: p.name,
            type: p.type,
          },
        });
        ctx.programMap[p.key] = rec.id;
        ctx.result.programs.seeded++;
      }
    }
  }
}
