import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProgramRepository } from './program.repository';
import { DatabaseService } from '@/core/database/database.provider';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';

@Injectable()
export class ProgramService {
  constructor(
    private readonly programRepository: ProgramRepository,
    private readonly db: DatabaseService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(orgId: string, dto: CreateProgramDto, actorId: string) {
    const nameTaken = await this.programRepository.findByNameAndYear(
      dto.name,
      orgId,
      dto.schoolYearId,
    );

    if (nameTaken) {
      throw new ConflictException(
        `A program named "${dto.name}" already exists for this school year.`,
      );
    }

    const program = await this.programRepository.create({
      orgId,
      schoolYearId: dto.schoolYearId,
      name: dto.name,
      type: dto.type,
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'program_created',
        entityType: 'program',
        entityId: program.id,
        metadata: { name: dto.name, type: dto.type },
      })
      .catch(() => {});

    return program;
  }

  // ✅ UPDATED: added includeAssignment flag
  async findAll(
    orgId: string,
    schoolYearId: string,
    includeAssignment = false,
  ) {
    return this.programRepository.findAll(
      orgId,
      schoolYearId,
      includeAssignment,
    );
  }

  // ✅ NEW: fetch programs with stats data
  async findAllWithStats(orgId: string, schoolYearId: string) {
    return this.programRepository.findAllWithStats(orgId, schoolYearId);
  }

  async findById(id: string, orgId: string) {
    const program = await this.programRepository.findById(id, orgId);
    if (!program) throw new NotFoundException('Program not found.');
    return program;
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateProgramDto,
    actorId: string,
  ) {
    const program = await this.programRepository.findById(id, orgId);
    if (!program) throw new NotFoundException('Program not found.');

    const updated = await this.programRepository.update(id, {
      name: dto.name,
      type: dto.type,
    });

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'program_updated',
        entityType: 'program',
        entityId: id,
        metadata: { name: dto.name },
      })
      .catch(() => {});

    return updated;
  }

  /**
   * Semesters actually belonging to this program in this school year.
   *
   * Resolved by the real `program_id` FK on Semester — no more resolving
   * "this program's semesters" by matching Semester.name against a
   * template's semester names. A single scoped query, not a two-step
   * lookup-then-intersect.
   */
  async getSemesters(programId: string, schoolYearId: string, orgId: string) {
    const semesters = await this.db.semester.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        program_id: programId,
      },
      include: {
        terms: { orderBy: { order_index: 'asc' as const } },
      },
      orderBy: { start_date: 'asc' as const },
    });

    return semesters.map((s) => ({
      id: s.id,
      school_year_id: s.school_year_id,
      program_id: s.program_id,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      terms: (s.terms ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        order_index: t.order_index,
        start_date: t.start_date,
        end_date: t.end_date,
      })),
    }));
  }

  /**
   * The semester "slots" this program's assigned template defines
   * (e.g. 1st/2nd Semester, or 1st/2nd/3rd for a tri-sem program), each
   * annotated with whether an actual Semester has been created for it yet
   * in this school year. Drives the semester-creation UI: instead of a
   * free-text name field, the admin picks an open slot.
   */
  async getSemesterSlots(programId: string, schoolYearId: string, orgId: string) {
    const assignment = await this.db.programSemesterAssignment.findFirst({
      where: { program_id: programId, org_id: orgId },
      include: {
        template: {
          include: {
            semesters: { orderBy: { order_index: 'asc' as const } },
          },
        },
      },
    });

    if (!assignment) return [];

    const existing = await this.db.semester.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId, program_id: programId },
      select: {
        id: true,
        template_semester_id: true,
        start_date: true,
        end_date: true,
      },
    });
    const existingByTemplateSemesterId = new Map(
      existing.map((s) => [s.template_semester_id, s]),
    );

    return assignment.template.semesters.map((templateSemester) => {
      const match = existingByTemplateSemesterId.get(templateSemester.id);
      return {
        templateSemesterId: templateSemester.id,
        name: templateSemester.name,
        orderIndex: templateSemester.order_index,
        existingSemesterId: match?.id ?? null,
        startDate: match?.start_date ?? null,
        endDate: match?.end_date ?? null,
      };
    });
  }

  // ✅ NEW: for the Classes page "All Departments" semester filter.
  // Returns one row per (program, semester) pairing — now a direct read off
  // Semester.program_id, no template/name intersection needed.
  async getSemestersGroupedByProgram(orgId: string, schoolYearId: string) {
    const semesters = await this.db.semester.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      include: {
        program: { select: { id: true, name: true } },
      },
      orderBy: { start_date: 'asc' as const },
    });

    const result = semesters.map((s) => ({
      semesterId: s.id,
      semesterName: s.name,
      startDate: s.start_date,
      endDate: s.end_date,
      programId: s.program_id,
      programName: s.program.name,
    }));

    result.sort((x, y) => {
      const byDate = x.startDate.getTime() - y.startDate.getTime();
      if (byDate !== 0) return byDate;
      return x.programName.localeCompare(y.programName);
    });

    return result;
  }

  async remove(id: string, orgId: string, actorId: string) {
    const program = await this.programRepository.findById(id, orgId);
    if (!program) throw new NotFoundException('Program not found.');

    const [hasLevels, hasCourses, hasStrands] = await Promise.all([
      this.programRepository.hasLevels(id),
      this.programRepository.hasCourses(id),
      this.programRepository.hasStrands(id),
    ]);

    const blockers: string[] = [];
    if (hasLevels) blockers.push('levels');
    if (hasCourses) blockers.push('courses');
    if (hasStrands) blockers.push('strands');

    if (blockers.length > 0) {
      throw new ConflictException(
        `Cannot delete this program — it still has ${blockers.join(', ')} assigned to it.`,
      );
    }

    await this.programRepository.delete(id);

    this.auditLogService
      .logAdminAction({
        orgId,
        actorId,
        action: 'program_deleted',
        entityType: 'program',
        entityId: id,
        metadata: { name: program.name },
      })
      .catch(() => {});
  }
}