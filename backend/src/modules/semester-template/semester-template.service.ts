import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { SemesterTemplateRepository } from './semester-template.repository'
import { ProgramRepository } from '@/modules/program/program.repository'
import {
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
  AssignTemplateDto,
} from './dto/semester-template.dto'

@Injectable()
export class SemesterTemplateService {
  constructor(
    private readonly repo: SemesterTemplateRepository,
    private readonly programRepo: ProgramRepository,
  ) {}

  async create(orgId: string, dto: CreateSemesterTemplateDto) {
    const duplicate = await this.repo.existsByName(orgId, dto.programType, dto.name)
    if (duplicate) {
      throw new ConflictException(
        `A template named "${dto.name}" already exists for this program type.`,
      )
    }

    return this.repo.create({
      orgId,
      programType: dto.programType,
      name: dto.name,
      semesters: dto.semesters.map((s) => ({
        name: s.name,
        orderIndex: s.orderIndex,
        terms: s.terms.map((t) => ({
          name: t.name,
          orderIndex: t.orderIndex,
        })),
      })),
    })
  }

  async findAllForOrg(orgId: string) {
    return this.repo.getAllForOrg(orgId)
  }

  async findAllBySchoolYear(orgId: string, schoolYearId: string) {
    return this.repo.findAllBySchoolYear(orgId, schoolYearId)
  }

  async findById(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId)
    if (!template) throw new NotFoundException('Semester template not found.')
    return template
  }

  async update(id: string, orgId: string, dto: UpdateSemesterTemplateDto) {
    const template = await this.repo.findById(id, orgId)
    if (!template) throw new NotFoundException('Semester template not found.')

    if (dto.name && dto.name !== template.name) {
      const duplicate = await this.repo.existsByName(
        orgId,
        template.program_type,
        dto.name,
        id,
      )
      if (duplicate) {
        throw new ConflictException(
          `A template named "${dto.name}" already exists for this program type.`,
        )
      }
      await this.repo.update(id, { name: dto.name })
    }

    if (dto.semesters) {
      await this.repo.replaceSemesters(
        id,
        orgId,
        dto.semesters.map((s) => ({
          name: s.name,
          orderIndex: s.orderIndex,
          terms: s.terms.map((t) => ({
            name: t.name,
            orderIndex: t.orderIndex,
          })),
        })),
      )
    }

    return this.repo.findById(id, orgId)
  }

  async remove(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId)
    if (!template) throw new NotFoundException('Semester template not found.')
    await this.repo.delete(id)
  }

  async assignToProgram(orgId: string, dto: AssignTemplateDto) {
    const template = await this.repo.findById(dto.templateId, orgId)
    if (!template) throw new NotFoundException('Semester template not found.')

    // ✅ Validate program exists and type matches
    const program = await this.programRepo.findById(dto.programId, orgId)
    if (!program) throw new NotFoundException('Program not found.')

    if (template.program_type !== program.type) {
      throw new BadRequestException(
        `Template type "${template.program_type}" does not match program type "${program.type}".`,
      )
    }

    return this.repo.assignToProgram({
      orgId,
      programId: dto.programId,
      templateId: dto.templateId,
    })
  }

  async removeAssignment(programId: string, orgId: string) {
    await this.repo.removeAssignment(programId, orgId)
  }

  async findAssignmentsBySchoolYear(orgId: string, schoolYearId: string) {
    return this.repo.findAssignmentsBySchoolYear(orgId, schoolYearId)
  }

  async findAssignmentByProgram(programId: string, orgId: string) {
    return this.repo.findAssignmentByProgram(programId, orgId)
  }
}