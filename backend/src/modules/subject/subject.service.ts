import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { SubjectRepository } from './subject.repository'
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  QuerySubjectDto,
} from './dto/subject.dto'

@Injectable()
export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  // ─── Mapper ───────────────────────────────────────────────────────────────
private mapToResponse(subject: any) {
  return {
    id: subject.id,
    orgId: subject.org_id,
    title: subject.name,
    programId: subject.level_id,
    programName: subject.levelName ?? null,      // ← from enrichSubjects
    educatorId: subject.educator_id,
    educatorName: subject.educatorName ?? null,  // ← from enrichSubjects
    lockStatus: subject.is_locked ? 'locked' : 'unlocked',
    yearLevel: subject.year_level,
    termLabel: subject.term_label,
    courseId: subject.course_id,
    strandId: subject.strand_id,
    prerequisites: subject.prerequisites ?? [],
    prereqFor: subject.prereqFor ?? [],
  }
}

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  async create(orgId: string, dto: CreateSubjectDto) {
    const subject = await this.subjectRepository.create({
      orgId,
      name: dto.name,
      levelId: dto.levelId,
      educatorId: dto.educatorId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      yearLevel: dto.yearLevel,
      termLabel: dto.termLabel,
    })
    return this.mapToResponse(subject)
  }

  async findAll(orgId: string, query: QuerySubjectDto) {
    const subjects = await this.subjectRepository.findAll(orgId, {
      levelId: query.levelId,
      educatorId: query.educatorId,
      search: query.search,
      courseId: query.courseId,
      strandId: query.strandId,
      scope: query.scope,
      yearLevel: query.yearLevel,
      termLabel: query.termLabel,
    })
    return subjects.map((s) => this.mapToResponse(s))
  }

  async findById(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    return this.mapToResponse(subject)
  }

  async update(id: string, orgId: string, dto: UpdateSubjectDto) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    if (subject.is_locked) {
      throw new BadRequestException(
        'This subject is locked and cannot be modified. Unlock it first.',
      )
    }
    const updated = await this.subjectRepository.update(id, {
      name: dto.name,
      levelId: dto.levelId,
      educatorId: dto.educatorId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      yearLevel: dto.yearLevel,
      termLabel: dto.termLabel,
    })
    return this.mapToResponse(updated)
  }

  async lock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    if (subject.is_locked) throw new BadRequestException('Subject is already locked.')
    const updated = await this.subjectRepository.setLocked(id, true)
    return this.mapToResponse(updated)
  }

  async unlock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    if (!subject.is_locked) throw new BadRequestException('Subject is already unlocked.')
    const updated = await this.subjectRepository.setLocked(id, false)
    return this.mapToResponse(updated)
  }

  async unlockAllForOrg(orgId: string) {
    return this.subjectRepository.unlockAllForOrg(orgId)
  }

  async findByNameInOrg(name: string, orgId: string) {
    return this.subjectRepository.findByNameInOrg(name, orgId)
  }
}