import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { SubjectPrerequisiteRepository } from './subject-prerequisite.repository'
import {
  CreatePrerequisiteDto,
  BulkCreatePrerequisiteDto,
  PrerequisiteCheckResultDto,
} from './dto/subject-prerequisite.dto'

// Minimum passing grade — adjust to match your org's grading scale
const PASSING_SCORE = 75

@Injectable()
export class SubjectPrerequisiteService {
  constructor(
    private readonly prereqRepository: SubjectPrerequisiteRepository,
  ) {}

  async create(dto: CreatePrerequisiteDto) {
    if (dto.subject_id === dto.prerequisite_id) {
      throw new BadRequestException('A subject cannot be a prerequisite of itself')
    }

    const existing = await this.prereqRepository.findOne(
      dto.subject_id,
      dto.prerequisite_id,
      dto.org_id,
    )
    if (existing) {
      throw new ConflictException('This prerequisite link already exists')
    }

    return this.prereqRepository.create(dto)
  }

  async bulkCreate(dto: BulkCreatePrerequisiteDto) {
    if (dto.prerequisite_ids.includes(dto.subject_id)) {
      throw new BadRequestException('A subject cannot be a prerequisite of itself')
    }

    // Clear existing prereqs for this subject then re-seed — clean replace
    await this.prereqRepository.deleteAllForSubject(dto.subject_id, dto.org_id)

    return this.prereqRepository.bulkCreate(
      dto.org_id,
      dto.subject_id,
      dto.prerequisite_ids,
    )
  }

  async findBySubject(subject_id: string, org_id: string) {
    return this.prereqRepository.findBySubject(subject_id, org_id)
  }

  async remove(id: string, subject_id: string, org_id: string) {
    const existing = await this.prereqRepository.findOne(subject_id, id, org_id)
    if (!existing) throw new NotFoundException('Prerequisite link not found')
    return this.prereqRepository.delete(existing.id)
  }

  /**
   * Core enrollment gate — call this from the enrollment service before
   * inserting an Enrollment row.
   *
   * Returns { eligible: true } if the student meets all prerequisites,
   * or { eligible: false, missing: [...] } listing exactly which prereqs
   * are unmet and why.
   */
  async checkEligibility(
    subject_id: string,
    student_id: string,
    org_id: string,
  ): Promise<PrerequisiteCheckResultDto> {
    const rows = await this.prereqRepository.getPrerequisitesWithGrades(
      subject_id,
      student_id,
      org_id,
    )

    // No prerequisites defined — always eligible
    if (rows.length === 0) return { eligible: true, missing: [] }

    const missing: PrerequisiteCheckResultDto['missing'] = []

    for (const row of rows) {
      if (!row.grade) {
        // Student has no locked grade record for this subject at all
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_taken',
        })
        continue
      }

      if (!row.grade.is_locked) {
        // Grade exists but hasn't been locked by the educator yet
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_locked',
        })
        continue
      }

      if (row.grade.final_score < PASSING_SCORE) {
        // Grade is locked but the student didn't pass
        missing.push({
          subject_id: row.subject_id,
          subject_name: row.subject_name,
          reason: 'not_passed',
        })
      }
    }

    return {
      eligible: missing.length === 0,
      missing,
    }
  }
}