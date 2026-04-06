import { Injectable, NotFoundException } from '@nestjs/common'
import { CourseRepository } from './course.repository'
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from './dto/course.dto'
import { CourseEntity } from './entity/course.entity'

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  private mapToEntity(raw: Record<string, any>): CourseEntity {
    return {
      id:         raw.id as string,
      org_id:     raw.org_id as string,
      program_id: raw.program_id as string,
      name:       raw.name as string,
      code:       (raw.code ?? null) as string | null,
      created_at: raw.created_at as Date | undefined,
    }
  }

  async create(orgId: string, dto: CreateCourseDto): Promise<CourseEntity> {
    const raw = await this.courseRepository.create(orgId, dto)
    return this.mapToEntity(raw as Record<string, any>)
  }

  async findAll(orgId: string, query: CourseQueryDto): Promise<CourseEntity[]> {
    if (!query.schoolYearId) return []
    const rows = await this.courseRepository.findAll(orgId, query.schoolYearId, query.programId)
    return rows.map((r) => this.mapToEntity(r as Record<string, any>))
  }

  async findOne(id: string, orgId: string): Promise<CourseEntity> {
    const raw = await this.courseRepository.findOne(id, orgId)
    if (!raw) throw new NotFoundException('Course not found')
    return this.mapToEntity(raw as Record<string, any>)
  }

  async update(id: string, orgId: string, dto: UpdateCourseDto): Promise<CourseEntity> {
    const exists = await this.courseRepository.existsInOrg(id, orgId)
    if (!exists) throw new NotFoundException('Course not found')
    const raw = await this.courseRepository.update(id, orgId, dto)
    return this.mapToEntity(raw as Record<string, any>)
  }

  async remove(id: string, orgId: string): Promise<{ deleted: boolean }> {
    const exists = await this.courseRepository.existsInOrg(id, orgId)
    if (!exists) throw new NotFoundException('Course not found')
    await this.courseRepository.delete(id, orgId)
    return { deleted: true }
  }
}