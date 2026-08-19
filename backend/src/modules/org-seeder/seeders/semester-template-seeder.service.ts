import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { ProgramCalendarService } from '@/modules/academic-calendar/program-calendar/program-calendar.service';
import {
  SEMESTER_TEMPLATES,
  buildGenericTemplate,
  type SemesterTemplateDef,
} from '../data/semester-templates.data';
import { computeTermDates } from '../utils/date-calculator.util';
import { SeedContext } from '../seed-context';
import { seedId } from '../seed-id';

@Injectable()
export class SemesterTemplateSeederService {
  constructor(
    private readonly db: DatabaseService,
    private readonly calendarService: ProgramCalendarService,
  ) {}

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

      const calendar = await this.calendarService.getCalendarForProgram(
        programId,
        ctx.schoolYearId,
        ctx.orgId,
      );
      const periodCount = calendar?.breaks.length ?? 0;
      const canAutoRegister = calendar !== null && periodCount > 0;

      const programLookup = await this.db.program.findFirst({
        where: { id: programId },
        select: { name: true },
      });
      const programName = programLookup?.name ?? baseTpl.programType;

      // Semester Template is org-global and reused across every school
      // year — look it up by name/program type. Never rebuild an existing
      // one here: rebuilding would retroactively change it for every other
      // program or school year already assigned to it. First seed for this
      // org derives the template from the calendar; every seed after that
      // reuses whatever already exists, unchanged.
      const existing = await this.db.semesterTemplate.findFirst({
        where: {
          org_id: ctx.orgId,
          program_type: baseTpl.programType,
          name: baseTpl.name,
        },
        include: {
          semesters: {
            orderBy: { order_index: 'asc' },
            include: { terms: { orderBy: { order_index: 'asc' } } },
          },
        },
      });

      if (existing) {
        ctx.result.semesterTemplates.already_exists++;

        const termIds = existing.semesters.flatMap((s) =>
          s.terms.map((t) => t.id),
        );

        if (canAutoRegister && existing.semesters.length !== periodCount) {
          ctx.result.warnings.push(
            `Semester template "${existing.name}" was not auto-registered for ` +
              `"${programName}" — it already has ${existing.semesters.length} ` +
              `semester(s), but this program's calendar has ${periodCount} ` +
              `period(s). Assign it manually if this is intentional, or ` +
              `adjust the calendar to match.`,
          );
        } else if (canAutoRegister) {
          const assignment = await this.db.programSemesterAssignment.upsert({
            where: { program_id: programId },
            update: { template_id: existing.id },
            create: {
              id: seedId(
                'sem-assignment',
                programId,
                ctx.orgId,
                ctx.schoolYearId,
              ),
              org_id: ctx.orgId,
              program_id: programId,
              template_id: existing.id,
            },
          });

          await this.writeTermDates(
            ctx,
            assignment.id,
            termIds,
            hasDates,
            syStart,
            syEnd,
            {
              name: existing.name,
              programType: baseTpl.programType,
              semesters: existing.semesters.map((s) => ({
                name: s.name,
                order_index: s.order_index,
                terms: s.terms.map((t) => ({
                  name: t.name,
                  order_index: t.order_index,
                })),
              })),
            },
          );
        } else {
          ctx.result.warnings.push(
            `Semester template "${existing.name}" was not auto-registered for ` +
              `"${programName}" — the program has no Academic Calendar for ` +
              `this school year. Set the calendar up first.`,
          );
        }
        continue;
      }

      // No template with this name exists yet for the org — create it
      // fresh, derived from the calendar (or the default shape if there's
      // no calendar yet).
      const tpl = buildGenericTemplate(
        baseTpl.name,
        baseTpl.programType,
        periodCount > 0 ? periodCount : baseTpl.semesters.length,
      );

      const template = await this.db.semesterTemplate.create({
        data: {
          org_id: ctx.orgId,
          program_type: tpl.programType,
          name: tpl.name,
        },
      });

      const termIds: string[] = [];

      for (const sem of tpl.semesters) {
        const semItem = await this.db.semesterTemplateItem.create({
          data: {
            org_id: ctx.orgId,
            template_id: template.id,
            name: sem.name,
            order_index: sem.order_index,
          },
        });

        for (const term of sem.terms) {
          const createdTerm = await this.db.semesterTemplateTerm.create({
            data: {
              org_id: ctx.orgId,
              semester_id: semItem.id,
              name: term.name,
              order_index: term.order_index,
            },
          });
          termIds.push(createdTerm.id);
        }
      }

      if (canAutoRegister) {
        const assignment = await this.db.programSemesterAssignment.upsert({
          where: { program_id: programId },
          update: { template_id: template.id },
          create: {
            id: seedId(
              'sem-assignment',
              programId,
              ctx.orgId,
              ctx.schoolYearId,
            ),
            org_id: ctx.orgId,
            program_id: programId,
            template_id: template.id,
          },
        });

        await this.writeTermDates(
          ctx,
          assignment.id,
          termIds,
          hasDates,
          syStart,
          syEnd,
          tpl,
        );
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
          id: seedId(
            'sem-term-date',
            assignmentId,
            td.termId,
            ctx.schoolYearId,
          ),
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

    await this.db.programSemesterTermDate.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
