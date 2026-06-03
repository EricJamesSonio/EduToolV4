import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '@/core/database/database.provider';
import { SCHEME_PRESETS } from '../data/grading-schemes.data';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class GradingSchemeSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const schemeProgram: Record<string, string> = {
      'Daycare Scheme': 'daycare',
      'Kindergarten Scheme': 'kinder',
      'Elementary Scheme': 'elementary',
      'High School Scheme': 'jhs',
      'Senior High School Scheme': 'shs',
      'College Scheme': 'college',
    };

    for (const preset of SCHEME_PRESETS) {
      const progKey = schemeProgram[preset.name];
      if (progKey && !ctx.shouldSeedProgram(progKey)) {
        ctx.result.gradingSchemeTemplates.skipped++;
        continue;
      }

      const id = seedId('scheme-template', preset.name, ctx.orgId);
      const existing = await this.db.gradingSchemeTemplate.findFirst({
        where: { id },
      });

      if (existing) {
        ctx.result.gradingSchemeTemplates.already_exists++;
        continue;
      }

      const template = await this.db.gradingSchemeTemplate.create({
        data: {
          id,
          org_id: ctx.orgId,
          name: preset.name,
          program_type: progKey ?? null,
        },
      });

      await this.db.gradingSchemeTemplateComponent.createMany({
        data: preset.components.map((c: any) => ({
          id: uuid(),
          org_id: ctx.orgId,
          template_id: template.id,
          name: c.name,
          type: c.type,
          weight: c.weight,
          max_score: null,
        })),
      });

      ctx.result.gradingSchemeTemplates.seeded++;
    }
  }
}
