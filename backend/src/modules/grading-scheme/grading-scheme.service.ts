import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GradingSchemeRepository } from './grading-scheme.repository';
import {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
  UpdateDefaultGradingSchemeDto,
  GradingSchemeComponentDto,
} from './dto/grading-scheme.dto';

@Injectable()
export class GradingSchemeService {
  constructor(private readonly repo: GradingSchemeRepository) {}

  // ── Validation ────────────────────────────────────────────────────────────

  /**
   * Required components (isOptional = false) must sum to exactly 100%.
   * Optional components are allowed on top of that.
   */
  private validateWeights(components: GradingSchemeComponentDto[]): void {
    if (components.length === 0) {
      throw new BadRequestException(
        'At least one grading scheme component is required.',
      );
    }

    // ✅ FIX: camelCase
    const required = components.filter((c) => !c.isOptional);

    const total = required.reduce((sum, c) => sum + c.weight, 0);

    if (Math.round(total) !== 100) {
      throw new BadRequestException(
        `Required component weights must total exactly 100%. Current total: ${total}%.`,
      );
    }
  }

  // ── Default scheme (admin-managed) ───────────────────────────────────────

  async getDefault(orgId: string) {
    const scheme = await this.repo.findDefault(orgId);

    if (!scheme) {
      return this.repo.createDefault(orgId, 'Default Grading Scheme');
    }

    return scheme;
  }

  async updateDefault(orgId: string, dto: UpdateDefaultGradingSchemeDto) {
    await this.getDefault(orgId); // ensure exists

    if (dto.components) {
      this.validateWeights(dto.components);
    }

    const updated = await this.repo.updateDefault(orgId, {
      name: dto.name,
      components: dto.components,
    });

    if (!updated) {
      throw new NotFoundException('Default grading scheme not found.');
    }

    return updated;
  }

  // ── Educator personal library ─────────────────────────────────────────────

  async create(orgId: string, educatorId: string, dto: CreateGradingSchemeDto) {
    this.validateWeights(dto.components);

    return this.repo.create(orgId, educatorId, dto.name, dto.components);
  }

  async findByEducator(orgId: string, educatorId: string) {
    return this.repo.findByEducator(orgId, educatorId);
  }

  async update(
    id: string,
    orgId: string,
    educatorId: string,
    dto: UpdateGradingSchemeDto,
  ) {
    const scheme = await this.repo.findById(id, orgId);

    if (!scheme) {
      throw new NotFoundException('Grading scheme not found.');
    }

    // ✅ FIXED earlier (good)
    if (scheme.educatorId !== educatorId) {
      throw new ForbiddenException(
        'You can only edit grading schemes from your own library.',
      );
    }

    // ⚠️ OPTIONAL: align naming if repo returns camelCase
    if (scheme.isLocked) {
      throw new BadRequestException(
        'This grading scheme is locked because students are enrolled in the class. ' +
          'It cannot be modified.',
      );
    }

    if (dto.components) {
      this.validateWeights(dto.components);
    }

    return this.repo.update(id, orgId, {
      name: dto.name,
      components: dto.components,
    });
  }

  // ── Class assignment & locking ───────────────────────────────────────────

  async assignToClass(schemeId: string, classId: string, orgId: string) {
    const scheme = await this.repo.findById(schemeId, orgId);

    if (!scheme) {
      throw new NotFoundException('Grading scheme not found.');
    }

    // ⚠️ same naming consistency note
    if (scheme.isLocked) {
      throw new BadRequestException(
        'Cannot assign a locked grading scheme to a class.',
      );
    }

    return this.repo.assignToClass(schemeId, classId);
  }

  async lockForClass(classId: string) {
    return this.repo.lockByClassId(classId);
  }

  // ── Lookup helpers ───────────────────────────────────────────────────────

  async findForClass(classId: string, orgId: string) {
    return this.repo.findForClass(classId, orgId);
  }

  async findById(id: string, orgId: string) {
    const scheme = await this.repo.findById(id, orgId);

    if (!scheme) {
      throw new NotFoundException('Grading scheme not found.');
    }

    return scheme;
  }
}