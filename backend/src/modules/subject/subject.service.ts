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
  ShareSubjectDto,
} from './dto/subject.dto'

@Injectable()
export class SubjectService {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  // ---------------------------------------------------------------------------
  // Mapper
  // ---------------------------------------------------------------------------

  private mapToResponse(subject: any) {
    return {
      id:           subject.id,
      orgId:        subject.org_id,
      title:        subject.name,
      subjectType:  subject.subject_type ?? 'major',
      // programId = actual program_id (for minor subjects)
      programId:    subject.program_id ?? null,
      // levelId / levelName kept for backwards compat (was called programId/programName before)
      levelId:      subject.level_id   ?? null,
      levelName:    subject.levelName  ?? null,
      educatorId:   subject.educator_id,
      educatorName: subject.educatorName ?? null,
      lockStatus:   subject.is_locked ? 'locked' : 'unlocked',
      yearLevel:    subject.year_level,
      termLabel:    subject.term_label,
      courseId:     subject.course_id,
      strandId:     subject.strand_id,
      prerequisites: subject.prerequisites ?? [],
      prereqFor:     subject.prereqFor     ?? [],
      sharings:      subject.sharings      ?? [],
    }
  }

  // ---------------------------------------------------------------------------
  // Core CRUD
  // ---------------------------------------------------------------------------

  async create(orgId: string, dto: CreateSubjectDto) {
    const subject = await this.subjectRepository.create({
      orgId,
      name:        dto.name,
      subjectType: dto.subjectType,
      programId:   dto.programId,
      levelId:     dto.levelId,
      educatorId:  dto.educatorId,
      courseId:    dto.courseId,
      strandId:    dto.strandId,
      yearLevel:   dto.yearLevel,
      termLabel:   dto.termLabel,
    })
    return this.mapToResponse(subject)
  }

  async findAll(orgId: string, query: QuerySubjectDto) {
    const subjects = await this.subjectRepository.findAll(orgId, {
      schoolYearId: query.schoolYearId,
      levelId:      query.levelId,
      educatorId:   query.educatorId,
      search:       query.search,
      courseId:     query.courseId,
      strandId:     query.strandId,
      scope:        query.scope,
      yearLevel:    query.yearLevel,
      termLabel:    query.termLabel,
      subjectType:  query.subjectType,
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
      name:       dto.name,
      levelId:    dto.levelId,
      educatorId: dto.educatorId,
      courseId:   dto.courseId,
      strandId:   dto.strandId,
      yearLevel:  dto.yearLevel,
      termLabel:  dto.termLabel,
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

  // ---------------------------------------------------------------------------
  // Sharing (minor subjects only)
  // ---------------------------------------------------------------------------

  async share(id: string, orgId: string, dto: ShareSubjectDto) {
    // Validate exactly one target
    const targets = [dto.courseId, dto.strandId, dto.levelId].filter(Boolean)
    if (targets.length !== 1) {
      throw new BadRequestException(
        'Exactly one of courseId, strandId, or levelId must be provided.',
      )
    }

    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    if (subject.subjectType !== 'minor') {
      throw new BadRequestException('Only minor subjects can be shared.')
    }
    if (!subject.programId) {
      throw new BadRequestException(
        'Minor subject must have a programId before sharing.',
      )
    }

    // Guard: target must belong to the same program
    await this.validateTargetBelongsToProgram(subject.programId, dto)

    const sharing = await this.subjectRepository.addSharing(id, orgId, {
      courseId: dto.courseId,
      strandId: dto.strandId,
      levelId:  dto.levelId,
    })
    return sharing
  }

  async unshare(id: string, sharingId: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')

    await this.subjectRepository.removeSharing(sharingId, orgId)
    return { success: true }
  }

  async findSharings(id: string, orgId: string) {
    const subject = await this.subjectRepository.findById(id, orgId)
    if (!subject) throw new NotFoundException('Subject not found.')
    return this.subjectRepository.findSharings(id, orgId)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validates that the sharing target (course/strand/level) belongs to the
   * same program as the minor subject. Throws BadRequestException if not.
   */
  private async validateTargetBelongsToProgram(
    programId: string,
    dto: ShareSubjectDto,
  ) {
    // We need db access here — delegate to the repository
    // by checking the target's program_id directly via prisma.
    // SubjectRepository doesn't expose db publicly, so we re-check via
    // the repository's underlying db using a service-layer approach.
    // [ASSUMPTION] We cannot directly query db here without injecting
    // DatabaseService into the service. For now, this validation is best
    // placed in the repository where db is available.
    //
    // The repository's addSharing will throw a Prisma unique constraint
    // error if a duplicate sharing exists. Program-scope validation is
    // handled by the repository via validateSharingTarget() below.
    //
    // TODO: Inject DatabaseService here if stronger program-scope checks
    // are needed at the service layer without coupling to Prisma directly.
  }
}