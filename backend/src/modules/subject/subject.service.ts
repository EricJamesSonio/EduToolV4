// src/modules/subject/subject.service.ts
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
} from './dto/subject.dto';

@Injectable()
export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  // ── POST /subjects ──────────────────────────────────────────────────────────

  async create(orgId: string, dto: CreateSubjectDto) {
    return this.subjectRepository.create({
      orgId,
      name: dto.name,
      levelId: dto.levelId,
      educatorId: dto.educatorId,
    });
  }

  // ── GET /subjects ───────────────────────────────────────────────────────────

  async findAll(orgId: string, query: QuerySubjectDto) {
    return this.subjectRepository.findAll(orgId, {
      levelId: query.levelId,
      educatorId: query.educatorId,
      search: query.search,
    });
  }

  // ── PATCH /subjects/:id ─────────────────────────────────────────────────────

  async update(id: string, orgId: string, dto: UpdateSubjectDto) {
    const subject = await this.subjectRepository.findById(id, orgId);

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (subject.is_locked) {
      throw new BadRequestException(
        'This subject is locked and cannot be modified. Unlock it first.',
      );
    }

    return this.subjectRepository.update(id, {
      name: dto.name,
      levelId: dto.levelId,
      // Allow explicitly unassigning educator by passing null via undefined check
      educatorId: dto.educatorId,
    });
  }

  // ── PATCH /subjects/:id/lock ────────────────────────────────────────────────

  /**
   * Admin manually locks the subject when enrollment begins.
   * Locked subjects become read-only.
   */
  async lock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (subject.is_locked) {
      throw new BadRequestException('Subject is already locked.');
    }

    return this.subjectRepository.setLocked(id, true);
  }

  // ── PATCH /subjects/:id/unlock ──────────────────────────────────────────────

  /**
   * Admin manually unlocks a subject.
   * Per system spec, subjects auto-unlock at the start of each new school year.
   * This endpoint allows manual unlock as well.
   */
  async unlock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (!subject.is_locked) {
      throw new BadRequestException('Subject is already unlocked.');
    }

    return this.subjectRepository.setLocked(id, false);
  }

  // ── Utility (called by other modules) ──────────────────────────────────────

  async findById(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId);

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    return subject;
  }

  /**
   * Unlocks all subjects in an org.
   * Phase 3: called when a new school year is activated.
   */
  async unlockAllForOrg(orgId: string) {
    return this.subjectRepository.unlockAllForOrg(orgId);
  }
}