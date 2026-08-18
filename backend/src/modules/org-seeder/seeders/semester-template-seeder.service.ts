import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { ProgramCalendarService } from '@/modules/academic-calendar/program-calendar/program-calendar.service';
import {
  SEMESTER_TEMPLATES,
  buildGenericTemplate,
  type SemesterItemDef,
  type SemesterTemplateDef,
} from '../data/semester-templates.data';
import { computeTermDates } from '../utils/date-calculator.util';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

type StoredItem = {
  name:        string
  order_index: number
  terms:       Array<{ name: string; order_index: number }>
}

@Injectable()
export class SemesterTemplateSeederService {
  constructor(
    private readonly db: DatabaseService,
    private readonly calendarService: ProgramCalendarService,
  ) {}

  /** Structural match — compares names/order only, ignores DB ids. */
  private structureMatches(items: StoredItem[], defs: SemesterItemDef[]): boolean {
    if (items.length !== defs.length) return false;

    return items.every((item, i) => {
      const def = defs[i];
      if (item.name !== def.name || item.order_index !== def.order_index) return false;
      if (item.terms.length !== def.terms.length) return false;

      return item.terms.every((t, j) => {
        const td = def.terms[j];
        return t.name === td.name && t.order_index === td.order_index;
      });
    });
  }

  async seed(ctx: SeedContext): Promise<void> {
    const schoolYear = await this.db.schoolYear.findFirst({
      where: { id: ctx.schoolYearId },
    });

    const syStart = schoolYear?.start_date ?? null;
    const syEnd = schoolYear?.end_date ?? null;
    const hasDates = syStart !== null && syEnd !== null;

    for (const baseTpl of SEMESTER_TEMPLATES) {
      if (!ctx.shouldSeedProgram(baseTpl.programType)) {
        ctx.result.semesterTemplates.skipped++;
        continue;
      }

      const programId = ctx.programMap[baseTpl.programType];
      if (!programId) {
        ctx.result.semesterTemplates.skipped++;
        continue;
      }

      // Adapt the template to the calendar's period count so the two always
      // agree: N calendar periods => template with N semesters, each holding
      // the generic "Term 1/2/3" rows. No calendar falls back to the default
      // (2-semester) shape. Users rename afterwards as needed.
      const calendar = await this.calendarService.getCalendarForProgram(
        programId,
        ctx.schoolYearId,
        ctx.orgId,
      );
      const periodCount = calendar?.breaks.length ?? 0;
      const tpl = buildGenericTemplate(
        baseTpl.name,
        baseTpl.programType,
        periodCount > 0 ? periodCount : baseTpl.semesters.length,
      );
      const canAutoRegister = calendar !== null && periodCount > 0;

      const programLookup = await this.db.program.findFirst({
        where: { id: programId },
        select: { name: true },
      });
      const programName = programLookup?.name ?? baseTpl.programType;

      // The template chain is scoped per school year so that one year's
      // (re)build or structural change can never cascade into another year's
      // assignment or term dates.
      const templateId = seedId('sem-template', baseTpl.programType, ctx.orgId, ctx.schoolYearId);
      const existing = await this.db.semesterTemplate.findFirst({
        where: { id: templateId },
        include: {
          semesters: {
            orderBy: { order_index: 'asc' },
            include: { terms: { orderBy: { order_index: 'asc' } } },
          },
        },
      });

      if (existing && this.structureMatches(existing.semesters, tpl.semesters)) {
        ctx.result.semesterTemplates.already_exists++;
        if (canAutoRegister) {
          const assignment = await this.db.programSemesterAssignment.upsert({
            where: { program_id: programId },
            update: { template_id: existing.id },
            create: {
              id: seedId('sem-assignment', programId, ctx.orgId, ctx.schoolYearId),
              org_id: ctx.orgId,
              program_id: programId,
              template_id: existing.id,
            },
          });

          const termIds = existing.semesters.flatMap((s) => s.terms.map((t) => t.id));
          await this.writeTermDates(ctx, assignment.id, termIds, hasDates, syStart, syEnd, tpl);
        }
        continue;
      }

      let template: { id: string };

      if (existing) {
        // Stored template no longer matches the (adaptive) generic structure —
        // rebuild it. Deleting items cascades to terms and term dates.
        await this.db.semesterTemplateItem.deleteMany({
          where: { template_id: existing.id },
        });
        template = existing;
      } else {
        template = await this.db.semesterTemplate.create({
          data: {
            id: templateId,
            org_id: ctx.orgId,
            program_type: tpl.programType,
            name: tpl.name,
          },
        });
      }

      const termIds: string[] = [];

      for (const sem of tpl.semesters) {
        const semItemId = seedId('sem-item', tpl.programType, sem.name, ctx.orgId, ctx.schoolYearId);
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
          const termId = seedId(
            'sem-term',
            tpl.programType,
            sem.name,
            term.name,
            ctx.orgId,
            ctx.schoolYearId,
          );
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

      // The template itself is always (re)built — it remains available in the
      // library for later manual assignment. Only auto-registration requires
      // an existing matching calendar.
      if (canAutoRegister) {
        const assignment = await this.db.programSemesterAssignment.upsert({
          where: { program_id: programId },
          update: { template_id: template.id },
          create: {
            id: seedId('sem-assignment', programId, ctx.orgId, ctx.schoolYearId),
            org_id: ctx.orgId,
            program_id: programId,
            template_id: template.id,
          },
        });

        await this.writeTermDates(ctx, assignment.id, termIds, hasDates, syStart, syEnd, tpl);
      } else {
        ctx.result.warnings.push(
          `Semester template "${tpl.name}" was not auto-registered for "${programName}" — ` +
          `the program has no Academic Calendar for this school year. Set the calendar up first.`,
        );
      }

      ctx.result.semesterTemplates.seeded++;
    }
  }

  private async writeTermDates(
    ctx: SeedContext,
    assignmentId: string,
    termIds: string[],
    hasDates: boolean,
    syStart: Date | null,
    syEnd: Date | null,
    tpl: SemesterTemplateDef,
  ): Promise<void> {
    const data = hasDates
      ? computeTermDates(syStart!, syEnd!, tpl, termIds).map((td) => ({
          id: seedId('sem-term-date', assignmentId, td.termId, ctx.schoolYearId),
          org_id: ctx.orgId,
          assignment_id: assignmentId,
          term_id: td.termId,
          start_date: td.startDate,
          end_date: td.endDate,
        }))
      : termIds.map((termId) => ({
          id: seedId('sem-term-date', assignmentId, termId, ctx.schoolYearId),
          org_id: ctx.orgId,
          assignment_id: assignmentId,
          term_id: termId,
          start_date: new Date('1970-01-01'),
          end_date: new Date('1970-01-01'),
        }));

    await this.db.programSemesterTermDate.createMany({ data, skipDuplicates: true });
  }
}