// ===== File: backend/src/modules/organization/organization.service.ts =====
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { OrganizationRepository } from './organization.repository'
import { OrgSeederService } from '../org-seeder/org-seeder.service'
import { DatabaseService } from '@/core/database/database.provider'
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  SeedOrganizationDto,
} from './dto/organization.dto'

@Injectable()
export class OrganizationService {
  constructor(
    private readonly orgRepository: OrganizationRepository,
    private readonly orgSeeder: OrgSeederService,
    private readonly db: DatabaseService,
  ) {}

  async create(adminId: string, dto: CreateOrganizationDto) {
    const alreadyExists = await this.orgRepository.existsForAdmin(adminId)
    if (alreadyExists) {
      throw new ConflictException('An organization already exists for this account.')
    }

    try {
      const org = await this.orgRepository.create({
        name: dto.name,
        description: dto.description,
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
      id: org.id,
      name: org.name,
      description: org.description,
      emailExtension: org.email_extension ?? null,
    }
  }

  async update(orgId: string, dto: UpdateOrganizationDto) {
    const org = await this.orgRepository.findById(orgId)
    if (!org) throw new NotFoundException('Organization not found.')

    try {
      return await this.orgRepository.update(orgId, {
        name: dto.name,
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
      schoolYearId: dto.schoolYearId,
      programs: dto.programs,
      courses: dto.courses,
      strands: dto.strands,
      excludedLevels: dto.excludedLevels,
      excludedSubjects: dto.excludedSubjects,
      excludedLevelSubjects: dto.excludedLevelSubjects,
      levelConfigs: dto.levelConfigs,
      sectionConfigs: dto.sectionConfigs,
      gradingScales: dto.gradingScales,
    })

    return { success: true, message: 'Seed completed successfully.' }
  }

  // ========================================================================
  // ✅ NEW: Email Extension Validation & Account Check Methods
  // ========================================================================

  /**
   * ✅ NEW: Check if email extension is unique across all organizations
   * 
   * @param extension - The extension to check (e.g., "@example.com")
   * @param excludeOrgId - Optional: exclude this org from the check (for editing)
   * @returns true if unique, false if already in use
   */
  async isEmailExtensionUnique(
    extension: string,
    excludeOrgId?: string,
  ): Promise<boolean> {
    const cleaned = extension.trim().replace(/^@/, '')
    const fullExtension = `@${cleaned}`

    const existing = await this.db.organization.findFirst({
      where: {
        email_extension: fullExtension,
        ...(excludeOrgId && { NOT: { id: excludeOrgId } }),
      },
    })

    return !existing
  }

  /**
   * ✅ NEW: Count accounts in organization (excluding platform_owner)
   * 
   * Useful for preventing email extension changes when accounts exist
   * 
   * @param orgId - The organization ID
   * @returns Number of accounts (educators, students, admins)
   */
  async countAccounts(orgId: string): Promise<number> {
    const count = await this.db.account.count({
      where: {
        org_id: orgId,
        role: { not: 'platform_owner' },
      },
    })
    return count
  }

  /**
   * ✅ NEW: Count accounts by role for detailed reporting
   * 
   * @param orgId - The organization ID
   * @returns Breakdown of accounts by role
   */
  async countAccountsByRole(orgId: string): Promise<{
    educators: number
    students: number
    admins: number
    total: number
  }> {
    const [educators, students, admins] = await Promise.all([
      this.db.account.count({ where: { org_id: orgId, role: 'educator' } }),
      this.db.account.count({ where: { org_id: orgId, role: 'student' } }),
      this.db.account.count({ where: { org_id: orgId, role: 'admin' } }),
    ])

    return {
      educators,
      students,
      admins,
      total: educators + students + admins,
    }
  }
}