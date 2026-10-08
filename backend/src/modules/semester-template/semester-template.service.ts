import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SemesterTemplateRepository } from './semester-template.repository';
import { ProgramRepository } from '@/modules/program/program.repository';
import {
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
  AssignTemplateDto,
} from './dto/semester-template.dto';
import { DatabaseService } from '@/core/database/database.provider';
import {
  addDaysToCalendarDate,
  calendarDateOf,
  calendarDateToUtc,
} from '@/commons/utils/datetime.util';

@Injectable()
export class SemesterTemplateService {
  constructor(
    private readonly repo: SemesterTemplateRepository,
    private readonly programRepo: ProgramRepository,
    private readonly db: DatabaseService,
  ) {}

  async create(orgId: string, dto: CreateSemesterTemplateDto) {
    const duplicate = await this.repo.existsByName(
      orgId,
      dto.programType,
      dto.name,
    );
    if (duplicate) {
      throw new ConflictException(
        `A template named "${dto.name}" already exists for this program type.`,
      );
    }

    return this.repo.create({
      orgId,
      programType: dto.programType,
      name: dto.name,
      semesters: dto.semesters.map((s) => ({
        name: s.name,
        orderIndex: s.orderIndex,
        terms: s.terms.map((t) => ({
          name: t.name,
          orderIndex: t.orderIndex,
        })),
      })),
    });
  }

  async saveTermDates(
    orgId: string,
    programId: string,
    termDates: Array<{ termId: string; startDate: string; endDate: string }>,
  ) {
    const assignment = await this.repo.findAssignmentByProgram(
      programId,
      orgId,
    );
    if (!assignment)
      throw new NotFoundException('No template assigned to this program.');

    await this.repo.upsertTermDates(assignment.id, orgId, termDates);

    // Resolve the program's school_year_id
    const program = await this.programRepo.findById(programId, orgId);
    if (!program) throw new NotFoundException('Program not found.');

    // Build a map of termId → dates for quick lookup.
    // TICK-INFRA-017: kind-B days at UTC midnight (input is "YYYY-MM-DD").
    const dateMap = new Map(
      termDates.map((td) => [
        td.termId,
        {
          start: calendarDateToUtc(td.startDate),
          end: calendarDateToUtc(td.endDate),
        },
      ]),
    );

    // Walk template semesters → terms, upsert Semester + Term rows.
    // Each Semester row belongs to THIS program and THIS template slot —
    // matched by (program_id, template_semester_id), never by name. Two
    // programs can both have a template item named "1st Semester" without
    // colliding, because program_id + template_semester_id is what makes a
    // Semester row unique now, not its display name.
    const template = assignment.template as any;
    for (const semItem of template.semesters) {
      // Collect dates for all terms in this semester
      const termDateEntries = semItem.terms
        .map((t: any) => dateMap.get(t.id))
        .filter(Boolean) as Array<{ start: Date; end: Date }>;

      if (termDateEntries.length === 0) continue;

      // eslint-disable-next-line no-restricted-syntax -- epoch-ms min/max over UTC-midnight Dates is zone-free arithmetic.
      const semStart = new Date(
        Math.min(...termDateEntries.map((d) => d.start.getTime())),
      );
      // eslint-disable-next-line no-restricted-syntax -- epoch-ms min/max over UTC-midnight Dates is zone-free arithmetic.
      const semEnd = new Date(
        Math.max(...termDateEntries.map((d) => d.end.getTime())),
      );

      // Upsert Semester row — matched by (org, school_year, program, template slot).
      const existingSemester = await this.db.semester.findFirst({
        where: {
          org_id: orgId,
          school_year_id: program.school_year_id,
          program_id: programId,
          template_semester_id: semItem.id,
        },
      });

      const semester = existingSemester
        ? await this.db.semester.update({
            where: { id: existingSemester.id },
            data: { start_date: semStart, end_date: semEnd },
          })
        : await this.db.semester.create({
            data: {
              org_id: orgId,
              school_year_id: program.school_year_id,
              program_id: programId,
              template_semester_id: semItem.id,
              name: semItem.name,
              start_date: semStart,
              end_date: semEnd,
            },
          });

      // Upsert Term rows under this Semester
      for (const termItem of semItem.terms) {
        const dates = dateMap.get(termItem.id);
        if (!dates) continue;

        const existingTerm = await this.db.term.findFirst({
          where: {
            org_id: orgId,
            semester_id: semester.id,
            name: termItem.name,
          },
        });

        if (existingTerm) {
          await this.db.term.update({
            where: { id: existingTerm.id },
            data: { start_date: dates.start, end_date: dates.end },
          });
        } else {
          await this.db.term.create({
            data: {
              org_id: orgId,
              semester_id: semester.id,
              name: termItem.name,
              order_index: termItem.order_index,
              start_date: dates.start,
              end_date: dates.end,
            },
          });
        }
      }
    }
  }

