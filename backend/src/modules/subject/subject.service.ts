// filepath: src/modules/subject/subject.service.ts
// FIXED VERSION - Updates share() method to use mapped response properties

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

@Injectable()
export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  private mapToResponse(subject: any) {
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

  async create(orgId: string, dto: CreateSubjectDto) {
    const program = await this.subjectRepository.findProgramById(
      dto.programId,
      orgId,
    );
    if (!program) throw new NotFoundException('Program not found.');

    this.validateSubjectScope(dto, program.type);

    const subject = await this.subjectRepository.create({
      orgId,
      name: dto.name,
      subjectType: dto.subjectType,
      programId: dto.programId,
      levelId: dto.levelId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      yearLevel: dto.yearLevel,
      termLabel: dto.termLabel,
    });
    return this.mapToResponse(subject);
  }

  async findAll(orgId: string, query: QuerySubjectDto) {
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

  async findById(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);
    if (!subject) throw new NotFoundException('Subject not found.');
    return this.mapToResponse(subject);
  }

  async update(id: string, orgId: string, dto: UpdateSubjectDto) {
    const subject = await this.subjectRepository.findById(id, orgId);
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
      const program = await this.subjectRepository.findProgramById(
        dto.programId ?? subject.program_id,
        orgId,
      );
      if (!program) throw new NotFoundException('Program not found.');
      this.validateSubjectScope(
        {
          subjectType: dto.subjectType ?? subject.subject_type,
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

    const updated = await this.subjectRepository.update(id, {
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
    });
    return this.mapToResponse(updated);
  }

  async lock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);
    if (!subject) throw new NotFoundException('Subject not found.');
    if (subject.is_locked)
      throw new BadRequestException('Subject is already locked.');
    const updated = await this.subjectRepository.setLocked(id, true);
    return this.mapToResponse(updated);
  }

  async unlock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);
    if (!subject) throw new NotFoundException('Subject not found.');
    if (!subject.is_locked)
      throw new BadRequestException('Subject is already unlocked.');
    const updated = await this.subjectRepository.setLocked(id, false);
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

    // Get raw data first for validation (need unmapped properties)
    const rawSubject = await this.subjectRepository.findById(id, orgId);
    if (!rawSubject) throw new NotFoundException('Subject not found.');

    // Now check the actual properties on the raw subject object
    // Note: findById returns mapped response, so we need to check unmapped properties
    // The repository returns mapped data, so we need to be careful here

    if (rawSubject.subjectType !== 'minor') {
      throw new BadRequestException('Only minor subjects can be shared.');
    }

    if (!rawSubject.programId) {
      throw new BadRequestException(
        'Minor subject must have a programId before sharing.',
      );
    }

    if (!rawSubject.levelId) {
      throw new BadRequestException(
        'Minor subject must have a levelId before sharing.',
      );
    }

    if (dto.courseId) {
      const course = await this.subjectRepository.findCourseById(
        dto.courseId,
        orgId,
      );
      if (!course) throw new NotFoundException('Course not found.');
      if (course.program_id !== rawSubject.programId) {
        throw new BadRequestException(
          'Target course does not belong to the same program as this subject.',
        );
      }
    }

    if (dto.strandId) {
      const strand = await this.subjectRepository.findStrandById(
        dto.strandId,
        orgId,
      );
      if (!strand) throw new NotFoundException('Strand not found.');
      if (strand.program_id !== rawSubject.programId) {
        throw new BadRequestException(
          'Target strand does not belong to the same program as this subject.',
        );
      }
    }

    if (dto.levelId) {
      const level = await this.subjectRepository.findLevelById(
        dto.levelId,
        orgId,
      );
      if (!level) throw new NotFoundException('Level not found.');
      if (level.program_id !== rawSubject.programId) {
        throw new BadRequestException(
          'Target level does not belong to the same program as this subject.',
        );
      }
      if (dto.levelId !== rawSubject.levelId) {
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

  async unshare(id: string, sharingId: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);
    if (!subject) throw new NotFoundException('Subject not found.');
    await this.subjectRepository.removeSharing(sharingId, orgId);
    return { success: true };
  }

  async findSharings(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);
    if (!subject) throw new NotFoundException('Subject not found.');
    return this.subjectRepository.findSharings(id, orgId);
  }
}
