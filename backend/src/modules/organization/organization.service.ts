// @/modules/organization/organization.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly orgRepository: OrganizationRepository) {}

  /**
   * POST /organization
   *
   * An Admin can only have one org. We check before creating.
   * After creation we link the org back to the admin's account row
   * so that subsequent JWT payloads carry the correct orgId.
   */
  async create(adminId: string, dto: CreateOrganizationDto) {
    const alreadyExists = await this.orgRepository.existsForAdmin(adminId);

    if (alreadyExists) {
      throw new ConflictException(
        'An organization already exists for this account.',
      );
    }

    const org = await this.orgRepository.create({
      name: dto.name,
      description: dto.description,
    });

    // Link the newly created org to the admin's account
    await this.orgRepository.linkToAdmin(adminId, org.id);

    return org;
  }

  /**
   * GET /organization
   *
   * Returns the org scoped to the current admin via orgId from JWT.
   */
  async getOwn(orgId: string) {
    const org = await this.orgRepository.findById(orgId);

    if (!org) {
      throw new NotFoundException('Organization not found.');
    }

    return org;
  }

  /**
   * PATCH /organization
   *
   * Admin updates name or description of their own org.
   */
  async update(orgId: string, dto: UpdateOrganizationDto) {
    const org = await this.orgRepository.findById(orgId);

    if (!org) {
      throw new NotFoundException('Organization not found.');
    }

    return this.orgRepository.update(orgId, {
      name: dto.name,
      description: dto.description,
    });
  }
}