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
  async findAllWithStats(
    orgId: string,
    schoolYearId: string,
    includeAssignment = false,
  ) {
    return this.programRepository.findAllWithStats(
      orgId,
      schoolYearId,
      includeAssignment,
    );
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

  async getSemesters(programId: string, schoolYearId: string, orgId: string) {
    // Find the semester template assignment for this program
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

    const templateSemesterNames = new Set(
      assignment.template.semesters.map((s: { name: string }) => s.name),
    );

    // Find actual Semester records matching those names + school year
    const semesters = await this.db.semester.findMany({
      where: {
        org_id: orgId,
        school_year_id: schoolYearId,
        name: { in: [...templateSemesterNames] },
      },
      include: {
        terms: { orderBy: { order_index: 'asc' as const } },
      },
      orderBy: { start_date: 'asc' as const },
    });

    return semesters.map((s) => ({
      id: s.id,
      school_year_id: s.school_year_id,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      terms: (s.terms ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        order_index: t.order_index,
        start_date: t.start_date,
        end_date: t.end_date,
      })),
    }));
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
