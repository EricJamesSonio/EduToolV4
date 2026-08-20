import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { buildScaleAssignments } from '../../../modules/org-seeder/data/grading-scale.data';
import { SCHEME_PRESETS } from '../../../modules/org-seeder/data/grading-schemes.data';
import { SCHEME_PRESET_NAME_TO_PROGRAM } from '../constants';

export async function seedGradingScales(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
): Promise<void> {
  const assignments = buildScaleAssignments().filter(
    (sa) => programKeys.includes(sa.programKey) && programMap[sa.programKey],
  );

  for (const { programKey, scaleName, ranges } of assignments) {
    const programId = programMap[programKey];
    const scaleId = seedId('scale', programKey, scaleName, orgId);
    let scale = await db.gradingScale.findFirst({ where: { id: scaleId } });

    if (!scale) {
      scale = await db.gradingScale.create({
        data: {
          id: scaleId,
          org_id: orgId,
          name: scaleName,
          program_type: programKey,
          ranges: ranges as any,
          is_locked: false,
        },
      });
    }

    const assignmentId = seedId(
      'assign',
      programKey,
      scaleName,
      schoolYearId,
      programId,
      orgId,
    );
    const existingAssign = await db.gradingScaleAssignment.findFirst({
      where: { id: assignmentId },
    });

    if (!existingAssign) {
      await db.gradingScaleAssignment.create({
        data: {
          id: assignmentId,
          org_id: orgId,
          grading_scale_id: scale.id,
          program_id: programId,
          school_year_id: schoolYearId,
        },
      });
    }
  }
}

export async function seedGradingSchemes(
  orgId: string,
  programKeys: string[],
  _programMap: Record<string, string>,
): Promise<void> {
  for (const preset of SCHEME_PRESETS) {
    const progKey = SCHEME_PRESET_NAME_TO_PROGRAM[preset.name];
    if (progKey && !programKeys.includes(progKey)) continue;

    const id = seedId('scheme-template', preset.name, orgId);
    const existing = await db.gradingSchemeTemplate.findFirst({
      where: { id },
    });
    if (existing) continue;

    const template = await db.gradingSchemeTemplate.create({
      data: {
        id,
        org_id: orgId,
        name: preset.name,
        program_type: progKey ?? null,
      },
    });

    await db.gradingSchemeTemplateComponent.createMany({
      data: preset.components.map((c: any) => ({
        id: uuid(),
        org_id: orgId,
        template_id: template.id,
        name: c.name,
        type: c.type,
        weight: c.weight,
        max_score: null,
      })),
    });
  }
}