  async findAllForOrg(orgId: string) {
    return this.repo.getAllForOrg(orgId);
  }

  async findAllBySchoolYear(orgId: string, schoolYearId: string) {
    return this.repo.findAllBySchoolYear(orgId, schoolYearId);
  }

  async findById(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId);
    if (!template) throw new NotFoundException('Semester template not found.');
    return template;
  }

  async update(id: string, orgId: string, dto: UpdateSemesterTemplateDto) {
    const template = await this.repo.findById(id, orgId);
    if (!template) throw new NotFoundException('Semester template not found.');

    if (dto.name && dto.name !== template.name) {
      const duplicate = await this.repo.existsByName(
        orgId,
        template.program_type,
        dto.name,
        id,
      );
      if (duplicate) {
        throw new ConflictException(
          `A template named "${dto.name}" already exists for this program type.`,
        );
      }
      await this.repo.update(id, { name: dto.name });
    }

    if (dto.semesters) {
      await this.repo.replaceSemesters(
        id,
        orgId,
        dto.semesters.map((s) => ({
          name: s.name,
          orderIndex: s.orderIndex,
          terms: s.terms.map((t) => ({
            name: t.name,
            orderIndex: t.orderIndex,
          })),
        })),
      );
    }

    return this.repo.findById(id, orgId);
  }

  async remove(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId);
    if (!template) throw new NotFoundException('Semester template not found.');
    await this.repo.delete(id);
  }

  async assignToProgram(orgId: string, dto: AssignTemplateDto) {
    const template = await this.repo.findById(dto.templateId, orgId);
    if (!template) throw new NotFoundException('Semester template not found.');

    const program = await this.programRepo.findById(dto.programId, orgId);
    if (!program) throw new NotFoundException('Program not found.');

    if (template.program_type !== program.type) {
      throw new BadRequestException(
        `Template type "${template.program_type}" does not match program type "${program.type}".`,
      );
    }

    // Validate program has an Academic Calendar with matching break count
    const calendar = await this.db.programCalendar.findFirst({
      where: {
        program_id: program.id,
        school_year_id: program.school_year_id,
        org_id: orgId,
      },
      include: { breaks: { orderBy: { order_index: 'asc' } } },
    });

    if (!calendar) {
      throw new BadRequestException(
        `Program "${program.name}" has no Academic Calendar set up. Set up a calendar first before assigning a semester template.`,
      );
    }

    const breakCount = calendar.breaks.length;
    const semesterCount = template.semesters.length;

    if (breakCount !== semesterCount) {
      throw new BadRequestException(
        `Template "${template.name}" has ${semesterCount} semester(s) but the program calendar has ${breakCount} break point(s). The semester count must match the number of calendar breaks.`,
      );
    }

    const assignment = await this.repo.assignToProgram({
      orgId,
      programId: dto.programId,
      templateId: dto.templateId,
      termDates: dto.termDates,
    });

    if (dto.termDates && dto.termDates.length > 0) {
      await this.saveTermDates(orgId, dto.programId, dto.termDates);
    } else {
      await this.createPlaceholderSemesters(
        orgId,
        dto.programId,
        program.school_year_id,
        template,
      );
    }

    return assignment;
  }

  private async createPlaceholderSemesters(
    orgId: string,
    programId: string,
    schoolYearId: string,
    template: any,
  ) {
    for (const semItem of template.semesters) {
      const existingSemester = await this.db.semester.findFirst({
        where: {
          org_id: orgId,
          school_year_id: schoolYearId,
          program_id: programId,
          template_semester_id: semItem.id,
        },
      });

      if (existingSemester) continue;

      // Create with placeholder dates (can be updated later)
      const semester = await this.db.semester.create({
        data: {
          org_id: orgId,
          school_year_id: schoolYearId,
          program_id: programId,
          template_semester_id: semItem.id,
          name: semItem.name,
          start_date: new Date(),
          end_date: new Date(),
        },
      });

      // Create placeholder terms
      for (const termItem of semItem.terms) {
        await this.db.term.create({
          data: {
            org_id: orgId,
            semester_id: semester.id,
            name: termItem.name,
            order_index: termItem.orderIndex ?? termItem.order_index ?? 0, // ✅ FIX: Add order_index
            start_date: new Date(),
            end_date: new Date(),
          },
        });
      }
    }
  }

  /**
   * Compute smart default term dates from calendar breaks + template.
   * Each break IS a semester teaching period. The gaps between breaks
   * are no-class periods. Each semester's duration is equally divided
   * among its terms.
   */
  async computeDefaultTermDates(
    orgId: string,
    programId: string,
    templateId: string,
  ) {
    const template = await this.repo.findById(templateId, orgId);
    if (!template) throw new NotFoundException('Semester template not found.');

    const program = await this.programRepo.findById(programId, orgId);
    if (!program) throw new NotFoundException('Program not found.');

    const calendar = await this.db.programCalendar.findFirst({
      where: {
        program_id: programId,
        school_year_id: program.school_year_id,
        org_id: orgId,
      },
      include: { breaks: { orderBy: { order_index: 'asc' } } },
    });

    if (!calendar) return [];

    const breaks = calendar.breaks;

    if (breaks.length !== template.semesters.length) {
      throw new BadRequestException(
        `Template "${template.name}" has ${template.semesters.length} semester(s) but the program calendar has ${breaks.length} break point(s). Add or remove breaks so both counts match before auto-configuring dates.`,
      );
    }

    // Build semester periods from calendar breaks.
    // Each break IS a semester period. The gaps between breaks are no-class periods.
    // TICK-INFRA-017: normalize stored Dates to their intended calendar days
    // (tolerant of legacy 16:00Z rows) before any arithmetic.
    const semPeriods: Array<{ start: string; end: string }> = [];

    for (let i = 0; i < breaks.length; i++) {
      const semStart = calendarDateOf(breaks[i].start_date);
      const semEnd = calendarDateOf(breaks[i].end_date);

      if (semStart > semEnd) {
        throw new BadRequestException(
          `Break "${breaks[i].label}": start date must be before or equal to end date.`,
        );
      }
      semPeriods.push({ start: semStart, end: semEnd });
    }

    // Map each template semester to the corresponding teaching period
    const result: Array<{
      termId: string;
      startDate: string;
      endDate: string;
    }> = [];

    for (let si = 0; si < template.semesters.length; si++) {
      const sem = template.semesters[si];
      const period = semPeriods[si];
      const termCount = sem.terms.length;
      if (termCount === 0) continue;

      // TICK-INFRA-017: pure day arithmetic — identical on every server TZ.
      // (The old setDate/getDate version shifted defaults by the process
      // zone; the old ms-split sibling in date-calculator.util.ts did too.)
      const totalDays =
        Math.round(
          (calendarDateToUtc(period.end).getTime() -
            calendarDateToUtc(period.start).getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1;
      // Ensure each term gets at least 1 day (never 0 / negative durations).
      const daysPerTerm = Math.max(1, Math.floor(totalDays / termCount));

      for (let ti = 0; ti < termCount; ti++) {
        const term = sem.terms[ti];
        const tStart = addDaysToCalendarDate(period.start, ti * daysPerTerm);

        let tEnd: string;
        if (ti === termCount - 1) {
          tEnd = period.end;
        } else {
          tEnd = addDaysToCalendarDate(
            period.start,
            (ti + 1) * daysPerTerm - 1,
          );
        }

        if (tEnd < tStart) tEnd = tStart;

        result.push({
          termId: term.id ?? '',
          startDate: tStart,
          endDate: tEnd,
        });
      }
    }

    return result;
  }

  async removeAssignment(programId: string, orgId: string) {
    await this.repo.removeAssignment(programId, orgId);
  }

  async findAssignmentsBySchoolYear(orgId: string, schoolYearId: string) {
    return this.repo.findAssignmentsBySchoolYear(orgId, schoolYearId);
  }

  async findAssignmentByProgram(programId: string, orgId: string) {
    return this.repo.findAssignmentByProgram(programId, orgId);
  }
}