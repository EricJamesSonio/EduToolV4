import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { GradingSchemeRepository } from './grading-scheme.repository';
import {
  CreateGradingSchemeDto, UpdateGradingSchemeDto,
  UpdateDefaultGradingSchemeDto, GradingSchemeComponentDto,
} from './dto/grading-scheme.dto';

@Injectable()
export class GradingSchemeService {
  constructor(private readonly repo: GradingSchemeRepository) {}

  private validateWeights(components: GradingSchemeComponentDto[]): void {
    if (components.length === 0) {
      throw new BadRequestException('At least one grading scheme component is required.');
    }
    const required = components.filter((c) => !c.isOptional);
    const total    = required.reduce((sum, c) => sum + c.weight, 0);
    if (Math.round(total) !== 100) {
      throw new BadRequestException(
        `Required component weights must total exactly 100%. Current total: ${total}%.`,
      );
    }
  }

  async getDefault(orgId: string, schoolYearId: string) {
    const scheme = await this.repo.findDefault(orgId, schoolYearId);
    if (!scheme) {
      return this.repo.createDefault(orgId, schoolYearId, 'Default Grading Scheme');
    }
    return scheme;
  }

  async updateDefault(orgId: string, schoolYearId: string, dto: UpdateDefaultGradingSchemeDto) {
    await this.getDefault(orgId, schoolYearId);
    if (dto.components) this.validateWeights(dto.components);
    const updated = await this.repo.updateDefault(orgId, schoolYearId, {
      name:       dto.name,
      components: dto.components,
    });
    if (!updated) throw new NotFoundException('Default grading scheme not found.');
    return updated;
  }

  async create(orgId: string, schoolYearId: string, educatorId: string, dto: CreateGradingSchemeDto) {
    this.validateWeights(dto.components);
    return this.repo.create(orgId, schoolYearId, educatorId, dto.name, dto.components);
  }

  async findByEducator(orgId: string, schoolYearId: string, educatorId: string) {
    return this.repo.findByEducator(orgId, schoolYearId, educatorId);
  }

  async update(id: string, orgId: string, educatorId: string, dto: UpdateGradingSchemeDto) {
    const scheme = await this.repo.findById(id, orgId);
    if (!scheme)                       throw new NotFoundException('Grading scheme not found.');
    if (scheme.educatorId !== educatorId) throw new ForbiddenException('You can only edit grading schemes from your own library.');
    if (scheme.isLocked)               throw new BadRequestException('This grading scheme is locked and cannot be modified.');
    if (dto.components) this.validateWeights(dto.components);
    return this.repo.update(id, orgId, { name: dto.name, components: dto.components });
  }

  async assignToClass(schemeId: string, classId: string, orgId: string) {
    const scheme = await this.repo.findById(schemeId, orgId);
    if (!scheme)         throw new NotFoundException('Grading scheme not found.');
    if (scheme.isLocked) throw new BadRequestException('Cannot assign a locked grading scheme to a class.');
    return this.repo.assignToClass(schemeId, classId);
  }

  async lockForClass(classId: string) {
    return this.repo.lockByClassId(classId);
  }

  async findForClass(classId: string, orgId: string) {
    return this.repo.findForClass(classId, orgId);
  }

  async findById(id: string, orgId: string) {
    const scheme = await this.repo.findById(id, orgId);
    if (!scheme) throw new NotFoundException('Grading scheme not found.');
    return scheme;
  }

  async saveForClass(
    classId:      string,
    orgId:        string,
    schoolYearId: string,
    educatorId:   string,
    dto:          UpdateGradingSchemeDto,
  ) {
    const existing = await this.repo.findForClass(classId, orgId);

    if (existing && existing.classId === classId) {
      if (existing.isLocked) {
        throw new BadRequestException(
          'This grading scheme is locked because students are enrolled in this class.',
        );
      }
      if (dto.components) this.validateWeights(dto.components);
      return this.repo.update(existing.id, orgId, {
        name:       dto.name,
        components: dto.components,
      });
    }

    let components: GradingSchemeComponentDto[];
    if (dto.components && dto.components.length > 0) {
      components = dto.components;
    } else {
      const defaultScheme = await this.getDefault(orgId, schoolYearId);
      components = defaultScheme.components.map((c) => ({
        name:       c.name,
        type:       c.type,
        weight:     c.weight,
        maxScore:   c.maxScore ?? undefined,
        isOptional: c.isOptional,
      }));
    }

    this.validateWeights(components);
    const name    = dto.name ?? 'Class Grading Scheme';
    const created = await this.repo.create(orgId, schoolYearId, educatorId, name, components);
    return this.repo.assignToClass(created.id, classId);
  }
}