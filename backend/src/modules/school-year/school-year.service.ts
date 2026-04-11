// backend/src/modules/school-year/school-year.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { SchoolYearRepository }         from './school-year.repository'
import { LevelService }                 from '@/modules/level/level.service'
import { SubjectService }               from '@/modules/subject/subject.service'
import { GradingScaleService }          from '../grading-scale/grading-scale.service'
import { CreateSchoolYearDto, UpdateSchoolYearDto, SchoolYearCreateResult } from './dto/school-year.dto'



const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

interface CreateResult {
  data: Awaited<ReturnType<SchoolYearRepository['findById']>>
  warning?: string
}

@Injectable()
export class SchoolYearService {
  constructor(
    private readonly schoolYearRepository: SchoolYearRepository,
    private readonly levelService:         LevelService,
    private readonly subjectService:       SubjectService,
    private readonly gradingScaleService:  GradingScaleService,
  ) {}

  // ---------------------------------------------------------------------------
  // Date validation helpers
  // ---------------------------------------------------------------------------

  private validateDateRange(start_date?: string, end_date?: string): void {
    if (!start_date || !end_date) return

    const start = new Date(start_date)
    const end   = new Date(end_date)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return // class-validator already catches this

    if (end <= start) {
      throw new BadRequestException('end_date must be after start_date.')
    }
  }

  /**
   * Returns true when both dates are provided and the span is less than 1 year.
   * The caller decides whether to abort or proceed based on confirm_short_duration.
   */
  private isShortDuration(start_date?: string, end_date?: string): boolean {
    if (!start_date || !end_date) return false

    const start = new Date(start_date)
    const end   = new Date(end_date)
    return end.getTime() - start.getTime() < ONE_YEAR_MS
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(orgId: string, dto: CreateSchoolYearDto): Promise<SchoolYearCreateResult> {
    this.validateDateRange(dto.start_date, dto.end_date)

    const short = this.isShortDuration(dto.start_date, dto.end_date)

    if (short && !dto.confirm_short_duration) {
      // Surface a 422-style warning — client must re-submit with confirm_short_duration: true
      throw new BadRequestException({
        statusCode: 400,
        error:      'SHORT_DURATION_WARNING',
        message:
          'This school year does not span a full year. Are you sure you want to proceed?',
      })
    }

    const schoolYear = await this.schoolYearRepository.create({
      orgId,
      name:       dto.name,
      start_date: dto.start_date,
      end_date:   dto.end_date,
    })

    await this.levelService.seedFromDefaults(orgId, schoolYear.id, {})

    return {
      data:    schoolYear,
      warning: short ? 'School year is shorter than one year.' : undefined,
    }
  }

  async findAll(orgId: string) {
    return this.schoolYearRepository.findAll(orgId)
  }

  async findById(id: string, orgId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId)
    if (!schoolYear) throw new NotFoundException('School year not found.')
    return schoolYear
  }

  async findActive(orgId: string) {
    return this.schoolYearRepository.findActive(orgId)
  }

  async update(id: string, orgId: string, dto: UpdateSchoolYearDto) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId)
    if (!schoolYear) throw new NotFoundException('School year not found.')

    if (schoolYear.status === 'ended') {
      throw new BadRequestException(
        'Ended school years are archived and cannot be modified.',
      )
    }

    // Resolve effective dates for cross-field validation
    const effectiveStart = dto.start_date ?? schoolYear.start_date?.toISOString()
    const effectiveEnd   = dto.end_date   ?? schoolYear.end_date?.toISOString()

    this.validateDateRange(effectiveStart, effectiveEnd)

    const short = this.isShortDuration(effectiveStart, effectiveEnd)

    if (short && !dto.confirm_short_duration) {
      throw new BadRequestException({
        statusCode: 400,
        error:      'SHORT_DURATION_WARNING',
        message:
          'This school year does not span a full year. Are you sure you want to proceed?',
      })
    }

    return this.schoolYearRepository.update(id, {
      name:       dto.name,
      start_date: dto.start_date,
      end_date:   dto.end_date,
    })
  }

  async activate(id: string, orgId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId)
    if (!schoolYear) throw new NotFoundException('School year not found.')

    if (schoolYear.status === 'active')
      throw new ConflictException('This school year is already active.')
    if (schoolYear.status === 'ended')
      throw new BadRequestException('An ended school year cannot be reactivated.')

    const activeCount = await this.schoolYearRepository.countActive(orgId)
    if (activeCount > 0)
      throw new ConflictException(
        'Another school year is currently active. End it before activating a new one.',
      )

    const previousActive = await this.schoolYearRepository.findActive(orgId)
    const result         = await this.schoolYearRepository.updateStatus(id, 'active')

    await this.subjectService.unlockAllForOrg(orgId)

    if (previousActive) {
      await this.gradingScaleService.unlockAllForSchoolYear(previousActive.id, orgId)
    }

    return result
  }

  async end(id: string, orgId: string) {
    const schoolYear = await this.schoolYearRepository.findById(id, orgId)
    if (!schoolYear) throw new NotFoundException('School year not found.')

    if (schoolYear.status === 'ended')
      throw new ConflictException('This school year has already ended.')
    if (schoolYear.status === 'pending')
      throw new BadRequestException(
        'A pending school year cannot be ended. Activate it first.',
      )

    await this.schoolYearRepository.updateStatus(id, 'ended')
    await this.schoolYearRepository.unenrollAllStudents(id, orgId)

    return this.schoolYearRepository.findById(id, orgId)
  }
}