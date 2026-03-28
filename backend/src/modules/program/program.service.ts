import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { ProgramRepository } from './program.repository'
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto'

@Injectable()
export class ProgramService {
  constructor(private readonly programRepository: ProgramRepository) {}

  async create(orgId: string, dto: CreateProgramDto) {
    const nameTaken = await this.programRepository.findByNameAndOrg(
      dto.name,
      orgId,
    )
    if (nameTaken) {
      throw new ConflictException(
        `A program named "${dto.name}" already exists in this organization.`,
      )
    }

    return this.programRepository.create({
      orgId,
      name: dto.name,
      type: dto.type,
    })
  }

  async findAll(orgId: string) {
    return this.programRepository.findAll(orgId)
  }

  // Returns full detail including courses → subjects and strands → subjects
  async findById(id: string, orgId: string) {
    const program = await this.programRepository.findById(id, orgId)
    if (!program) throw new NotFoundException('Program not found.')
    return program
  }

  async update(id: string, orgId: string, dto: UpdateProgramDto) {
    const program = await this.programRepository.findById(id, orgId)
    if (!program) throw new NotFoundException('Program not found.')

    if (dto.name && dto.name !== program.name) {
      const nameTaken = await this.programRepository.findByNameAndOrg(
        dto.name,
        orgId,
      )
      if (nameTaken) {
        throw new ConflictException(
          `A program named "${dto.name}" already exists in this organization.`,
        )
      }
    }

    return this.programRepository.update(id, {
      name: dto.name,
      type: dto.type,
    })
  }

  async remove(id: string, orgId: string) {
    const program = await this.programRepository.findById(id, orgId)
    if (!program) throw new NotFoundException('Program not found.')

    // Block deletion if any child records exist — check all three
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
        `Cannot delete this program — it still has ${blockers.join(', ')} assigned to it. ` +
        `Remove or reassign them first.`,
      )
    }

    return this.programRepository.delete(id)
  }
}