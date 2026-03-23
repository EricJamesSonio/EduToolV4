// src/modules/semester/semester.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SemesterRepository } from './semester.repository';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';

// ── Date range overlap helper ─────────────────────────────────────────────────
// Inline here for Phase 2. In Phase 3, this moves to date.util.ts

interface DateRange {
  startDate: Date;
  endDate: Date;
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
  constructor(private readonly semesterRepository: SemesterRepository) {}

  // ── POST /semester-settings ─────────────────────────────────────────────────

  async create(orgId: string, dto: CreateSemesterDto) {
    const startDate = new Date(dto.startDate!);
    const endDate = new Date(dto.endDate);

    // 1. Validate semester date range
    validateDateRange(startDate, endDate, 'Semester');

    // 2. Enforce max 3 semesters per school year
    const existingCount = await this.semesterRepository.countBySchoolYear(
      orgId,
      dto.schoolYearId,
    );

    if (existingCount >= 3) {
      throw new ConflictException(
        'A school year cannot have more than 3 semesters.',
      );
    }

    // 3. Check overlap with existing semesters in the same school year
    const siblings = await this.semesterRepository.findSiblingsInSchoolYear(
      orgId,
      dto.schoolYearId,
    );

    for (const sibling of siblings) {
      if (
        isOverlapping(
          { startDate, endDate },
          { startDate: sibling.start_date, endDate: sibling.end_date },
        )
      ) {
        throw new ConflictException(
          `Semester dates overlap with existing semester "${sibling.name}".`,
        );
      }
    }

    // 4. Validate term date ranges — must be within the semester range
    for (const term of dto.terms) {
      const tStart = new Date(term.startDate);
      const tEnd = new Date(term.endDate);

      validateDateRange(tStart, tEnd, `Term "${term.name}"`);

      if (tStart < startDate || tEnd > endDate) {
        throw new BadRequestException(
          `Term "${term.name}" dates must fall within the semester date range.`,
        );
      }
    }

    // 5. Validate terms don't overlap each other
    for (let i = 0; i < dto.terms.length; i++) {
      for (let j = i + 1; j < dto.terms.length; j++) {
        const a = { startDate: new Date(dto.terms[i].startDate), endDate: new Date(dto.terms[i].endDate) };
        const b = { startDate: new Date(dto.terms[j].startDate), endDate: new Date(dto.terms[j].endDate) };

        if (isOverlapping(a, b)) {
          throw new ConflictException(
            `Terms "${dto.terms[i].name}" and "${dto.terms[j].name}" have overlapping dates.`,
          );
        }
      }
    }

    // 6. Create semester then terms in a transaction
    const semester = await this.semesterRepository.create({
      orgId,
      schoolYearId: dto.schoolYearId,
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
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
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
      ? new Date(dto.startDate)
      : semester.start_date;
    const endDate = dto.endDate ? new Date(dto.endDate) : semester.end_date;

    validateDateRange(startDate, endDate, 'Semester');

    // Check overlap with siblings (excluding self)
    const siblings = await this.semesterRepository.findSiblingsInSchoolYear(
      orgId,
      semester.school_year_id,
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
          `Semester dates overlap with existing semester "${sibling.name}".`,
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
      // Validate terms
      for (const term of dto.terms) {
        const tStart = new Date(term.startDate);
        const tEnd = new Date(term.endDate);

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
        dto.terms.map((t) => ({
          id: t.id,
          name: t.name,
          orderIndex: t.orderIndex,
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate),
        })),
      );
    }

    return this.semesterRepository.findById(id, orgId);
  }

  // ── DELETE /semester-settings/:id ──────────────────────────────────────────

  /**
   * Hard deletes the semester and its terms.
   * Semesters are configuration templates — no academic records live here
   * directly (classes reference semester_id, that is handled in Phase 3).
   */
  async remove(id: string, orgId: string) {
    const semester = await this.semesterRepository.findById(id, orgId);

    if (!semester) {
      throw new NotFoundException('Semester not found.');
    }

    // Delete terms first, then semester
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