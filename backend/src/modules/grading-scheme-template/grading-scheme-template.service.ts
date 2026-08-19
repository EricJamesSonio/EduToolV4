// filepath: src/modules/grading-scheme-template/grading-scheme-template.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
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
import {
  findEducatorProgramTypes,
  getClassProgramType,
} from '../program/program-type-resolver';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class GradingSchemeTemplateService {
  constructor(
    private readonly repo: GradingSchemeTemplateRepository,
    private readonly gradingSchemeRepo: GradingSchemeRepository,
    private readonly db: DatabaseService,
  ) {}

  private validateWeights(
    components: GradingSchemeTemplateComponentDto[],
  ): void {
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

  async findForEducator(
    orgId: string,
    educatorId: string,
    programType?: string,
  ) {
    const programTypes = await findEducatorProgramTypes(
      this.db,
      educatorId,
      orgId,
    );
    return this.repo.findByProgramTypes(orgId, programTypes, programType);
  }

  async findById(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId);
    if (!template)
      throw new NotFoundException('Grading scheme template not found.');
    return template;
  }

  async create(orgId: string, dto: CreateGradingSchemeTemplateDto) {
    const existing = await this.repo.findByName(orgId, dto.name);
    if (existing) {
      throw new ConflictException(
        'A grading scheme template with this name already exists.',
      );
    }
    this.validateWeights(dto.components);
    return this.repo.create(orgId, dto.name, dto.programType, dto.components);
  }

  async update(id: string, orgId: string, dto: UpdateGradingSchemeTemplateDto) {
    await this.findById(id, orgId); // throws if not found
    if (dto.components) this.validateWeights(dto.components);
    const updated = await this.repo.update(id, orgId, {
      name: dto.name,
      programType: dto.programType,
      components: dto.components,
    });
    if (!updated)
      throw new NotFoundException('Grading scheme template not found.');
    return updated;
  }

  async delete(id: string, orgId: string) {
    await this.findById(id, orgId); // throws if not found
    await this.repo.delete(id, orgId);
  }

  /**
   * Resolve the grading-scheme template currently "in effect" for a program.
   * Derived from the template_id stamped on the grading schemes of the program's
   * classes: the template used by the most classes (ties → most recently applied).
   */
  private async resolveProgramTemplate(
    orgId: string,
    programId: string,
    schoolYearId?: string,
  ): Promise<{
    templateId: string;
    templateName: string;
    classCount: number;
  } | null> {
    const classIds = await this.gradingSchemeRepo.findClassIdsByProgram(
      programId,
      orgId,
      schoolYearId,
    );
    if (classIds.length === 0) return null;

    const schemes = await this.db.gradingScheme.findMany({
      where: {
        org_id: orgId,
        class_id: { in: classIds },
        template_id: { not: null },
      },
      select: { template_id: true, created_at: true },
    });
    if (schemes.length === 0) return null;

    const usage = new Map<string, { count: number; latest: number }>();
    for (const scheme of schemes) {
      const key = scheme.template_id!;
      const entry = usage.get(key) ?? { count: 0, latest: 0 };
      entry.count += 1;
      entry.latest = Math.max(
        entry.latest,
        new Date(scheme.created_at).getTime(),
      );
      usage.set(key, entry);
    }

    let best: { templateId: string; count: number; latest: number } | null =
      null;
    for (const [templateId, entry] of usage.entries()) {
      if (
        !best ||
        entry.count > best.count ||
        (entry.count === best.count && entry.latest > best.latest)
      ) {
        best = { templateId, count: entry.count, latest: entry.latest };
      }
    }

    if (!best) return null;

    const template = await this.repo.findById(best.templateId, orgId);
    if (!template) return null;

    return {
      templateId: template.id,
      templateName: template.name,
      classCount: classIds.length,
    };
  }

  async getProgramAssignments(orgId: string, schoolYearId?: string) {
    const programs = await this.db.program.findMany({
      where: {
        org_id: orgId,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    });

    const assignments = await Promise.all(
      programs.map(async (program) => {
        const resolved = await this.resolveProgramTemplate(
          orgId,
          program.id,
          schoolYearId,
        );
        return {
          programId: program.id,
          programName: program.name,
          programType: program.type,
          templateId: resolved?.templateId ?? null,
          templateName: resolved?.templateName ?? null,
          classCount: resolved?.classCount ?? 0,
        };
      }),
    );

    return assignments;
  }

  /**
   * Return the template currently stamped on each class's grading scheme.
   * Used by the admin "Assign to Class" panel so it can reflect the actual
   * template inherited by every class (including ones auto-applied on creation).
   */
  async getClassAssignments(
    orgId: string,
    schoolYearId?: string,
  ): Promise<
    Array<{ classId: string; templateId: string; templateName: string }>
  > {
    const classes = await this.db.class.findMany({
      where: {
        org_id: orgId,
        deleted_at: null,
        ...(schoolYearId ? { school_year_id: schoolYearId } : {}),
      },
      select: { id: true },
    });
    if (classes.length === 0) return [];

    const schemes = await this.db.gradingScheme.findMany({
      where: {
        org_id: orgId,
        class_id: { in: classes.map((c) => c.id) },
        template_id: { not: null },
      },
      select: { class_id: true, template_id: true },
    });

    const templateIds = Array.from(
      new Set(schemes.map((s) => s.template_id!).filter(Boolean)),
    );
    const templates = templateIds.length
      ? await this.db.gradingSchemeTemplate.findMany({
          where: { id: { in: templateIds }, org_id: orgId },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(templates.map((t) => [t.id, t.name]));

    const byClass = new Map<
      string,
      { templateId: string; templateName: string }
    >();
    for (const scheme of schemes) {
      if (!scheme.template_id) continue;
      const name = nameById.get(scheme.template_id);
      if (!name) continue;
      byClass.set(scheme.class_id, {
        templateId: scheme.template_id,
        templateName: name,
      });
    }

    return classes
      .filter((c) => byClass.has(c.id))
      .map((c) => ({
        classId: c.id,
        templateId: byClass.get(c.id)!.templateId,
        templateName: byClass.get(c.id)!.templateName,
      }));
  }

  async removeProgramAssignment(
    orgId: string,
    programId: string,
    schoolYearId?: string,
  ) {
    const classIds = await this.gradingSchemeRepo.findClassIdsByProgram(
      programId,
      orgId,
      schoolYearId,
    );
    if (classIds.length === 0) {
      return { success: true, removedCount: 0 };
    }

    const resolved = await this.resolveProgramTemplate(
      orgId,
      programId,
      schoolYearId,
    );
    if (!resolved) {
      return { success: true, removedCount: 0 };
    }

    // Remove only the schemes that came from the program's resolved template,
    // leaving educator-customized / other-template schemes untouched.
    const schemes = await this.db.gradingScheme.findMany({
      where: {
        org_id: orgId,
        class_id: { in: classIds },
        template_id: resolved.templateId,
      },
      select: { id: true },
    });
    const schemeIds = schemes.map((s) => s.id);

    if (schemeIds.length > 0) {
      await this.db.$transaction([
        this.db.gradingSchemeComponent.deleteMany({
          where: { grading_scheme_id: { in: schemeIds } },
        }),
        this.db.gradingScheme.deleteMany({
          where: { id: { in: schemeIds } },
        }),
      ]);
    }

    return { success: true, removedCount: schemeIds.length };
  }

  /**
   * Best-effort auto-apply for newly created classes: if a template is already
   * in effect for the class's program (and its program type matches), apply it.
   * Never overrides an existing grading scheme on the class.
   */
  async autoApplyForNewClass(
    orgId: string,
    classId: string,
    programId: string,
    schoolYearId: string,
    programType: string,
  ) {
    const existing = await this.gradingSchemeRepo.findByClassId(classId, orgId);
    if (existing) return;

    const resolved = await this.resolveProgramTemplate(
      orgId,
      programId,
      schoolYearId,
    );
    if (!resolved) return;

    const template = await this.repo.findById(resolved.templateId, orgId);
    if (!template) return;

    // Guard: only auto-apply when the template's program type matches the class.
    if (template.programType && template.programType !== programType) return;

    await this.gradingSchemeRepo.upsertForClass(
      orgId,
      classId,
      template.id,
      template.name,
      template.components.map((c) => ({
        name: c.name,
        type: c.type,
        weight: c.weight,
        maxScore: c.maxScore,
        isOptional: false,
      })),
    );
  }

  async applyToClass(orgId: string, dto: ApplyTemplateToClassDto) {
    // Get template
    const template = await this.findById(dto.templateId, orgId);

    // Guard: template program type must match the target class's program type
    const classProgramType = await getClassProgramType(
      this.db,
      dto.classId,
      orgId,
    );
    if (template.programType && classProgramType !== template.programType) {
      throw new BadRequestException(
        `Template type "${template.programType}" does not match the class program type "${classProgramType}".`,
      );
    }

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

    // Guard: template program type must match the target program type
    const program = await this.db.program.findFirst({
      where: { id: dto.programId, org_id: orgId },
      select: { type: true },
    });
    if (!program) {
      throw new NotFoundException('Program not found.');
    }
    if (template.programType && program.type !== template.programType) {
      throw new BadRequestException(
        `Template type "${template.programType}" does not match program type "${program.type}".`,
      );
    }

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
        ),
      ),
    );

    return { success: true, appliedCount: results.length };
  }
}
