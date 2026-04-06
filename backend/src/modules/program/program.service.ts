import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { ProgramRepository } from './program.repository'
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto'

@Injectable()
export class ProgramService {
  constructor(private readonly programRepository: ProgramRepository) {}

  async create(orgId: string, dto: CreateProgramDto) {
    const nameTaken = await this.programRepository.findByNameAndYear(
      dto.name, orgId, dto.schoolYearId,
    )
    if (nameTaken) {
      throw new ConflictException(
        `A program named "${dto.name}" already exists for this school year.`,
      )
    }
    return this.programRepository.create({
      orgId,
      schoolYearId: dto.schoolYearId,
      name:         dto.name,
      type:         dto.type,
    })
  }

  async findAll(orgId: string, schoolYearId: string) {
    return this.programRepository.findAll(orgId, schoolYearId)
  }

  async findById(id: string, orgId: string) {
    const program = await this.programRepository.findById(id, orgId)
    if (!program) throw new NotFoundException('Program not found.')
    return program
  }

  async update(id: string, orgId: string, dto: UpdateProgramDto) {
    const program = await this.programRepository.findById(id, orgId)
    if (!program) throw new NotFoundException('Program not found.')
    return this.programRepository.update(id, { name: dto.name, type: dto.type })
  }

  async remove(id: string, orgId: string) {
    const program = await this.programRepository.findById(id, orgId)
    if (!program) throw new NotFoundException('Program not found.')

    const [hasLevels, hasCourses, hasStrands] = await Promise.all([
      this.programRepository.hasLevels(id),
      this.programRepository.hasCourses(id),
      this.programRepository.hasStrands(id),
    ])

    const blockers: string[] = []
    if (hasLevels)  blockers.push('levels')
    if (hasCourses) blockers.push('courses')
    if (hasStrands) blockers.push('strands')

    if (blockers.length > 0) {
      throw new ConflictException(
        `Cannot delete this program — it still has ${blockers.join(', ')} assigned to it.`,
      )
    }
    return this.programRepository.delete(id)
  }
}