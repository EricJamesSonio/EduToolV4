// @/modules/semester/semester.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { SemesterRepository } from './semester.repository';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';

// ── Date helpers ──────────────────────────────────────────────────────────────

interface DateRange {
  startDate: Date;
  endDate: Date;
}

function toDate(value: string | undefined, field: string): Date {
  if (!value) {
    throw new BadRequestException(`${field} is required.`);
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    throw new BadRequestException(`${field} is invalid.`);
  }

  return date;
}

function isOverlapping(a: DateRange, b: DateRange): boolean {
  return a.startDate < b.endDate && a.endDate > b.startDate;
}

function validateDateRange(start: Date, end: Date, label: string) {
  if (start >= end) {
    throw new BadRequestException(
      `${label}: start date must be before end date.`,
    );
  }
}

@Injectable()
export class SemesterService {
  constructor(
    private readonly semesterRepository: SemesterRepository,
    private readonly db: DatabaseService,
  ) {}

  // ── POST /semester-settings ─────────────────────────────────────────────────

  async create(orgId: string, dto: CreateSemesterDto) {
    const startDate = toDate(dto.startDate, 'startDate');
    const endDate = toDate(dto.endDate, 'endDate');

    // 1. Validate semester date range
    validateDateRange(startDate, endDate, 'Semester');

    // 2. Program must exist, belong to this org, and belong to the specified school year.
    const program = await this.db.program.findFirst({
      where: { id: dto.programId, org_id: orgId },
      select: { id: true, school_year_id: true },
    });
    if (!program) {
      throw new NotFoundException('Program not found.');
    }
    if (program.school_year_id !== dto.schoolYearId) {
      throw new BadRequestException(
        'This program does not belong to the specified school year.',
      );
    }

    // 3. The chosen slot must actually belong to this program's assigned
    //    template. This is the real check that replaces name-matching —
    //    a Semester can only be created against a slot its own program's
    //    template actually defines.
    const assignment = await this.db.programSemesterAssignment.findFirst({
      where: { program_id: dto.programId, org_id: orgId },
      include: { template: { include: { semesters: true } } },
    });
    if (!assignment) {
      throw new BadRequestException(
        'This program has no semester template assigned yet.',
      );
    }
    const templateSemester = assignment.template.semesters.find(
      (s) => s.id === dto.templateSemesterId,
    );
    if (!templateSemester) {
      throw new BadRequestException(
        'The selected semester slot does not belong to this program\'s assigned template.',
      );
    }

    // 4. Enforce max 3 semesters per PROGRAM per school year (not per school
    //    year overall — a tri-sem program and a regular 2-sem program can
    //    coexist in the same school year, each with its own cap).
    const existingCount = await this.semesterRepository.countByProgramAndSchoolYear(
      orgId,
      dto.schoolYearId,
      dto.programId,
    );

    if (existingCount >= 3) {
      throw new ConflictException(
        'This program cannot have more than 3 semesters in one school year.',
      );
    }

    // 5. Check overlap with existing semesters for the SAME program only —
    //    different programs run their own calendars and are allowed to overlap.
    const siblings = await this.semesterRepository.findSiblingsInSchoolYear(
      orgId,
      dto.schoolYearId,
      dto.programId,
    );

    for (const sibling of siblings) {
      if (
        isOverlapping(
          { startDate, endDate },
          { startDate: sibling.start_date, endDate: sibling.end_date },
        )
      ) {
        throw new ConflictException(
          `Semester dates overlap with existing semester "${sibling.name}" for this program.`,
        );
      }
    }

    // 6. Validate term date ranges — must be within the semester range
    for (const term of dto.terms) {
      const tStart = toDate(term.startDate, `Term "${term.name}" startDate`);
      const tEnd = toDate(term.endDate, `Term "${term.name}" endDate`);

      validateDateRange(tStart, tEnd, `Term "${term.name}"`);

      if (tStart < startDate || tEnd > endDate) {
        throw new BadRequestException(
          `Term "${term.name}" dates must fall within the semester date range.`,
        );
      }
    }

    // 7. Validate terms don't overlap each other
    for (let i = 0; i < dto.terms.length; i++) {
      for (let j = i + 1; j < dto.terms.length; j++) {
        const a = {
          startDate: toDate(dto.terms[i].startDate, `terms[${i}].startDate`),
          endDate: toDate(dto.terms[i].endDate, `terms[${i}].endDate`),
        };
        const b = {
          startDate: toDate(dto.terms[j].startDate, `terms[${j}].startDate`),
          endDate: toDate(dto.terms[j].endDate, `terms[${j}].endDate`),
        };

        if (isOverlapping(a, b)) {
          throw new ConflictException(
            `Terms "${dto.terms[i].name}" and "${dto.terms[j].name}" have overlapping dates.`,
          );
        }
      }
    }

    // 8. Create semester then terms in a transaction
    const semester = await this.semesterRepository.create({
      orgId,
      schoolYearId: dto.schoolYearId,
      programId: dto.programId,
      templateSemesterId: dto.templateSemesterId,
      name: dto.name,
      startDate,
      endDate,
    });

    await this.semesterRepository.upsertTerms(
      orgId,
      semester.id,
      dto.terms.map((t) => ({
        name: t.name,
        orderIndex: t.orderIndex,
        startDate: toDate(t.startDate, `Term "${t.name}" startDate`),
        endDate: toDate(t.endDate, `Term "${t.name}" endDate`),
      })),
    );

    return this.semesterRepository.findById(semester.id, orgId);
  }

