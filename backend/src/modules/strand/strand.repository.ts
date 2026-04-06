import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { CreateStrandDto, UpdateStrandDto } from './dto/strand.dto'

@Injectable()
export class StrandRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(orgId: string, dto: CreateStrandDto) {
    return this.db.strand.create({
      data: {
        org_id:         orgId,
        school_year_id: dto.schoolYearId,
        program_id:     dto.program_id,
        name:           dto.name,
      },
    })
  }

  async findAll(orgId: string, schoolYearId: string, programId?: string) {
    return this.db.strand.findMany({
      where: {
        org_id:         orgId,
        school_year_id: schoolYearId,
        ...(programId ? { program_id: programId } : {}),
      },
      include: {
        subjects: {
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string, orgId: string) {
    return this.db.strand.findFirst({
      where: { id, org_id: orgId },
      include: {
        subjects: {
          include: {
            prerequisites: { include: { prerequisite: true } },
          },
        },
      },
    })
  }

  async update(id: string, orgId: string, dto: UpdateStrandDto) {
    return this.db.strand.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
      },
    })
  }

  async delete(id: string, orgId: string) {
    return this.db.strand.delete({ where: { id } })
  }

  async existsInOrg(id: string, orgId: string): Promise<boolean> {
    const record = await this.db.strand.findFirst({
      where: { id, org_id: orgId },
      select: { id: true },
    })
    return !!record
  }
}