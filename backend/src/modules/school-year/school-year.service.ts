import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { SchoolYearRepository }          from './school-year.repository'
import { LevelService }                  from '@/modules/level/level.service'
import { SubjectService }                from '@/modules/subject/subject.service'
import { GradingScaleService }           from '../grading-scale/grading-scale.service'
import { CreateSchoolYearDto, UpdateSchoolYearDto } from './dto/school-year.dto'

@Injectable()
export class SchoolYearService {
  constructor(
    private readonly schoolYearRepository: SchoolYearRepository,
    private readonly levelService:         LevelService,
    private readonly subjectService:       SubjectService,
    private readonly gradingScaleService:  GradingScaleService,
  ) {}

  async create(orgId: string, dto: CreateSchoolYearDto) {
    const schoolYear = await this.schoolYearRepository.create({
      orgId,
      name:       dto.name,
      start_date: dto.start_date,
      end_date:   dto.end_date,
    })
    await this.levelService.seedFromDefaults(orgId, schoolYear.id, {})
    return schoolYear
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
    const result = await this.schoolYearRepository.updateStatus(id, 'active')

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