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

    const hasProfileSchemes = Object.keys(ctx.profileGradingSchemes).length > 0;

    const effectivePresets: typeof SCHEME_PRESETS = hasProfileSchemes
      ? [
          ...Object.entries(ctx.profileGradingSchemes).map(([programType, scheme]) => ({
            name: scheme.name,
            programType,
            components: scheme.components.map((c: any) => ({
              name: c.name,
              type: c.type as any,
              weight: c.weight,
              isOptional: !!c.isOptional,
            })),
          })),
          ...SCHEME_PRESETS.filter((p) => !ctx.profileGradingSchemes[schemeProgram[p.name]]),
        ]
      : SCHEME_PRESETS;

    for (const preset of effectivePresets) {
      const progKey = (preset as any).programType ?? schemeProgram[preset.name];
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
