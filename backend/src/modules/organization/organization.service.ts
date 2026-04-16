// backend/src/modules/organization/organization.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { OrganizationRepository } from './organization.repository'
import { OrgSeederService }       from '../org-seeder/org-seeder.service'
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  SeedOrganizationDto,
} from './dto/organization.dto'

@Injectable()
export class OrganizationService {
  constructor(
    private readonly orgRepository: OrganizationRepository,
    private readonly orgSeeder:     OrgSeederService,
  ) {}

  async create(adminId: string, dto: CreateOrganizationDto) {
    const alreadyExists = await this.orgRepository.existsForAdmin(adminId)
    if (alreadyExists) {
      throw new ConflictException('An organization already exists for this account.')
    }

    try {
      const org = await this.orgRepository.create({
        name:            dto.name,
        description:     dto.description,
        email_extension: dto.emailExtension,
      })
      await this.orgRepository.linkToAdmin(adminId, org.id)
      return org
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes('email_extension')) {
        throw new ConflictException('This email extension is already in use by another organization.')
      }
      throw e
    }
  }

  async getOwn(orgId: string | null) {
    if (!orgId) return null
    const org = await this.orgRepository.findById(orgId)
    if (!org) return null
    return {
      id:             org.id,
      name:           org.name,
      description:    org.description,
      emailExtension: org.email_extension ?? null,
    }
  }

async update(orgId: string, dto: UpdateOrganizationDto) {
  const org = await this.orgRepository.findById(orgId)
  if (!org) throw new NotFoundException('Organization not found.')

  try {
    return await this.orgRepository.update(orgId, {
      name:        dto.name,
      description: dto.description,
      ...(dto.emailExtension !== undefined && {
        email_extension: dto.emailExtension ?? undefined,
      }),
    })
  } catch (e: any) {
    if (e?.code === 'P2002' && e?.meta?.target?.includes('email_extension')) {
      throw new ConflictException('This email extension is already in use by another organization.')
    }
    throw e
  }
}
  async seed(orgId: string, dto: SeedOrganizationDto) {
    if (!orgId) throw new BadRequestException('No organization found for this account.')
    const org = await this.orgRepository.findById(orgId)
    if (!org) throw new NotFoundException('Organization not found.')

await this.orgSeeder.seedOrg({
  orgId,
  schoolYearId:          dto.schoolYearId,
  programs:              dto.programs,
  courses:               dto.courses,
  strands:               dto.strands,
  excludedLevels:        dto.excludedLevels,
  excludedSubjects:      dto.excludedSubjects,
  excludedLevelSubjects: dto.excludedLevelSubjects,  // ← ADD THIS
  levelConfigs:          dto.levelConfigs,
  sectionConfigs:        dto.sectionConfigs,
  gradingScales:         dto.gradingScales,
})

    return { success: true, message: 'Seed completed successfully.' }
  }
}