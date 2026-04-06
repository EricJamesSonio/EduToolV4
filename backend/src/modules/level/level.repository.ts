import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { buildLevelDefs } from '@/modules/org-seeder/data/levels.data'

@Injectable()
export class LevelRepository {
  constructor(private readonly db: DatabaseService) {}

  async findBySchoolYear(orgId: string, schoolYearId: string) {
    return this.db.level.findMany({
      where: { org_id: orgId, school_year_id: schoolYearId },
      orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
    })
  }

  // Rebuild levels for a new school year from static program definitions
  // Uses program records already seeded for that school year
  async seedFromDefaults(
    orgId: string,
    schoolYearId: string,
    programMap: Record<string, string>, // programKey → programId
  ) {
    const levelDefs = buildLevelDefs().filter(
      (l) => !!programMap[l.programKey],
    )
    if (levelDefs.length === 0) return []

    const created: any[] = []
    for (const lvl of levelDefs) {
      const level = await this.db.level.create({
        data: {
          org_id:         orgId,
          school_year_id: schoolYearId,
          program_id:     programMap[lvl.programKey],
          name:           lvl.name,
        },
      })
      created.push(level)
    }
    return created
  }

  async findById(id: string, orgId: string) {
    return this.db.level.findFirst({ where: { id, org_id: orgId } })
  }

  async update(id: string, data: { name?: string }) {
    return this.db.level.update({ where: { id }, data })
  }

  async create(orgId: string, data: {
    programId: string
    schoolYearId: string
    name: string
  }) {
    return this.db.level.create({
      data: {
        org_id:         orgId,
        school_year_id: data.schoolYearId,
        program_id:     data.programId,
        name:           data.name,
      },
    })
  }

  async delete(id: string) {
    return this.db.level.delete({ where: { id } })
  }

  async findAll(orgId: string, schoolYearId?: string) {
    return this.db.level.findMany({
      where: {
        org_id: orgId,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      orderBy: [{ program_id: 'asc' }, { name: 'asc' }],
    })
  }

  async deleteByProgramAndSchoolYear(
    orgId: string,
    programId: string,
    schoolYearId: string,
  ): Promise<void> {
    await this.db.level.deleteMany({
      where: { org_id: orgId, program_id: programId, school_year_id: schoolYearId },
    })
  }

  async bulkCreate(levels: Array<{
    orgId: string
    programId: string
    schoolYearId: string
    name: string
  }>) {
    await this.db.level.createMany({
      data: levels.map((l) => ({
        org_id:         l.orgId,
        school_year_id: l.schoolYearId,
        program_id:     l.programId,
        name:           l.name,
      })),
    })
    return this.db.level.findMany({
      where: {
        org_id:         levels[0].orgId,
        program_id:     levels[0].programId,
        school_year_id: levels[0].schoolYearId,
      },
      orderBy: { name: 'asc' },
    })
  }
}