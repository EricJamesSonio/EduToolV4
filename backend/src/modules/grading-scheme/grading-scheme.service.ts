// filepath: src/modules/grading-scheme/grading-scheme.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GradingSchemeRepository } from './grading-scheme.repository';
import { GradingSchemeTemplateService } from '@/modules/grading-scheme-template/grading-scheme-template.service';
import {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
  ApplyTemplateToClassDto,
  ApplyTemplateToProgramDto,
  GradingSchemeComponentDto,
} from './dto/grading-scheme.dto';

@Injectable()
export class GradingSchemeService {
  constructor(
    private readonly repo:             GradingSchemeRepository,
    private readonly templateService:  GradingSchemeTemplateService,
  ) {}

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

  async findByClass(classId: string, orgId: string) {
    return this.repo.findByClassId(classId, orgId);
  }

  async create(orgId: string, dto: CreateGradingSchemeDto) {
    const existing = await this.repo.findByClassId(dto.classId, orgId);
    if (existing) {
      throw new BadRequestException('This class already has a grading scheme. Use update instead.');
    }
    this.validateWeights(dto.components);
    return this.repo.create(orgId, dto.classId, dto.templateId, dto.name, dto.components);
  }

  async update(id: string, orgId: string, dto: UpdateGradingSchemeDto) {
    const scheme = await this.repo.findById(id, orgId);
    if (!scheme)       throw new NotFoundException('Grading scheme not found.');
    if (scheme.isLocked) throw new BadRequestException('This grading scheme is locked and cannot be modified.');
    if (dto.components) this.validateWeights(dto.components);
    const updated = await this.repo.update(id, orgId, { name: dto.name, components: dto.components });
    if (!updated) throw new NotFoundException('Grading scheme not found.');
    return updated;
  }

  async applyTemplateToClass(orgId: string, dto: ApplyTemplateToClassDto) {
    // load template to get components
    const template = await this.templateService.findById(dto.templateId, orgId);

    const components: GradingSchemeComponentDto[] = template.components.map((c) => ({
      name:    c.name,
      type:    c.type as any,
      weight:  c.weight,
      maxScore: c.maxScore ?? undefined,
    }));

    this.validateWeights(components);

    return this.repo.upsertForClass(
      orgId,
      dto.classId,
      dto.templateId,
      dto.name ?? template.name,
      components,
    );
  }

  async applyTemplateToProgram(orgId: string, dto: ApplyTemplateToProgramDto) {
    const template  = await this.templateService.findById(dto.templateId, orgId);
    const classIds  = await this.repo.findClassIdsByProgram(dto.programId, orgId);

    if (classIds.length === 0) {
      throw new BadRequestException('No classes found under this program.');
    }

    const components: GradingSchemeComponentDto[] = template.components.map((c) => ({
      name:     c.name,
      type:     c.type as any,
      weight:   c.weight,
      maxScore: c.maxScore ?? undefined,
    }));

    this.validateWeights(components);

    // apply to each class — skip locked ones silently
    const results = await Promise.allSettled(
      classIds.map((classId) =>
        this.repo.upsertForClass(orgId, classId, dto.templateId, template.name, components),
      ),
    );

    const applied = results.filter((r) => r.status === 'fulfilled').length;
    const skipped = results.filter((r) => r.status === 'rejected').length;

    return { applied, skipped, total: classIds.length };
  }

  async lockForClass(classId: string) {
    return this.repo.lockByClassId(classId);
  }
}