  // ── GET /semester-settings ──────────────────────────────────────────────────

  async findAll(orgId: string) {
    return this.semesterRepository.findAll(orgId);
  }

  // ── PATCH /semester-settings/:id ───────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateSemesterDto) {
    const semester = await this.semesterRepository.findById(id, orgId);

    if (!semester) {
      throw new NotFoundException('Semester not found.');
    }

    const startDate = dto.startDate
      ? toDate(dto.startDate, 'startDate')
      : semester.start_date;
    const endDate = dto.endDate
      ? toDate(dto.endDate, 'endDate')
      : semester.end_date;

    validateDateRange(startDate, endDate, 'Semester');

    // Check overlap with siblings of the SAME program (excluding self) —
    // program_id is immutable on an existing semester, so pull it from the
    // record itself rather than accepting it from the DTO.
    const siblings = await this.semesterRepository.findSiblingsInSchoolYear(
      orgId,
      semester.school_year_id,
      semester.program_id,
      id,
    );

    for (const sibling of siblings) {
      if (
        isOverlapping(
          { startDate, endDate },
          { startDate: sibling.start_date, endDate: sibling.end_date },
        )
      ) {
        throw new ConflictException(
          `Semester dates overlap with existing semester "${sibling.name}" for this program.`,
        );
      }
    }

    // Update semester fields
    await this.semesterRepository.update(id, {
      name: dto.name,
      startDate: dto.startDate ? startDate : undefined,
      endDate: dto.endDate ? endDate : undefined,
    });

    // Upsert terms if provided
    if (dto.terms && dto.terms.length > 0) {
      for (const term of dto.terms) {
        const tStart = toDate(term.startDate, `Term "${term.name}" startDate`);
        const tEnd = toDate(term.endDate, `Term "${term.name}" endDate`);

        validateDateRange(tStart, tEnd, `Term "${term.name}"`);

        if (tStart < startDate || tEnd > endDate) {
          throw new BadRequestException(
            `Term "${term.name}" dates must fall within the semester date range.`,
          );
        }
      }

      await this.semesterRepository.upsertTerms(
        orgId,
        id,
        dto.terms.map((t) => {
          if (!t.name) {
            throw new BadRequestException('Each term must have a name.');
          }
          if (t.orderIndex === undefined) {
            throw new BadRequestException(
              `Term "${t.name}" must have an orderIndex.`,
            );
          }
          return {
            id: t.id,
            name: t.name,
            orderIndex: t.orderIndex,
            startDate: toDate(t.startDate, `Term "${t.name}" startDate`),
            endDate: toDate(t.endDate, `Term "${t.name}" endDate`),
          };
        }),
      );
    }

    return this.semesterRepository.findById(id, orgId);
  }

  // ── DELETE /semester-settings/:id ──────────────────────────────────────────

  async remove(id: string, orgId: string) {
    const semester = await this.semesterRepository.findById(id, orgId);

    if (!semester) {
      throw new NotFoundException('Semester not found.');
    }

    await this.semesterRepository.deleteTermsBySemester(id);
    await this.semesterRepository.delete(id);
  }

  // ── Utility (used by other modules) ────────────────────────────────────────

  async findById(id: string, orgId: string) {
    const semester = await this.semesterRepository.findById(id, orgId);

    if (!semester) {
      throw new NotFoundException('Semester not found.');
    }

    return semester;
  }

  async findBySchoolYear(orgId: string, schoolYearId: string) {
    return this.semesterRepository.findBySchoolYear(orgId, schoolYearId);
  }
}