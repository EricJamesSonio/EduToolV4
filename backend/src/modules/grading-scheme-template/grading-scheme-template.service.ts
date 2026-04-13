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
  ApplyTemplateToClassDto,
  ApplyTemplateToProgramDto,
} from './dto/grading-scheme-template.dto';
import { GradingSchemeRepository } from '../grading-scheme/grading-scheme.repository';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradingSchemeTemplateService {
  constructor(
    private readonly repo: GradingSchemeTemplateRepository,
    private readonly gradingSchemeRepo: GradingSchemeRepository,
    private readonly db: DatabaseService,
  ) {}

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

 async applyToClass(orgId: string, dto: ApplyTemplateToClassDto) {
  // Get template
  const template = await this.findById(dto.templateId, orgId);

  // Create/update grading scheme for the class
  return this.gradingSchemeRepo.upsertForClass(
    orgId,
    dto.classId,
    dto.templateId,
    dto.name ?? template.name,
    template.components.map((c) => ({
      name: c.name,
      type: c.type,
      weight: c.weight,
      maxScore: c.maxScore,
      isOptional: false,
    })),
  );
}

async applyToProgram(orgId: string, dto: ApplyTemplateToProgramDto) {
  // Get template
  const template = await this.findById(dto.templateId, orgId);

  // Get all class IDs under the program
  const classIds = await this.gradingSchemeRepo.findClassIdsByProgram(
    dto.programId,
    orgId,
  );

if (classIds.length === 0) {
  return { success: true, appliedCount: 0 };
}

  // Create/update grading scheme for each class
  const results = await Promise.all(
    classIds.map((classId) =>
      this.gradingSchemeRepo.upsertForClass(
        orgId,
        classId,
        dto.templateId,
        template.name,
        template.components.map((c) => ({
          name: c.name,
          type: c.type,
          weight: c.weight,
          maxScore: c.maxScore,
          isOptional: false,
        })),
      )
    )
  );

  return { success: true, appliedCount: results.length };
}
}