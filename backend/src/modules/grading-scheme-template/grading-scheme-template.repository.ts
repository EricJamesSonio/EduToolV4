// filepath: src/modules/grading-scheme-template/grading-scheme-template.repository.ts

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { GradingSchemeTemplateComponentDto } from './dto/grading-scheme-template.dto';
import { Prisma } from '@prisma/client';

const COMPONENTS_INCLUDE = {
  components: { orderBy: { created_at: 'asc' as const } },
} satisfies Prisma.GradingSchemeTemplateInclude;

function mapComponent(c: any) {
  return {
    id: c.id,
    orgId: c.org_id,
    templateId: c.template_id,
    name: c.name,
    type: c.type,
    weight: c.weight,
    maxScore: c.max_score,
  };
}

function mapTemplate(t: any) {
  return {
    id: t.id,
    orgId: t.org_id,
    name: t.name,
    programType: t.program_type,
    createdAt: t.created_at,
    components: t.components?.map(mapComponent) ?? [],
  };
}

@Injectable()
export class GradingSchemeTemplateRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(orgId: string, programType?: string) {
    const templates = await this.db.gradingSchemeTemplate.findMany({
      where: {
        org_id: orgId,
        ...(programType ? { program_type: programType } : {}),
      },
      include: COMPONENTS_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
    return templates.map(mapTemplate);
  }

  async findByName(orgId: string, name: string) {
    const template = await this.db.gradingSchemeTemplate.findFirst({
      where: { org_id: orgId, name },
      include: COMPONENTS_INCLUDE,
    });
    return template ? mapTemplate(template) : null;
  }

  async findByProgramTypes(
    orgId: string,
    programTypes: string[],
    programType?: string,
  ) {
    if (programTypes.length === 0) return [];

    const types = programType
      ? programTypes.filter((t) => t === programType)
      : programTypes;

    if (types.length === 0) return [];

    const templates = await this.db.gradingSchemeTemplate.findMany({
      where: {
        org_id: orgId,
        program_type: { in: types },
      },
      include: COMPONENTS_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
    return templates.map(mapTemplate);
  }

  async findById(id: string, orgId: string) {
    const template = await this.db.gradingSchemeTemplate.findFirst({
      where: { id, org_id: orgId },
      include: COMPONENTS_INCLUDE,
    });
    return template ? mapTemplate(template) : null;
  }

  async create(
    orgId: string,
    name: string,
    programType: string | undefined,
    components: GradingSchemeTemplateComponentDto[],
  ) {
    const template = await this.db.gradingSchemeTemplate.create({
      data: {
        org_id: orgId,
        name,
        program_type: programType ?? null,
        components: {
          create: components.map((c) => ({
            org_id: orgId,
            name: c.name,
            type: c.type,
            weight: c.weight,
            max_score: c.maxScore ?? null,
          })),
        },
      },
      include: COMPONENTS_INCLUDE,
    });
    return mapTemplate(template);
  }

  async update(
    id: string,
    orgId: string,
    data: {
      name?: string;
      programType?: string;
      components?: GradingSchemeTemplateComponentDto[];
    },
  ) {
    const updated = await this.db.$transaction(async (tx) => {
      await tx.gradingSchemeTemplate.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.programType !== undefined
            ? { program_type: data.programType }
            : {}),
        },
      });

      if (data.components !== undefined) {
        await tx.gradingSchemeTemplateComponent.deleteMany({
          where: { template_id: id },
        });
        await tx.gradingSchemeTemplateComponent.createMany({
          data: data.components.map((c) => ({
            org_id: orgId,
            template_id: id,
            name: c.name,
            type: c.type,
            weight: c.weight,
            max_score: c.maxScore ?? null,
          })),
        });
      }

      return tx.gradingSchemeTemplate.findUnique({
        where: { id },
        include: COMPONENTS_INCLUDE,
      });
    });

    return updated ? mapTemplate(updated) : null;
  }

  async delete(id: string, _orgId: string) {
    // components cascade via DB or we delete manually first
    await this.db.gradingSchemeTemplateComponent.deleteMany({
      where: { template_id: id },
    });
    await this.db.gradingSchemeTemplate.delete({
      where: { id },
    });
  }
}
