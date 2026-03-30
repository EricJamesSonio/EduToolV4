import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { CourseRepository } from './course.repository'
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from './dto/course.dto'

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async create(orgId: string, dto: CreateCourseDto) {
    return this.courseRepository.create(orgId, dto)
  }

  async findAll(org_id: string, query: CourseQueryDto) {
    return this.courseRepository.findAll(org_id, query.programId)
  }

  async findOne(id: string, org_id: string) {
    const course = await this.courseRepository.findOne(id, org_id)
    if (!course) throw new NotFoundException(`Course not found`)
    return course
  }

  async update(id: string, org_id: string, dto: UpdateCourseDto) {
    const exists = await this.courseRepository.existsInOrg(id, org_id)
    if (!exists) throw new NotFoundException(`Course not found`)
    return this.courseRepository.update(id, org_id, dto)
  }

  async remove(id: string, org_id: string) {
    const exists = await this.courseRepository.existsInOrg(id, org_id)
    if (!exists) throw new NotFoundException(`Course not found`)
    return this.courseRepository.delete(id, org_id)
  }
}