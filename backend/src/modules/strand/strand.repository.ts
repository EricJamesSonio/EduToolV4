import { Injectable } from '@nestjs/common'
import { DatabaseProvider } from '@core/database/database.provider'
import { CreateStrandDto, UpdateStrandDto } from './dto/strand.dto'

@Injectable()
export class StrandRepository {
  constructor(private readonly db: DatabaseProvider) {}

  async create(dto: CreateStrandDto) {
    return this.db.strand.create({
      data: {
        org_id: dto.org_id,
        program_id: dto.program_id,
        name: dto.name,
      },
    })
  }

  async findAll(org_id: string, program_id?: string) {
    return this.db.strand.findMany({
      where: {
        org_id,
        ...(program_id ? { program_id } : {}),
      },
      include: {
        subjects: {
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, org_id: string) {
    return this.db.strand.findFirst({
      where: { id, org_id },
      include: {
        subjects: {
          include: {
            prerequisites: {
              include: { prerequisite: true },
            },
          },
        },
      },
    })
  }

  async update(id: string, org_id: string, dto: UpdateStrandDto) {
    return this.db.strand.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
      },
    })
  }

  async delete(id: string, org_id: string) {
    return this.db.strand.delete({
      where: { id },
    })
  }

  async existsInOrg(id: string, org_id: string): Promise<boolean> {
    const record = await this.db.strand.findFirst({
      where: { id, org_id },
      select: { id: true },
    })
    return !!record
  }
}