import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { SEMESTER_TEMPLATES } from '../data/semester-templates.data';
import { computeTermDates } from '../utils/date-calculator.util';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class SemesterTemplateSeederService {
  constructor(private readonly db: DatabaseService) {}

  async seed(ctx: SeedContext): Promise<void> {
    const schoolYear = await this.db.schoolYear.findFirst({
      where: { id: ctx.schoolYearId },
    });

    const syStart = schoolYear?.start_date ?? null;
    const syEnd = schoolYear?.end_date ?? null;
    const hasDates = syStart !== null && syEnd !== null;

    for (const tpl of SEMESTER_TEMPLATES) {
      if (!ctx.shouldSeedProgram(tpl.programType)) {
        ctx.result.semesterTemplates.skipped++;
        continue;
      }

      const programId = ctx.programMap[tpl.programType];
      if (!programId) {
        ctx.result.semesterTemplates.skipped++;
        continue;
      }

      const templateId = seedId('sem-template', tpl.programType, ctx.orgId);
      const existing = await this.db.semesterTemplate.findFirst({
        where: { id: templateId },
      });

      if (existing) {
        ctx.result.semesterTemplates.already_exists++;
        await this.db.programSemesterAssignment.upsert({
          where: { program_id: programId },
          update: {},
          create: {
            id: seedId('sem-assignment', programId, ctx.orgId),
            org_id: ctx.orgId,
            program_id: programId,
            template_id: existing.id,
          },
        });
        continue;
      }

      const template = await this.db.semesterTemplate.create({
        data: {
          id: templateId,
          org_id: ctx.orgId,
          program_type: tpl.programType,
          name: tpl.name,
        },
      });

      const termIds: string[] = [];

      for (const sem of tpl.semesters) {
        const semItemId = seedId('sem-item', tpl.programType, sem.name, ctx.orgId);
        const semItem = await this.db.semesterTemplateItem.create({
          data: {
            id: semItemId,
            org_id: ctx.orgId,
            template_id: template.id,
            name: sem.name,
            order_index: sem.order_index,
          },
        });

        for (const term of sem.terms) {
          const termId = seedId('sem-term', tpl.programType, sem.name, term.name, ctx.orgId);
          await this.db.semesterTemplateTerm.create({
            data: {
              id: termId,
              org_id: ctx.orgId,
              semester_id: semItem.id,
              name: term.name,
              order_index: term.order_index,
            },
          });
          termIds.push(termId);
        }
      }

      const assignment = await this.db.programSemesterAssignment.create({
        data: {
          id: seedId('sem-assignment', programId, ctx.orgId),
          org_id: ctx.orgId,
          program_id: programId,
          template_id: template.id,
        },
      });

      const termDateData = hasDates
        ? computeTermDates(syStart!, syEnd!, tpl, termIds).map((td) => ({
            id: seedId('sem-term-date', assignment.id, td.termId),
            org_id: ctx.orgId,
            assignment_id: assignment.id,
            term_id: td.termId,
            start_date: td.startDate,
            end_date: td.endDate,
          }))
        : termIds.map((termId) => ({
            id: seedId('sem-term-date', assignment.id, termId),
            org_id: ctx.orgId,
            assignment_id: assignment.id,
            term_id: termId,
            start_date: new Date('1970-01-01'),
            end_date: new Date('1970-01-01'),
          }));

      await this.db.programSemesterTermDate.createMany({
        data: termDateData,
        skipDuplicates: true,
      });

      ctx.result.semesterTemplates.seeded++;
    }
  }
}
