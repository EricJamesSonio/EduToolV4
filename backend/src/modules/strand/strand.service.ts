import { Injectable, NotFoundException } from '@nestjs/common'
import { StrandRepository } from './strand.repository'
import { CreateStrandDto, UpdateStrandDto, StrandQueryDto } from './dto/strand.dto'

@Injectable()
export class StrandService {
  constructor(private readonly strandRepository: StrandRepository) {}

  async create(dto: CreateStrandDto) {
    return this.strandRepository.create(dto)
  }

  async findAll(org_id: string, query: StrandQueryDto) {
    return this.strandRepository.findAll(org_id, query.program_id)
  }

  async findOne(id: string, org_id: string) {
    const strand = await this.strandRepository.findOne(id, org_id)
    if (!strand) throw new NotFoundException(`Strand not found`)
    return strand
  }

  async update(id: string, org_id: string, dto: UpdateStrandDto) {
    const exists = await this.strandRepository.existsInOrg(id, org_id)
    if (!exists) throw new NotFoundException(`Strand not found`)
    return this.strandRepository.update(id, org_id, dto)
  }

  async remove(id: string, org_id: string) {
    const exists = await this.strandRepository.existsInOrg(id, org_id)
    if (!exists) throw new NotFoundException(`Strand not found`)
    return this.strandRepository.delete(id, org_id)
  }
}