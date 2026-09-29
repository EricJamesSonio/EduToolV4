// filepath: backend/src/modules/subject/subject.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SubjectRepository } from './subject.repository';
import { DatabaseService } from '@/core/database/database.provider';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
  ShareSubjectDto,
  SubjectHierarchyQueryDto,
} from './dto/subject.dto';
import { parseLevelRank } from '../subject-prerequisite/subject-prerequisite.utils';
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
  constructor(
    private readonly subjectRepository: SubjectRepository,
    private readonly db: DatabaseService,
  ) {}

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

  /**
   * Batched hierarchy payload: 3 queries total (levels, subjects, prereq
   * links) regardless of subject count. Columns ordered 1st -> highest by
   * parsed level rank.
   */
  async getHierarchy(orgId: string, query: SubjectHierarchyQueryDto) {
    const CAP = 1000;

    // 1. Levels in scope (single query) — defines columns + rank order.
    // NOTE: `levelId` is deliberately NOT applied here. This array is returned
    // to the client as the Level dropdown options; filtering it would collapse
    // the dropdown to the one selected level with no way to switch back. The
    // level filter is applied to the subject set below instead.
    const levelWhere: Record<string, unknown> = { org_id: orgId, deleted_at: null };
    if (query.programId) levelWhere['program_id'] = query.programId;
    if (query.courseId) levelWhere['course_id'] = query.courseId;
    if (query.strandId) levelWhere['strand_id'] = query.strandId;
    if (query.schoolYearId) levelWhere['school_year_id'] = query.schoolYearId;
    const levels = await this.db.level.findMany({
      where: levelWhere,
      select: { id: true, name: true, program_id: true, course_id: true, strand_id: true },
      orderBy: { name: 'asc' },
      take: 100,
    });
    const rankOf = (name: string | null, idx: number): number =>
      parseLevelRank(name) ?? 10_000 + idx;
    const orderedLevels = [...levels]
      .map((l, i) => ({ ...l, rank: rankOf(l.name, i) }))
      .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
    const levelRank = new Map(orderedLevels.map((l) => [l.id, l.rank]));
    const levelIds = new Set(orderedLevels.map((l) => l.id));

    // 2. Subjects in scope (single query, no per-row includes).
    const subjectWhere: Record<string, unknown> = { org_id: orgId };
    if (query.programId) subjectWhere['program_id'] = query.programId;
    else if (query.schoolYearId) {
      const programs = await this.db.program.findMany({
        where: { school_year_id: query.schoolYearId, org_id: orgId },
        select: { id: true },
      });
      subjectWhere['program_id'] = { in: programs.map((p) => p.id) };
    }
    if (query.courseId) {
      subjectWhere['OR'] = [{ course_id: null }, { course_id: query.courseId }];
    } else if (query.strandId) {
      subjectWhere['OR'] = [{ strand_id: null }, { strand_id: query.strandId }];
    }
    // Level scope: narrows the PRIMARY subjects to the selected level. Direct
    // prerequisites from other levels are still added below as extraNodes, so
    // edges never dangle and the client can still resolve prerequisite names.
    if (query.levelId) {
      subjectWhere['level_id'] = query.levelId;
    }
    const subjects = await this.db.subject.findMany({
      where: subjectWhere,
      select: {
        id: true,
        name: true,
        level_id: true,
        course_id: true,
        strand_id: true,
        year_level: true,
        term_label: true,
        level: { select: { id: true, name: true } },
        course: { select: { id: true, name: true, code: true } },
        strand: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
      take: CAP,
    });
    // Keep subjects whose level is in scope (or unlevelled); shared minors
    // surface via their own level binding.
    const inScope = subjects.filter(
      (s) => !s.level_id || levelIds.size === 0 || levelIds.has(s.level_id),
    );
    const inScopeIds = new Set(inScope.map((s) => s.id));

    // 3. Prereq links among in-scope subjects (single query).
    const links = inScopeIds.size
      ? await this.db.subjectPrerequisite.findMany({
          where: { org_id: orgId, subject_id: { in: [...inScopeIds] } },
          select: {
            subject_id: true,
            prerequisite_id: true,
            prerequisite: { select: { id: true, name: true } },
          },
        })
      : [];
    const prereqIds = new Set(links.map((l) => l.prerequisite_id));
    // Include prerequisite nodes even if their level sits outside the scope
    // filter so edges never dangle.
    const missingPrereqIds = [...prereqIds].filter((id) => !inScopeIds.has(id));
    let extraNodes: typeof subjects = [];
    if (missingPrereqIds.length) {
      extraNodes = await this.db.subject.findMany({
        where: { org_id: orgId, id: { in: missingPrereqIds } },
        select: {
          id: true,
          name: true,
          level_id: true,
          course_id: true,
          strand_id: true,
          year_level: true,
          term_label: true,
          level: { select: { id: true, name: true } },
          course: { select: { id: true, name: true, code: true } },
          strand: { select: { id: true, name: true } },
        },
      });
    }

    const nodes = [...inScope, ...extraNodes].map((s, i) => {
      const label = s.level?.name ?? s.year_level ?? null;
      const rank = s.level_id
        ? (levelRank.get(s.level_id) ?? rankOf(label, i))
        : rankOf(label, i);
      return {
        id: s.id,
        name: s.name,
        levelId: s.level_id,
        levelName: s.level?.name ?? s.year_level ?? null,
        yearRank: rank,
        courseName: s.course ? (s.course.code ? `${s.course.code} – ${s.course.name}` : s.course.name) : null,
        strandName: s.strand?.name ?? null,
        termLabel: s.term_label ?? null,
      };
    });
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = links
      .filter((l) => nodeIds.has(l.subject_id) && nodeIds.has(l.prerequisite_id))
      .map((l) => ({ from: l.prerequisite_id, to: l.subject_id }));

    return {
      levels: orderedLevels.map((l) => ({ id: l.id, name: l.name, rank: l.rank })),
      nodes,
      edges,
      truncated: subjects.length >= CAP,
    };
  }
}