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

  async create(orgId: string, dto: CreateSubjectDto) {
    return this.subjectRepository.create({
      orgId,
      name: dto.name,
      levelId: dto.levelId,
      educatorId: dto.educatorId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      yearLevel: dto.yearLevel,
      termLabel: dto.termLabel,
    })
  }

  async findAll(orgId: string, query: QuerySubjectDto) {
    return this.subjectRepository.findAll(orgId, {
      levelId: query.levelId,
      educatorId: query.educatorId,
      search: query.search,
      courseId: query.courseId,
      strandId: query.strandId,
      scope: query.scope,
      yearLevel: query.yearLevel,
      termLabel: query.termLabel,
    })
  }

  async findById(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    return subject
  }

  async update(id: string, orgId: string, dto: UpdateSubjectDto) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    if (subject.is_locked) {
      throw new BadRequestException(
        'This subject is locked and cannot be modified. Unlock it first.',
      )
    }

    return this.subjectRepository.update(id, {
      name: dto.name,
      levelId: dto.levelId,
      educatorId: dto.educatorId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      yearLevel: dto.yearLevel,
      termLabel: dto.termLabel,
    })
  }

  async lock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    if (subject.is_locked) throw new BadRequestException('Subject is already locked.')
    return this.subjectRepository.setLocked(id, true)
  }

  async unlock(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    if (!subject.is_locked) throw new BadRequestException('Subject is already unlocked.')
    return this.subjectRepository.setLocked(id, false)
  }

  async unlockAllForOrg(orgId: string) {
    return this.subjectRepository.unlockAllForOrg(orgId)
  }

  // Used by seeder to resolve subject names → IDs for prerequisite linking
  async findByNameInOrg(name: string, orgId: string) {
    return this.subjectRepository.findByNameInOrg(name, orgId)
  }
}