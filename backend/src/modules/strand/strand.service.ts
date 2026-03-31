// backend/src/modules/strand/strand.service.ts

import { Injectable, NotFoundException } from '@nestjs/common'
import { StrandRepository } from './strand.repository'
import { CreateStrandDto, UpdateStrandDto, StrandQueryDto } from './dto/strand.dto'
import { StrandEntity, StrandSubjectEntity, StrandSubjectPrerequisiteEntity } from './entity/strand.entity'

@Injectable()
export class StrandService {
  constructor(private readonly strandRepository: StrandRepository) {}

  private mapToEntity(raw: Record<string, any>): StrandEntity {
    return {
      id: raw.id as string,
      orgId: raw.org_id as string,
      programId: raw.program_id as string,
      name: raw.name as string,
      createdAt: raw.created_at as Date | undefined,
      subjects: Array.isArray(raw.subjects)
        ? raw.subjects.map((s: Record<string, any>): StrandSubjectEntity => ({
            id: s.id as string,
            name: s.name as string,
            yearLevel: s.year_level as number,
            termLabel: s.term_label as string,
            prerequisites: Array.isArray(s.prerequisites)
              ? s.prerequisites.map(
                  (p: Record<string, any>): StrandSubjectPrerequisiteEntity => ({
                    prerequisite: {
                      id: p.prerequisite?.id as string,
                      name: p.prerequisite?.name as string,
                    },
                  }),
                )
              : undefined,
          }))
        : undefined,
    }
  }

  async create(orgId: string, dto: CreateStrandDto): Promise<StrandEntity> {
    const raw = await this.strandRepository.create(orgId, dto)
    return this.mapToEntity(raw as Record<string, any>)
  }

  async findAll(org_id: string, query: StrandQueryDto): Promise<StrandEntity[]> {
    const rows = await this.strandRepository.findAll(org_id, query.program_id)
    return rows.map((r) => this.mapToEntity(r as Record<string, any>))
  }

  async findOne(id: string, org_id: string): Promise<StrandEntity> {
    const raw = await this.strandRepository.findOne(id, org_id)
    if (!raw) throw new NotFoundException('Strand not found')
    return this.mapToEntity(raw as Record<string, any>)
  }

  async update(id: string, org_id: string, dto: UpdateStrandDto): Promise<StrandEntity> {
    const exists = await this.strandRepository.existsInOrg(id, org_id)
    if (!exists) throw new NotFoundException('Strand not found')
    const raw = await this.strandRepository.update(id, org_id, dto)
    return this.mapToEntity(raw as Record<string, any>)
  }

  async remove(id: string, org_id: string): Promise<{ deleted: boolean }> {
    const exists = await this.strandRepository.existsInOrg(id, org_id)
    if (!exists) throw new NotFoundException('Strand not found')
    await this.strandRepository.delete(id, org_id)
    return { deleted: true }
  }
}