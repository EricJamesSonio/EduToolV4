// filepath: backend/src/modules/subject/subject.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SubjectRepository } from './subject.repository';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  ShareSubjectDto,
} from './dto/subject.dto';
import {
  SubjectRecord,
  ProgramRecord,
  CourseRecord,
  StrandRecord,
  LevelRecord,
  SubjectResponse,
} from './subject.types';
import { mapSubjectToResponse } from './subject.mapper';
import { validateSubjectScope } from './subject.validator';

@Injectable()
export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  async create(orgId: string, dto: CreateSubjectDto): Promise<SubjectResponse> {
    const program = (await this.subjectRepository.findProgramById(
      dto.programId,
      orgId,
    )) as ProgramRecord | null;
    if (!program) throw new NotFoundException('Program not found.');

    validateSubjectScope(dto, program.type);

    const existingSubject = await this.subjectRepository.findDuplicateByName(
      orgId,
      dto.name,
      dto.programId,
      dto.levelId,
      dto.subjectType,
    );
    if (existingSubject) {
      throw new ConflictException(
        'Subject already exists for this program and level.',
      );
    }

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
    return mapSubjectToResponse(subject);
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
      data: data.map((s) => mapSubjectToResponse(s)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, orgId: string): Promise<SubjectResponse> {
    const subject = (await this.subjectRepository.findById(
      id,
      orgId,
    )) as SubjectRecord | null;
    if (!subject) throw new NotFoundException('Subject not found.');
    return mapSubjectToResponse(subject);
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

      validateSubjectScope(
        {
          subjectType: dto.subjectType ?? subject.subject_type ?? undefined,
          courseId: dto.courseId,
          strandId: dto.strandId,
          levelId: dto.levelId,
        } as CreateSubjectDto,
        program.type,
      );
    }

    const nameToCheck = dto.name ?? subject.name;
    const levelToCheck =
      dto.levelId !== undefined ? dto.levelId : subject.level_id;
    const typeToCheck = dto.subjectType ?? subject.subject_type ?? undefined;

    const existingSubject = await this.subjectRepository.findDuplicateByName(
      orgId,
      nameToCheck,
      dto.programId ?? subject.program_id ?? undefined,
      levelToCheck,
      typeToCheck,
      id,
    );
    if (existingSubject) {
      throw new ConflictException(
        'Subject already exists for this program and level.',
      );
    }

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
    return mapSubjectToResponse(updated);
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
    return mapSubjectToResponse(updated);
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
    return mapSubjectToResponse(updated);
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