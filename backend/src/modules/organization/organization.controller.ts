// ===== File: backend/src/modules/organization/organization.controller.ts =====

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { OrganizationService } from './organization.service'
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  SeedOrganizationDto,
} from './dto/organization.dto'
import { AuthGuard } from '@/commons/guards/auth.guard'
import { RolesGuard } from '@/commons/guards/role.guard'
import { Roles } from '@/commons/decorators/roles.decorator'
import { CurrentUser } from '@/commons/decorators/current-user.decorator'

// ✅ NEW: DTOs for validation endpoints
interface ValidateEmailExtensionDto {
  emailExtension: string
}

interface ValidateEmailExtensionResponse {
  isUnique: boolean
  message?: string
}

interface CheckAccountsResponse {
  hasAccounts: boolean
  count: number
}

@Controller('organization')
@UseGuards(AuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @Roles('admin')
  async create(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.orgService.create(adminId, dto)
  }

  @Get()
  @Roles('admin')
  async getOwn(@CurrentUser('org_id') orgId: string | null) {
    const org = await this.orgService.getOwn(orgId)

    if (!org) {
      throw new NotFoundException('Organization not found.')
    }

    return org
  }

  @Patch()
  @Roles('admin')
  async update(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgService.update(orgId, dto, actorId)
  }

  @Post('seed')
  @Roles('admin')
  async seed(
    @CurrentUser('org_id') orgId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: SeedOrganizationDto,
  ) {
    return this.orgService.seed(orgId, dto, actorId)
  }

  // ========================================================================
  // ✅ NEW: Email Extension Validation & Account Check Endpoints
  // ========================================================================

  /**
   * ✅ NEW: Validate email extension uniqueness
   * POST /organization/validate-email-extension
   *
   * Request Body:
   * { emailExtension: "@example.com" }
   *
   * Response:
   * { isUnique: boolean, message?: string }
   *
   * Checks if the extension is:
   * 1. Valid format
   * 2. Unique across the platform
   */
  @Post('validate-email-extension')
  @Roles('admin')
  async validateEmailExtension(
    @Body() dto: ValidateEmailExtensionDto,
    @CurrentUser('org_id') orgId: string,
  ): Promise<ValidateEmailExtensionResponse> {
    const cleaned = dto.emailExtension.trim().replace(/^@/, '')

    // Empty check
    if (!cleaned) {
      return {
        isUnique: false,
        message: 'Email extension cannot be empty.',
      }
    }

    // Format validation
    if (!/^[a-zA-Z0-9.-]+$/.test(cleaned)) {
      return {
        isUnique: false,
        message:
          'Extension contains invalid characters. Use only letters, numbers, dots, and hyphens.',
      }
    }

    // Check uniqueness
    const isUnique = await this.orgService.isEmailExtensionUnique(
      cleaned,
      orgId,
    )

    return {
      isUnique,
      ...(isUnique
        ? {}
        : {
            message:
              'This email extension is already in use by another organization.',
          }),
    }
  }

  /**
   * ✅ NEW: Check if organization has accounts
   * GET /organization/check-accounts
   *
   * Response:
   * { hasAccounts: boolean, count: number }
   *
   * Used to prevent email extension changes when accounts exist.
   */
  @Get('check-accounts')
  @Roles('admin')
  async checkHasAccounts(
    @CurrentUser('org_id') orgId: string,
  ): Promise<CheckAccountsResponse> {
    if (!orgId) {
      throw new BadRequestException(
        'No organization found for this account.',
      )
    }

    const count = await this.orgService.countAccounts(orgId)

    return {
      hasAccounts: count > 0,
      count,
    }
  }
}