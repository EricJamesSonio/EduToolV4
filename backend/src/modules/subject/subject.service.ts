// ===== File: backend\src\modules\subject\subject.service.ts =====
// filepath: src/modules/subject/subject.service.ts
// FIXED VERSION - typed repository results to remove @typescript-eslint/no-unsafe-* warnings

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SubjectRepository } from './subject.repository';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  ShareSubjectDto,
} from './dto/subject.dto';

/**
 * NOTE: SubjectRepository does not currently declare typed return values,
 * so every value read from it comes back as `any`. Until the repository
 * itself is typed (e.g. via Prisma's generated types), the shapes below
 * describe what this service actually reads off those results, and are
 * used to cast repository responses at the call site.
 */
interface SubjectProgramRelation {
  name: string | null;
  type: string | null;
}

interface SubjectRecord {
  id: string;
  org_id: string;
  name: string;
  subject_type: string | null;
  program_id: string | null;
  program: SubjectProgramRelation | null;
  level_id: string | null;
  levelName: string | null;
  course_id: string | null;
  courseName: string | null;
  strand_id: string | null;
  strandName: string | null;
  is_locked: boolean;
  year_level: number | string | null;
  term_label: string | null;
  prerequisites: unknown[];
  prereqFor: unknown[];
  sharings: unknown[];
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface ProgramRecord {
  id: string;
  type: string;
}

interface CourseRecord {
  id: string;
  program_id: string;
}

interface StrandRecord {
  id: string;
  program_id: string;
}

interface LevelRecord {
  id: string;
  program_id: string;
}

export interface SubjectResponse {
  id: string;
  orgId: string;
  title: string;
  subjectType: string;
  programId: string | null;
  programName: string | null;
  programType: string | null;
  realProgramId: string | null;
  levelId: string | null;
  levelName: string | null;
  courseId: string | null;
  courseName: string | null;
  strandId: string | null;
  strandName: string | null;
  lockStatus: 'locked' | 'unlocked';
  yearLevel: number | string | null;
  termLabel: string | null;
  prerequisites: unknown[];
  prereqFor: unknown[];
  sharings: unknown[];
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

@Injectable()
export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  private mapToResponse(subject: SubjectRecord): SubjectResponse {
    return {
      id: subject.id,
      orgId: subject.org_id,
      title: subject.name,
      subjectType: subject.subject_type ?? 'major',
      programId: subject.program_id ?? null,
      programName: subject.program?.name ?? null,
      programType: subject.program?.type ?? null,
      realProgramId: subject.program_id ?? null,
      levelId: subject.level_id ?? null,
      levelName: subject.levelName ?? null,
      courseId: subject.course_id ?? null,
      courseName: subject.courseName ?? null,
      strandId: subject.strand_id ?? null,
      strandName: subject.strandName ?? null,
      lockStatus: subject.is_locked ? 'locked' : 'unlocked',
      yearLevel: subject.year_level ?? null,
      termLabel: subject.term_label ?? null,
      prerequisites: subject.prerequisites ?? [],
      prereqFor: subject.prereqFor ?? [],
      sharings: subject.sharings ?? [],
      createdAt: subject.created_at ?? null,
      updatedAt: subject.updated_at ?? null,
    };
  }

  private validateSubjectScope(
    dto: CreateSubjectDto,
    programType: string,
  ): void {
    const type = dto.subjectType ?? 'major';

    if (type === 'major') {
      const isCourse = programType === 'college';
      const isStrand = programType === 'shs';

      if (isCourse && !dto.courseId) {
        throw new BadRequestException(
          'Major subjects under a college program require a courseId.',
        );
      }
      if (isStrand && !dto.strandId) {
        throw new BadRequestException(
          'Major subjects under a SHS program require a strandId.',
        );
      }
    }

    if (type === 'minor' && !dto.levelId) {
      throw new BadRequestException('Minor subjects must specify a levelId.');
    }
  }

  async create(orgId: string, dto: CreateSubjectDto): Promise<SubjectResponse> {
    const program = (await this.subjectRepository.findProgramById(
      dto.programId,
      orgId,
    )) as ProgramRecord | null;
    if (!program) throw new NotFoundException('Program not found.');

    this.validateSubjectScope(dto, program.type);

    const subject = (await this.subjectRepository.create({
      orgId,
      name: dto.name,
      subjectType: dto.subjectType,
      programId: dto.programId,
      levelId: dto.levelId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      yearLevel: dto.yearLevel,
      termLabel: dto.termLabel,
    })) as SubjectRecord;
    return this.mapToResponse(subject);
  }

  async findAll(
    orgId: string,
    query: QuerySubjectDto,
  ): Promise<{
    data: SubjectResponse[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const { data, total } = await this.subjectRepository.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      programId: query.programId,
      levelId: query.levelId,
      search: query.search,
      courseId: query.courseId,
      strandId: query.strandId,
      scope: query.scope,
      yearLevel: query.yearLevel,
      termLabel: query.termLabel,
      subjectType: query.subjectType,
      page,
      limit,
    });

    return {
      data: data.map((s) => this.mapToResponse(s)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, orgId: string): Promise<SubjectResponse> {
    const subject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!subject) throw new NotFoundException('Subject not found.');
    return this.mapToResponse(subject);
  }

  async update(
    id: string,
    orgId: string,
    dto: UpdateSubjectDto,
  ): Promise<SubjectResponse> {
    const subject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!subject) throw new NotFoundException('Subject not found.');
    if (subject.is_locked) {
      throw new BadRequestException(
        'This subject is locked and cannot be modified. Unlock it first.',
      );
    }

