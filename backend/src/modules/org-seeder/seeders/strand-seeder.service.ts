import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { SHS_STRAND_DEFS } from '../data/strands.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class StrandSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    if (!ctx.shouldSeedProgram('shs') || !ctx.programMap['shs']) return;

    for (const s of SHS_STRAND_DEFS) {
      if (!ctx.shouldSeedStrand(s.name)) {
        ctx.result.strands.skipped++;
        continue;
      }

      const id = seedId('strand', s.name, ctx.schoolYearId, ctx.orgId);
      const existing = await this.db.strand.findFirst({ where: { id } });

      if (existing) {
        ctx.strandMap[s.name] = existing.id;
        ctx.result.strands.already_exists++;
      } else {
        const rec = await this.db.strand.create({
          data: {
            id,
            org_id: ctx.orgId,
            school_year_id: ctx.schoolYearId,
            program_id: ctx.programMap['shs'],
            name: s.name,
          },
        });
        ctx.strandMap[s.name] = rec.id;
        ctx.result.strands.seeded++;
      }
    }
  }
}
