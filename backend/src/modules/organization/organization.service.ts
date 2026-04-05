import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import { OrgSeederService } from '../org-seeder/org-seeder.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly orgRepository: OrganizationRepository,
    private readonly orgSeeder: OrgSeederService,
  ) {}

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

    await this.orgRepository.linkToAdmin(adminId, org.id);

    // seed selected programs if any were provided
    if (dto.programs && dto.programs.length > 0) {
      await this.orgSeeder.seedOrg({
        orgId: org.id,
        programs: dto.programs,
      });
    }

    return org;
  }

  async getOwn(orgId: string | null) {
    if (!orgId) return null;
    const org = await this.orgRepository.findById(orgId);
    if (!org) return null;
    return org;
  }

  async update(orgId: string, dto: UpdateOrganizationDto) {
    const org = await this.orgRepository.findById(orgId);
    if (!org) throw new NotFoundException('Organization not found.');
    return this.orgRepository.update(orgId, {
      name: dto.name,
      description: dto.description,
    });
  }
}