    const programChanged =
      !!dto.programId && dto.programId !== subject.program_id;
    const typeChanged =
      !!dto.subjectType && dto.subjectType !== subject.subject_type;
    const scopeChanged = programChanged || typeChanged;

    // When the subject is reassigned to another department (or its type
    // changes), re-validate that the required course/strand/level are provided
    // for the target program type.
    if (scopeChanged) {
      const targetProgramId = dto.programId ?? subject.program_id;
      if (!targetProgramId) {
        throw new BadRequestException(
          'Subject has no associated program to validate against.',
        );
      }

      const program = (await this.subjectRepository.findProgramById(
        targetProgramId,
        orgId,
      )) as ProgramRecord | null;
      if (!program) throw new NotFoundException('Program not found.');
      this.validateSubjectScope(
        {
          subjectType: dto.subjectType ?? subject.subject_type ?? undefined,
          courseId: dto.courseId,
          strandId: dto.strandId,
          levelId: dto.levelId,
        } as CreateSubjectDto,
        program.type,
      );
    }

    // Moving a subject to another department invalidates its existing
    // course/strand/level sharings, so drop them to keep data consistent.
    if (programChanged) {
      await this.subjectRepository.clearSharings(id, orgId);
    }

    const updated = (await this.subjectRepository.update(id, {
      name: dto.name,
      subjectType: dto.subjectType,
      programId: programChanged ? dto.programId : undefined,
      levelId: scopeChanged && dto.levelId === undefined ? null : dto.levelId,
      courseId:
        scopeChanged && dto.courseId === undefined ? null : dto.courseId,
      strandId:
        scopeChanged && dto.strandId === undefined ? null : dto.strandId,
      yearLevel: dto.yearLevel,
      termLabel: dto.termLabel,
    })) as SubjectRecord;
    return this.mapToResponse(updated);
  }

  async lock(id: string, orgId: string): Promise<SubjectResponse> {
    const subject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!subject) throw new NotFoundException('Subject not found.');
    if (subject.is_locked)
      throw new BadRequestException('Subject is already locked.');
    const updated = (await this.subjectRepository.setLocked(
      id,
      true,
    )) as SubjectRecord;
    return this.mapToResponse(updated);
  }

  async unlock(id: string, orgId: string): Promise<SubjectResponse> {
    const subject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!subject) throw new NotFoundException('Subject not found.');
    if (!subject.is_locked)
      throw new BadRequestException('Subject is already unlocked.');
    const updated = (await this.subjectRepository.setLocked(
      id,
      false,
    )) as SubjectRecord;
    return this.mapToResponse(updated);
  }

  async unlockAllForOrg(orgId: string) {
    return this.subjectRepository.unlockAllForOrg(orgId);
  }

  async findByNameInOrg(name: string, orgId: string) {
    return this.subjectRepository.findByNameInOrg(name, orgId);
  }

  async share(id: string, orgId: string, dto: ShareSubjectDto) {
    const targets = [dto.courseId, dto.strandId, dto.levelId].filter(Boolean);
    if (targets.length !== 1) {
      throw new BadRequestException(
        'Exactly one of courseId, strandId, or levelId must be provided.',
      );
    }

    // Raw record from the repository — same shape used by every other
    // method in this file (snake_case), so we read it consistently here too.
    const rawSubject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!rawSubject) throw new NotFoundException('Subject not found.');

    if (rawSubject.subject_type !== 'minor') {
      throw new BadRequestException('Only minor subjects can be shared.');
    }

    if (!rawSubject.program_id) {
      throw new BadRequestException(
        'Minor subject must have a programId before sharing.',
      );
    }

    if (!rawSubject.level_id) {
      throw new BadRequestException(
        'Minor subject must have a levelId before sharing.',
      );
    }

    if (dto.courseId) {
      const course = (await this.subjectRepository.findCourseById(
        dto.courseId,
        orgId,
      )) as CourseRecord | null;
      if (!course) throw new NotFoundException('Course not found.');
      if (course.program_id !== rawSubject.program_id) {
        throw new BadRequestException(
          'Target course does not belong to the same program as this subject.',
        );
      }
    }

    if (dto.strandId) {
      const strand = (await this.subjectRepository.findStrandById(
        dto.strandId,
        orgId,
      )) as StrandRecord | null;
      if (!strand) throw new NotFoundException('Strand not found.');
      if (strand.program_id !== rawSubject.program_id) {
        throw new BadRequestException(
          'Target strand does not belong to the same program as this subject.',
        );
      }
    }

    if (dto.levelId) {
      const level = (await this.subjectRepository.findLevelById(
        dto.levelId,
        orgId,
      )) as LevelRecord | null;
      if (!level) throw new NotFoundException('Level not found.');
      if (level.program_id !== rawSubject.program_id) {
        throw new BadRequestException(
          'Target level does not belong to the same program as this subject.',
        );
      }
      if (dto.levelId !== rawSubject.level_id) {
        throw new BadRequestException(
          'Minor subject can only be shared to its own level.',
        );
      }
    }

    return this.subjectRepository.addSharing(id, orgId, {
      courseId: dto.courseId,
      strandId: dto.strandId,
      levelId: dto.levelId,
    });
  }

  async unshare(
    id: string,
    sharingId: string,
    orgId: string,
  ): Promise<{ success: true }> {
    const subject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!subject) throw new NotFoundException('Subject not found.');
    await this.subjectRepository.removeSharing(sharingId, orgId);
    return { success: true };
  }

  async findSharings(id: string, orgId: string) {
    const subject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!subject) throw new NotFoundException('Subject not found.');
    return this.subjectRepository.findSharings(id, orgId);
  }
}
