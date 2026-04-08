// filepath: src/modules/grading-scheme-template/grading-scheme-template.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GradingSchemeTemplateRepository } from './grading-scheme-template.repository';
import {
  CreateGradingSchemeTemplateDto,
  UpdateGradingSchemeTemplateDto,
  GradingSchemeTemplateComponentDto,
} from './dto/grading-scheme-template.dto';

@Injectable()
export class GradingSchemeTemplateService {
  constructor(private readonly repo: GradingSchemeTemplateRepository) {}

  private validateWeights(components: GradingSchemeTemplateComponentDto[]): void {
    if (components.length === 0) {
      throw new BadRequestException('At least one component is required.');
    }
    const total = components.reduce((sum, c) => sum + c.weight, 0);
    if (Math.round(total) !== 100) {
      throw new BadRequestException(
        `Component weights must total exactly 100%. Current total: ${total}%.`,
      );
    }
  }

  async findAll(orgId: string, programType?: string) {
    return this.repo.findAll(orgId, programType);
  }

  async findById(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId);
    if (!template) throw new NotFoundException('Grading scheme template not found.');
    return template;
  }

  async create(orgId: string, dto: CreateGradingSchemeTemplateDto) {
    this.validateWeights(dto.components);
    return this.repo.create(orgId, dto.name, dto.programType, dto.components);
  }

  async update(id: string, orgId: string, dto: UpdateGradingSchemeTemplateDto) {
    await this.findById(id, orgId); // throws if not found
    if (dto.components) this.validateWeights(dto.components);
    const updated = await this.repo.update(id, orgId, {
      name:        dto.name,
      programType: dto.programType,
      components:  dto.components,
    });
    if (!updated) throw new NotFoundException('Grading scheme template not found.');
    return updated;
  }

  async delete(id: string, orgId: string) {
    await this.findById(id, orgId); // throws if not found
    await this.repo.delete(id, orgId);
  }
}