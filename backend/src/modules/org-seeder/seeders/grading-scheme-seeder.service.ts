import { Injectable } from '@nestjs/common';
import { GradingSchemeTemplateRepository } from '@/modules/grading-scheme-template/grading-scheme-template.repository';
import { SCHEME_PRESETS } from '../data/grading-schemes.data';
import { SeedContext } from '../seed-context';

@Injectable()
export class GradingSchemeSeederService {
  constructor(private readonly repo: GradingSchemeTemplateRepository) {}

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

      const existing = await this.repo.findByName(ctx.orgId, preset.name);
      if (existing) {
        ctx.result.gradingSchemeTemplates.already_exists++;
        continue;
      }

      await this.repo.create(
        ctx.orgId,
        preset.name,
        progKey,
        preset.components.map((c) => ({
          name: c.name,
          type: c.type,
          weight: c.weight,
          maxScore: undefined,
        })),
      );

      ctx.result.gradingSchemeTemplates.seeded++;
    }
  }
}
