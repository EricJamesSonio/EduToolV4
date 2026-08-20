import { db } from '../db';
import { seedId } from '../../../modules/org-seeder/seed-id';
import { SEMESTER_TEMPLATES } from '../../../modules/org-seeder/data/semester-templates.data';
import { computeTermDates } from '../../../modules/org-seeder/utils/date-calculator.util';
import { SY_END, SY_START } from '../constants';

export async function seedSemesterTemplates(
  orgId: string,
  schoolYearId: string,
  programKeys: string[],
  programMap: Record<string, string>,
): Promise<void> {
  for (const tpl of SEMESTER_TEMPLATES) {
    if (!programKeys.includes(tpl.programType)) continue;

    const programId = programMap[tpl.programType];
    if (!programId) continue;

    const templateId = seedId('sem-template', tpl.programType, orgId);
    const existing = await db.semesterTemplate.findFirst({
      where: { id: templateId },
    });

    if (existing) {
      await db.programSemesterAssignment.upsert({
        where: { program_id: programId },
        update: {},
        create: {
          id: seedId('sem-assignment', programId, orgId),
          org_id: orgId,
          program_id: programId,
          template_id: existing.id,
        },
      });
      continue;
    }

    const template = await db.semesterTemplate.create({
      data: {
        id: templateId,
        org_id: orgId,
        program_type: tpl.programType,
        name: tpl.name,
      },
    });

    const termIds: string[] = [];

    for (const sem of tpl.semesters) {
      const semItemId = seedId('sem-item', tpl.programType, sem.name, orgId);
      const semItem = await db.semesterTemplateItem.create({
        data: {
          id: semItemId,
          org_id: orgId,
          template_id: template.id,
          name: sem.name,
          order_index: sem.order_index,
        },
      });

      for (const term of sem.terms) {
        const termId = seedId(
          'sem-term',
          tpl.programType,
          sem.name,
          term.name,
          orgId,
        );
        await db.semesterTemplateTerm.create({
          data: {
            id: termId,
            org_id: orgId,
            semester_id: semItem.id,
            name: term.name,
            order_index: term.order_index,
          },
        });
        termIds.push(termId);
      }
    }

    const assignment = await db.programSemesterAssignment.upsert({
      where: { program_id: programId },
      update: { template_id: template.id },
      create: {
        id: seedId('sem-assignment', programId, orgId),
        org_id: orgId,
        program_id: programId,
        template_id: template.id,
      },
    });

    const termDateData = computeTermDates(SY_START, SY_END, tpl, termIds).map(
      (td) => ({
        id: seedId('sem-term-date', assignment.id, td.termId),
        org_id: orgId,
        assignment_id: assignment.id,
        term_id: td.termId,
        start_date: td.startDate,
        end_date: td.endDate,
      }),
    );

    await db.programSemesterTermDate.createMany({
      data: termDateData,
      skipDuplicates: true,
    });
  }
}
